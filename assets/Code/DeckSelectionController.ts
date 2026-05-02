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
import { withLoadingOverlay } from "./LoadingOverlay";
import { fetchMatchById, MatchStatusKey } from "./MatchApi";
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
  setSavedDeckSubmissionMeta,
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
const FLY_HOLD_DURATION = 0.1;
const FLY_TRAVEL_DURATION = 0.5;
const SELECT_FLY_END_SCALE = 0.22;
const DISCARD_FLY_END_SCALE = 0.18;
const DISCARD_FLY_END_ROTATION_Z = 25;

type FlyKind = "select" | "discard";

@ccclass("DeckSelectionController")
export class DeckSelectionController extends Component {
  private againMotionHandle: PulseMotionHandle | null = null;
  private dealingTweens: Tween<Node>[] = [];
  private flyTween: Tween<Node> | null = null;
  private flyCardNode: Node | null = null;

  onLoad(): void {
    void this.renderWithLoading();
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

    // 消费飞行动画起点(在渲染数字前,数字需要"延迟一格")
    const selectFlyOrigin = consumePendingSelectedFlyOrigin();
    const discardFlyOrigin = consumePendingDiscardedFlyOrigin();
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

    // 飞行动画(选中 / 弃牌)
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
      const deckCompleteDialog = await this.buildDeckCompleteDialog();
      await showDialog(canvas, {
        message: deckCompleteDialog.message,
        confirmLabel: "确定",
        onConfirm: () => {
          director.loadScene(deckCompleteDialog.targetScene);
        },
      });
    }
  }

  private async renderWithLoading(): Promise<void> {
    const canvas = this.node.parent;
    if (!canvas) {
      return;
    }

    await withLoadingOverlay(canvas, () => this.render());
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
          director.loadScene(
            getSelectedMatchInfo()?.entryScene ?? "PredictionList",
          );
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
    this.setLabelText(canvas, "DiscardPile/Number", `${displayedDiscarded}`);

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

        void this.renderWithLoading();
      });
      return;
    }

    againButtonBg.off(Node.EventType.TOUCH_END);
    againButtonBg.on(Node.EventType.TOUCH_END, () => {
      if (!redealCards()) {
        return;
      }

      void this.renderWithLoading();
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

  // ============== 飞行动画(选中 / 弃牌) ==============

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

    // 起点:槽位的网格局部坐标 → canvas 局部坐标
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

    // 终点:目标堆的 canvas 局部坐标
    const targetWorld = targetPile.getWorldPosition();
    const targetInCanvas = new Vec3();
    canvasTransform.convertToNodeSpaceAR(targetWorld, targetInCanvas);

    // 实例化飞行卡牌(挂在 canvas 上以避免 grid Mask 裁剪)
    const prefab = await this.loadPrefab("prefabs/GameCard");
    const flyingCard = instantiate(prefab);
    canvas.addChild(flyingCard);
    flyingCard.setSiblingIndex(canvas.children.length - 1);

    const gameCard = flyingCard.getComponent(GameCard);
    if (gameCard) {
      gameCard.setCardSize(cardWidth, cardHeight);
      gameCard.setOpenSceneOnFace(false);
      gameCard.setSideChangeHandler(null);
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
        .to(
          FLY_LIFT_DURATION,
          { scale: new Vec3(FLY_LIFT_SCALE, FLY_LIFT_SCALE, 1) },
          { easing: "backOut" },
        )
        .delay(FLY_HOLD_DURATION)
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

  private async buildDeckCompleteDialog(): Promise<{
    message: string;
    targetScene: "DeckView" | "ResultView";
  }> {
    const matchId = getSelectedMatchInfo()?.matchId;
    if (!matchId) {
      return {
        message: "卡组构建完毕，点击查看你的分数",
        targetScene: "ResultView",
      };
    }

    try {
      const match = await fetchMatchById(matchId);
      const dialogInfo = this.getDeckCompleteDialogInfo(match.statusKey);
      setSavedDeckSubmissionMeta(
        matchId,
        match.statusKey,
        dialogInfo.type,
        dialogInfo.buff,
      );
      return {
        message: dialogInfo.message,
        targetScene: dialogInfo.targetScene,
      };
    } catch (error) {
      console.error(
        "[DeckSelectionController] Failed to fetch match info for completion dialog",
        error,
      );
      return {
        message: "卡组构建完毕了，点击查看你的分数",
        targetScene: "ResultView",
      };
    }
  }

  private getDeckCompleteDialogInfo(matchStatusKey: MatchStatusKey): {
    message: string;
    type: "prediction" | "spoiler";
    buff: string[];
    targetScene: "DeckView" | "ResultView";
  } {
    if (matchStatusKey === "not-started") {
      return {
        message: "卡组构建完毕，比赛结果还未出炉，点击查看你已构建的卡组",
        type: "prediction",
        buff: [],
        targetScene: "DeckView",
      };
    }

    if (matchStatusKey === "in-progress") {
      return {
        message:
          "卡组构建完毕，但是太迟啦，比赛已经在进行中，你的分数将不会计入预测分数中，而是开卷分数中。鉴于比赛结果还未出炉，你的正确预测将附上1.5倍的buff。点击查看你已构建的卡组",
        type: "spoiler",
        buff: ["01"],
        targetScene: "DeckView",
      };
    }

    return {
      message:
        "卡组构建完毕，但是太太太迟啦，比赛已经结束辣，你的分数将不会计入预测分数中，而是开卷分数中。点击查看你开卷考试的分数",
      type: "spoiler",
      buff: [],
      targetScene: "ResultView",
    };
  }
}