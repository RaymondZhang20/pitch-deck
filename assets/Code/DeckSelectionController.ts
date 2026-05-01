import {
  _decorator,
  Button,
  Component,
  Sprite,
  Widget,
  director,
  instantiate,
  Label,
  Mask,
  Node,
  Prefab,
  Quat,
  resources,
  tween,
  Tween,
  UITransform,
  Vec3,
} from "cc";
import type { PulseMotionHandle } from "./ButtonMotionUtils";
import { startPulseMotion, stopPulseMotion } from "./ButtonMotionUtils";
import { showDialog } from "./DialogUtils";
import { GameCard } from "./GameCard";
import {
  clearDeckSelectionState,
  consumeDealAnimation,
  consumeDeckCompleteNotice,
  consumePendingDiscardedFlyOrigin,
  consumePendingSelectedFlyOrigin,
  ensureDeckSelectionState,
  getDeckSlots,
  getDiscardedCardIds,
  getDrawPileCount,
  getRedrawRemaining,
  getSelectedCardIds,
  getSelectedLimit,
  redealCards,
  setSlotSide,
} from "./DeckSelectionState";
import { getSelectedMatchInfo } from "./MatchSelectionState";

const { ccclass } = _decorator;

const GRID_COLUMNS = 3;
const CARD_ASPECT_RATIO = 150 / 223;

// 发牌动画参数
const DEAL_STAGGER = 0.07;
const DEAL_DURATION = 0.35;
const DEAL_START_SCALE = 0.4;
const DEAL_START_ROTATION_Z = -15;

// 飞行动画通用参数
const FLY_LIFT_DURATION = 0.18;
const FLY_LIFT_SCALE = 1.12;
const FLY_HOLD_DURATION = 0.12;
const FLY_TRAVEL_DURATION = 0.55;

// 选中飞行的终点缩放
const SELECT_FLY_END_SCALE = 0.22;
// 弃牌飞行的终点缩放(更小,像被丢开)
const DISCARD_FLY_END_SCALE = 0.18;
// 弃牌飞行落地时的旋转(度),增加"丢出去"的视觉感
const DISCARD_FLY_END_ROTATION_Z = 25;

type FlyKind = "select" | "discard";

@ccclass("DeckSelectionController")
export class DeckSelectionController extends Component {
  private againMotionHandle: PulseMotionHandle | null = null;
  private dealingTweens: Tween<Node>[] = [];
  private flyTween: Tween<Node> | null = null;
  private flyCardNode: Node | null = null;

  onLoad(): void {
    void this.render();
  }

  onDestroy(): void {
    this.stopAgainButtonMotion();
    this.stopDealAnimations();
    this.stopFlyAnimation();
  }

