import {
  _decorator,
  Button,
  Component,
  Sprite,
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
import { showDialog } from "./DialogUtils";
import { GameCard } from "./GameCard";
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
  setSlotSide,
} from "./DeckSelectionState";
import { getSelectedMatchInfo } from "./MatchSelectionState";

const { ccclass } = _decorator;

const GRID_COLUMNS = 3;
const CARD_ASPECT_RATIO = 150 / 223;

@ccclass("DeckSelectionController")
export class DeckSelectionController extends Component {
  onLoad(): void {
    void this.render();
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
      this.positionCardNode(grid, cardNode, index, cardWidth, cardHeight, spacing);

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

  private renderPileNumbers(canvas: Node): void {
    this.setLabelText(canvas, "DrawPile/Number", `${getDrawPileCount()}`);
    this.setLabelText(
      canvas,
      "SelectedPile/Number",
      `${getSelectedCardIds().length}/${getSelectedLimit()}`,
    );
    this.setLabelText(canvas, "DiscardPile/Number", `${getDiscardedCardIds().length}`);
    this.setLabelText(canvas, "againBtn/Number", `${getRedrawRemaining()}`);

    const againButton = canvas.getChildByName("againBtn");
    const button = againButton?.getComponent(Button);
    const sprite = againButton?.getComponent(Sprite);
    const isEnabled = getRedrawRemaining() > 0;
    if (button) {
      button.interactable = isEnabled;
    }
    if (sprite) {
      sprite.grayscale = !isEnabled;
    }
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
    if (!againButton) {
      return;
    }

    againButton.off(Node.EventType.TOUCH_END);
    againButton.on(Node.EventType.TOUCH_END, () => {
      if (!redealCards()) {
        return;
      }

      void this.render();
    });
  }

  private computeCardMetrics(
    grid: Node,
  ): { cardWidth: number; cardHeight: number; spacing: number } {
    const gridWidth = grid.getComponent(UITransform)?.contentSize.width ?? 0;
    const spacing = Math.max(1, Math.round(gridWidth / 26));
    const cardWidth = Math.round(spacing * 8);
    const cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);
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
    const totalHeight = rowCount * cardHeight + Math.max(0, rowCount - 1) * spacing;
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
}
