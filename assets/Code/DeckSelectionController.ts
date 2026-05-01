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
  resources,
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
  consumeDeckCompleteNotice,
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

@ccclass("DeckSelectionController")
export class DeckSelectionController extends Component {
  private againMotionHandle: PulseMotionHandle | null = null;

  onLoad(): void {
    void this.renderWithLoading();
  }

  onDestroy(): void {
    this.stopAgainButtonMotion();
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
    this.renderPileNumbers(canvas);

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
    grid.removeAllChildren();

    const { cardWidth, cardHeight, spacing } = this.computeCardMetrics(grid);
    const prefab = await this.loadPrefab("prefabs/GameCard");
    const slots = getDeckSlots();

    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (typeof slot.cardId !== "number") {
        continue;
      }

      const cardId = slot.cardId;
      const cardNode = instantiate(prefab);
      grid.addChild(cardNode);
      this.positionCardNode(
        grid,
        cardNode,
        index,
        cardWidth,
        cardHeight,
        spacing,
      );

      const gameCard = cardNode.getComponent(GameCard);
      if (!gameCard) {
        continue;
      }

      gameCard.setCardSize(cardWidth, cardHeight);
      gameCard.setOpenSceneOnFace(true);
      gameCard.setSideChangeHandler((side) => {
        setSlotSide(cardId, side);
      });
      await gameCard.configure(cardId, slot.side);
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

  private renderPileNumbers(canvas: Node): void {
    this.setLabelText(canvas, "DrawPile/Number", `${getDrawPileCount()}`);
    this.setLabelText(
      canvas,
      "SelectedPile/Number",
      `${getSelectedCardIds().length}/${getSelectedLimit()}`,
    );
    this.setLabelText(
      canvas,
      "DiscardPile/Number",
      `${getDiscardedCardIds().length}`,
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

  private positionCardNode(
    grid: Node,
    cardNode: Node,
    slotIndex: number,
    cardWidth: number,
    cardHeight: number,
    spacing: number,
  ): void {
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

    cardNode.setPosition(new Vec3(x, y + verticalOffset, 0));
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
        message: "卡组构建完毕，点击查看你的分数",
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