  private async render(): Promise<void> {
    const canvas = this.node.parent;
    if (!canvas) {
      return;
    }

    ensureDeckSelectionState(getSelectedMatchInfo());
    this.hideTitle(canvas);
    this.bindReturnButton(canvas);
    this.bindAgainButton(canvas);

    // 同时消费两类飞行动画的起点
    const selectFlyOrigin = consumePendingSelectedFlyOrigin();
    const discardFlyOrigin = consumePendingDiscardedFlyOrigin();

    // 飞行动画期间,目标计数先显示动画前的旧值
    this.renderPileNumbers(canvas, {
      deferSelected: selectFlyOrigin !== null,
      deferDiscarded: discardFlyOrigin !== null,
    });

    const grid = canvas.getChildByName("CardGrid");
    if (!grid) {
      console.error(
        "[DeckSelectionController] CardGrid node was not found in DeckSelection.scene",
      );
      return;
    }

    this.configureGrid(grid);
    canvas.getComponent(Widget)?.updateAlignment();
    grid.getComponent(Widget)?.updateAlignment();

    this.stopDealAnimations();
    grid.removeAllChildren();

    const { cardWidth, cardHeight, spacing } = this.computeCardMetrics(grid);
    const prefab = await this.loadPrefab("prefabs/GameCard");
    const slots = getDeckSlots();

    const shouldPlayDeal = consumeDealAnimation();
    const dealFrom = shouldPlayDeal
      ? this.getDealStartPosition(canvas, grid)
      : null;

    let dealOrder = 0;
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (typeof slot.cardId !== "number") {
        continue;
      }

      const cardId = slot.cardId;
      const cardNode = instantiate(prefab);
      grid.addChild(cardNode);

      const targetPos = this.computeCardPosition(
        grid,
        index,
        cardWidth,
        cardHeight,
        spacing,
      );

      const gameCard = cardNode.getComponent(GameCard);
      if (gameCard) {
        gameCard.setCardSize(cardWidth, cardHeight);
        gameCard.setOpenSceneOnFace(true);
        gameCard.setSideChangeHandler((side) => {
          setSlotSide(cardId, side);
        });
        await gameCard.configure(cardId, slot.side);
      }

      if (shouldPlayDeal && dealFrom) {
        this.playDealAnimation(cardNode, dealFrom, targetPos, dealOrder);
        dealOrder += 1;
      } else {
        cardNode.setPosition(targetPos);
        cardNode.setScale(1, 1, 1);
        const idRot = new Quat();
        Quat.fromEuler(idRot, 0, 0, 0);
        cardNode.setRotation(idRot);
      }
    }

    // 选中飞行 & 弃牌飞行(若两者同时存在,优先选中再弃牌;一般不会同时发生)
    if (selectFlyOrigin) {
      await this.playFlyAnimation(
        canvas,
        grid,
        "select",
        selectFlyOrigin.cardId,
        selectFlyOrigin.slotIndex,
        cardWidth,
        cardHeight,
        spacing,
      );
      this.setLabelText(
        canvas,
        "SelectedPile/Number",
        `${getSelectedCardIds().length}/${getSelectedLimit()}`,
      );
    }

    if (discardFlyOrigin) {
      await this.playFlyAnimation(
        canvas,
        grid,
        "discard",
        discardFlyOrigin.cardId,
        discardFlyOrigin.slotIndex,
        cardWidth,
        cardHeight,
        spacing,
      );
      this.setLabelText(
        canvas,
        "DiscardPile/Number",
        `${getDiscardedCardIds().length}`,
      );
    }

    if (consumeDeckCompleteNotice()) {
      await showDialog(canvas, {
        message: "已选完卡组",
        confirmLabel: "确定",
      });
    }
  }

  private hideTitle(canvas: Node): void {
    const titleNode = canvas.getChildByName("DeckSelectionTitle");
    if (titleNode) {
      titleNode.active = false;
    }
  }

  private bindReturnButton(canvas: Node): void {
    const returnButton = canvas.getChildByName("returnBtn");
    if (!returnButton) {
      return;
    }

    returnButton.off(Node.EventType.TOUCH_END);
    returnButton.on(Node.EventType.TOUCH_END, () => {
      void showDialog(canvas, {
        message: "现在退出不会保存你已构建的卡组",
        confirmLabel: "确认",
        discardLabel: "取消",
        onConfirm: () => {
          clearDeckSelectionState();
          director.loadScene("PredictionList");
        },
      });
    });
  }

  private renderPileNumbers(
    canvas: Node,
    deferOptions: {
      deferSelected?: boolean;
      deferDiscarded?: boolean;
    } = {},
  ): void {
    this.setLabelText(canvas, "DrawPile/Number", `${getDrawPileCount()}`);

    const selectedCount = getSelectedCardIds().length;
    const displayedSelected = deferOptions.deferSelected
      ? Math.max(0, selectedCount - 1)
      : selectedCount;
    this.setLabelText(
      canvas,
      "SelectedPile/Number",
      `${displayedSelected}/${getSelectedLimit()}`,
    );

    const discardedCount = getDiscardedCardIds().length;
    const displayedDiscarded = deferOptions.deferDiscarded
      ? Math.max(0, discardedCount - 1)
      : discardedCount;
    this.setLabelText(
      canvas,
      "DiscardPile/Number",
      `${displayedDiscarded}`,
    );

    this.setLabelText(canvas, "againBtn/Number", `${getRedrawRemaining()}`);

    const againButton = canvas.getChildByName("againBtn");
    const againButtonBg = againButton?.getChildByName("BG");
    const button = againButtonBg?.getComponent(Button);
    const sprite = againButtonBg?.getComponent(Sprite);
    const isEnabled = getRedrawRemaining() > 0;
    if (button) {
      button.interactable = isEnabled;
    }
    if (sprite) {
      sprite.grayscale = !isEnabled;
    }

    this.updateAgainButtonMotion(againButton, isEnabled);
  }

  private setLabelText(canvas: Node, path: string, text: string): void {
    const node = this.getNodeByPath(canvas, path);
    const label = node?.getComponent(Label);
    if (label) {
      label.string = text;
    }
  }

  private configureGrid(grid: Node): void {
    let mask = grid.getComponent(Mask);
    if (!mask) {
      mask = grid.addComponent(Mask);
    }
    mask.type = Mask.Type.RECT;
  }

  private bindAgainButton(canvas: Node): void {
    const againButton = canvas.getChildByName("againBtn");
    const againButtonBg = againButton?.getChildByName("BG");
    if (!againButtonBg) {
      return;
    }

    const button = againButtonBg.getComponent(Button);
    if (button) {
      againButtonBg.off(Button.EventType.CLICK);
      againButtonBg.on(Button.EventType.CLICK, () => {
        if (!redealCards()) {
          return;
        }

        void this.render();
      });
      return;
    }

    againButtonBg.off(Node.EventType.TOUCH_END);
    againButtonBg.on(Node.EventType.TOUCH_END, () => {
      if (!redealCards()) {
        return;
      }

      void this.render();
    });
  }

  private updateAgainButtonMotion(
    againButton: Node | null,
    isEnabled: boolean,
  ): void {
    this.stopAgainButtonMotion();

    if (!againButton) {
      return;
    }

    const animatedNode = againButton.getChildByName("BG") ?? againButton;
    if (!isEnabled) {
      return;
    }

    this.againMotionHandle = startPulseMotion(animatedNode);
  }

  private stopAgainButtonMotion(): void {
    this.againMotionHandle = stopPulseMotion(this.againMotionHandle);
  }

  // ============== 发牌动画 ==============

  private getDealStartPosition(canvas: Node, grid: Node): Vec3 {
    const drawPile = canvas.getChildByName("DrawPile");
    const gridTransform = grid.getComponent(UITransform);
    if (!drawPile || !gridTransform) {
      return new Vec3(0, 0, 0);
    }

    const worldPos = drawPile.getWorldPosition();
    const local = new Vec3();
    gridTransform.convertToNodeSpaceAR(worldPos, local);
    return local;
  }

  private playDealAnimation(
    cardNode: Node,
    from: Vec3,
    to: Vec3,
    order: number,
  ): void {
    cardNode.setPosition(from);
    cardNode.setScale(DEAL_START_SCALE, DEAL_START_SCALE, 1);

    const startRot = new Quat();
    Quat.fromEuler(startRot, 0, 0, DEAL_START_ROTATION_Z);
    const endRot = new Quat();
    Quat.fromEuler(endRot, 0, 0, 0);
    cardNode.setRotation(startRot);

    cardNode.active = true;

    const cardTween = tween(cardNode)
      .delay(order * DEAL_STAGGER)
      .parallel(
        tween<Node>().to(
          DEAL_DURATION,
          { position: to },
          { easing: "cubicOut" },
        ),
        tween<Node>().to(
          DEAL_DURATION,
          { scale: new Vec3(1, 1, 1) },
          { easing: "backOut" },
        ),
        tween<Node>().to(
          DEAL_DURATION,
          { rotation: endRot },
          { easing: "cubicOut" },
        ),
      )
      .call(() => {
        const idx = this.dealingTweens.indexOf(cardTween);
        if (idx >= 0) {
          this.dealingTweens.splice(idx, 1);
        }
      })
      .start();

    this.dealingTweens.push(cardTween);
  }

  private stopDealAnimations(): void {
    for (const t of this.dealingTweens) {
      t.stop();
    }
    this.dealingTweens = [];
  }

  // ============== 通用飞行动画 ==============

  /**
   * 从该卡牌的原网格位置起飞,飞向指定堆。
   *  - kind === "select"  → 飞向左下角 SelectedPile
   *  - kind === "discard" → 飞向右下角 DiscardPile,带旋转
   */
  private async playFlyAnimation(
    canvas: Node,
    grid: Node,
    kind: FlyKind,
    cardId: number,
    slotIndex: number,
    cardWidth: number,
    cardHeight: number,
    spacing: number,
  ): Promise<void> {
    const targetPileName =
      kind === "select" ? "SelectedPile" : "DiscardPile";
    const targetPile = canvas.getChildByName(targetPileName);
    const canvasTransform = canvas.getComponent(UITransform);
    const gridTransform = grid.getComponent(UITransform);
    if (!targetPile || !canvasTransform || !gridTransform) {
      return;
    }

    // 1) 起点:槽位在网格中的局部坐标 → canvas 局部坐标
    const slotLocalInGrid = this.computeCardPosition(
      grid,
      slotIndex,
      cardWidth,
      cardHeight,
      spacing,
    );
    const slotWorld = new Vec3();
    gridTransform.convertToWorldSpaceAR(slotLocalInGrid, slotWorld);
    const startInCanvas = new Vec3();
    canvasTransform.convertToNodeSpaceAR(slotWorld, startInCanvas);

    // 2) 终点:目标堆在 canvas 局部坐标
    const targetWorld = targetPile.getWorldPosition();
    const targetInCanvas = new Vec3();
    canvasTransform.convertToNodeSpaceAR(targetWorld, targetInCanvas);

    // 3) 实例化飞行卡牌
    const prefab = await this.loadPrefab("prefabs/GameCard");
    const flyingCard = instantiate(prefab);
    canvas.addChild(flyingCard);
    flyingCard.setSiblingIndex(canvas.children.length - 1);

    const gameCard = flyingCard.getComponent(GameCard);
    if (gameCard) {
      gameCard.setCardSize(cardWidth, cardHeight);
      gameCard.setOpenSceneOnFace(false);
      gameCard.setSideChangeHandler(null);
      // 选中时玩家刚看过正面;弃牌动画也展示正面,让玩家明确看到丢的是哪张牌
      await gameCard.configure(cardId, "face");
    }

    flyingCard.setPosition(startInCanvas);
    flyingCard.setScale(1, 1, 1);
    const startRot = new Quat();
    Quat.fromEuler(startRot, 0, 0, 0);
    flyingCard.setRotation(startRot);

    this.flyCardNode = flyingCard;

    const endScale =
      kind === "select" ? SELECT_FLY_END_SCALE : DISCARD_FLY_END_SCALE;
    const endRotZ = kind === "select" ? 0 : DISCARD_FLY_END_ROTATION_Z;
    const endRot = new Quat();
    Quat.fromEuler(endRot, 0, 0, endRotZ);

    await new Promise<void>((resolve) => {
      const t = tween(flyingCard)
        // a) 原地略放大
        .to(
          FLY_LIFT_DURATION,
          { scale: new Vec3(FLY_LIFT_SCALE, FLY_LIFT_SCALE, 1) },
          { easing: "backOut" },
        )
        // b) 短暂悬停
        .delay(FLY_HOLD_DURATION)
        // c) 飞向目标堆
        .parallel(
          tween<Node>().to(
            FLY_TRAVEL_DURATION,
            { position: targetInCanvas },
            { easing: "cubicIn" },
          ),
          tween<Node>().to(
            FLY_TRAVEL_DURATION,
            { scale: new Vec3(endScale, endScale, 1) },
            { easing: "cubicIn" },
          ),
          tween<Node>().to(
            FLY_TRAVEL_DURATION,
            { rotation: endRot },
            { easing: "cubicIn" },
          ),
        )
        .call(() => {
          if (flyingCard.isValid) {
            flyingCard.destroy();
          }
          this.flyCardNode = null;
          this.flyTween = null;
          resolve();
        })
        .start();

      this.flyTween = t;
    });
  }

  private stopFlyAnimation(): void {
    if (this.flyTween) {
      this.flyTween.stop();
      this.flyTween = null;
    }
    if (this.flyCardNode && this.flyCardNode.isValid) {
      this.flyCardNode.destroy();
    }
    this.flyCardNode = null;
  }

  // ============== 布局相关 ==============

  private computeCardMetrics(grid: Node): {
    cardWidth: number;
    cardHeight: number;
    spacing: number;
  } {
    const gridTransform = grid.getComponent(UITransform);
    const gridWidth = gridTransform?.contentSize.width ?? 0;
    const gridHeight = gridTransform?.contentSize.height ?? 0;
    const rowCount = Math.max(
      1,
      Math.ceil(getDeckSlots().length / GRID_COLUMNS),
    );

    let spacing = Math.max(1, Math.round(gridWidth / 26));
    let cardWidth = Math.round(spacing * 8);
    let cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);

    const totalHeight =
      rowCount * cardHeight + Math.max(0, rowCount - 1) * spacing;

    if (totalHeight > gridHeight && gridHeight > 0) {
      const heightSpacing =
        gridHeight / (rowCount * (8 / CARD_ASPECT_RATIO) + (rowCount - 1));
      spacing = Math.max(1, Math.floor(heightSpacing));
      cardWidth = Math.round(spacing * 8);
      cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);
    }

    return { cardWidth, cardHeight, spacing };
  }

  private computeCardPosition(
    grid: Node,
    slotIndex: number,
    cardWidth: number,
    cardHeight: number,
    spacing: number,
  ): Vec3 {
    const gridTransform = grid.getComponent(UITransform);
    const gridHeight = gridTransform?.contentSize.height ?? 0;
    const rowCount = Math.ceil(getDeckSlots().length / GRID_COLUMNS);
    const totalHeight =
      rowCount * cardHeight + Math.max(0, rowCount - 1) * spacing;
    const startY = totalHeight / 2 - cardHeight / 2;
    const row = Math.floor(slotIndex / GRID_COLUMNS);
    const column = slotIndex % GRID_COLUMNS;
    const rowWidth = GRID_COLUMNS * cardWidth + (GRID_COLUMNS - 1) * spacing;
    const startX = -rowWidth / 2 + cardWidth / 2;
    const x = startX + column * (cardWidth + spacing);
    const y = startY - row * (cardHeight + spacing);
    const verticalOffset = gridHeight / 2 - totalHeight / 2;

    return new Vec3(x, y + verticalOffset, 0);
  }

  private getNodeByPath(root: Node, path: string): Node | null {
    const segments = path.split("/");
    let current: Node | null = root;

    for (const segment of segments) {
      current = current?.getChildByName(segment) ?? null;
      if (!current) {
        return null;
      }
    }

    return current;
  }

  private loadPrefab(path: string): Promise<Prefab> {
    return new Promise((resolve, reject) => {
      resources.load(path, Prefab, (err, asset) => {
        if (err || !asset) {
          reject(err ?? new Error(`Failed to load prefab at ${path}`));
          return;
        }

        resolve(asset);
      });
    });
  }
}