import {
  _decorator,
  Component,
  director,
  instantiate,
  Node,
  Prefab,
  resources,
  Sprite,
  UITransform,
  Vec3,
  Widget,
} from "cc";
import { getSelectedCards, getSelectedCardsForMatch } from "./DeckSelectionState";
import { setFlagByCode } from "./FlagUtils";
import { GameCard } from "./GameCard";
import { withLoadingOverlay } from "./LoadingOverlay";
import { getSelectedMatchInfo } from "./MatchSelectionState";

const { ccclass } = _decorator;

const EDGE_PADDING = 30;
const CENTER_PADDING = 60;
const DECK_COLUMNS = 2;
const CARD_ASPECT_RATIO = 150 / 223;
const DEFAULT_DECK_HEIGHT = 980;
const DEFAULT_DECK_Y = -260;
const DEFAULT_FLAG_WIDTH = 150;
const DEFAULT_FLAG_HEIGHT = 100;
const DEFAULT_FLAG_Y = 590;

@ccclass("DeckViewController")
export class DeckViewController extends Component {
  onLoad(): void {
    const canvas = this.node.getComponent(UITransform)
      ? this.node
      : this.node.parent;
    if (!canvas) {
      return;
    }

    void withLoadingOverlay(canvas, () => this.render());
  }

  private async render(): Promise<void> {
    const canvas = this.node.getComponent(UITransform)
      ? this.node
      : this.node.parent;
    if (!canvas) {
      return;
    }

    canvas.getComponent(Widget)?.updateAlignment();

    const matchInfo = getSelectedMatchInfo();
    if (!matchInfo) {
      console.error("[DeckViewController] No selected match info was found.");
      return;
    }

    const canvasTransform = canvas.getComponent(UITransform);
    const sceneWidth = canvasTransform?.contentSize.width ?? 750;
    this.bindReturnButton(canvas);

    const leftFlag = this.ensureNode(canvas, "leftFlag", DEFAULT_FLAG_Y);
    const rightFlag = this.ensureNode(canvas, "rightFlag", DEFAULT_FLAG_Y);
    this.configureFlagNode(leftFlag, -sceneWidth / 4);
    this.configureFlagNode(rightFlag, sceneWidth / 4);
    await Promise.all([
      setFlagByCode(this.ensureSprite(leftFlag), matchInfo.homeCountryId),
      setFlagByCode(this.ensureSprite(rightFlag), matchInfo.awayCountryId),
    ]);

    const leftDeck = this.ensureNode(canvas, "leftDeck", DEFAULT_DECK_Y);
    const rightDeck = this.ensureNode(canvas, "rightDeck", DEFAULT_DECK_Y);
    this.configureDeckNode(leftDeck, sceneWidth, "left");
    this.configureDeckNode(rightDeck, sceneWidth, "right");

    const selectedCards =
      getSelectedCardsForMatch(matchInfo.matchId).length > 0
        ? getSelectedCardsForMatch(matchInfo.matchId)
        : getSelectedCards();
    const homeCode = matchInfo.homeCountryId.toLowerCase();
    const awayCode = matchInfo.awayCountryId.toLowerCase();
    const leftCards = selectedCards.filter(
      (card) => card.countryCode.toLowerCase() === homeCode,
    );
    const rightCards = selectedCards.filter(
      (card) => card.countryCode.toLowerCase() === awayCode,
    );

    const prefab = await this.loadPrefab("prefabs/GameCard");
    await Promise.all([
      this.renderDeckCards(
        leftDeck,
        leftCards.map((card) => card.cardId),
        prefab,
      ),
      this.renderDeckCards(
        rightDeck,
        rightCards.map((card) => card.cardId),
        prefab,
      ),
    ]);
  }

  private ensureNode(parent: Node, name: string, defaultY: number): Node {
    let node = parent.getChildByName(name);
    if (!node) {
      node = new Node(name);
      parent.addChild(node);
      node.setPosition(0, defaultY, 0);
    }

    if (!node.getComponent(UITransform)) {
      node.addComponent(UITransform);
    }

    return node;
  }

  private configureFlagNode(node: Node, horizontalCenter: number): void {
    const transform = node.getComponent(UITransform);
    transform?.setContentSize(DEFAULT_FLAG_WIDTH, DEFAULT_FLAG_HEIGHT);

    let widget = node.getComponent(Widget);
    if (!widget) {
      widget = node.addComponent(Widget);
    }

    widget.isAlignHorizontalCenter = true;
    widget.horizontalCenter = horizontalCenter;
    widget.updateAlignment();
  }

  private bindReturnButton(canvas: Node): void {
    const returnButton = canvas.getChildByName("returnBtn");
    if (!returnButton) {
      return;
    }

    returnButton.off(Node.EventType.TOUCH_END);
    returnButton.on(Node.EventType.TOUCH_END, () => {
      director.loadScene("PredictionList");
    });
  }

  private configureDeckNode(
    node: Node,
    sceneWidth: number,
    side: "left" | "right",
  ): void {
    let widget = node.getComponent(Widget);
    if (!widget) {
      widget = node.addComponent(Widget);
    }

    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.isAlignHorizontalCenter = false;

    if (side === "left") {
      widget.left = EDGE_PADDING;
      widget.right = sceneWidth / 2 + EDGE_PADDING;
    } else {
      widget.left = sceneWidth / 2 + EDGE_PADDING;
      widget.right = EDGE_PADDING;
    }

    widget.updateAlignment();
  }

  private async renderDeckCards(
    deck: Node,
    cardIds: number[],
    prefab: Prefab,
  ): Promise<void> {
    for (const child of [...deck.children]) {
      child.destroy();
    }

    const { cardWidth, cardHeight, spacing } = this.computeCardMetrics(
      deck,
      cardIds.length,
    );
    const transform = deck.getComponent(UITransform);
    console.log(
      `[DeckViewController] ${deck.name} size=${transform?.contentSize.width ?? 0}x${transform?.contentSize.height ?? 0}, card=${cardWidth}x${cardHeight}, spacing=${spacing}, count=${cardIds.length}`,
    );

    for (let index = 0; index < cardIds.length; index += 1) {
      const cardNode = instantiate(prefab);
      cardNode.name = `DeckCard-${cardIds[index]}`;
      cardNode.setScale(1, 1, 1);
      deck.addChild(cardNode);

      this.positionCardNode(
        deck,
        cardNode,
        index,
        cardIds.length,
        cardWidth,
        cardHeight,
        spacing,
      );

      const gameCard = cardNode.getComponent(GameCard);
      if (!gameCard) {
        continue;
      }

      gameCard.setCardSize(cardWidth, cardHeight);
      gameCard.setOpenSceneOnFace(false);
      await gameCard.configure(cardIds[index], "face");
    }
  }

  private computeCardMetrics(
    deck: Node,
    cardCount: number,
  ): {
    cardWidth: number;
    cardHeight: number;
    spacing: number;
  } {
    const transform = deck.getComponent(UITransform);
    const deckWidth = transform?.contentSize.width ?? 0;
    const deckHeight = transform?.contentSize.height ?? 0;
    const rowCount = Math.max(1, Math.ceil(cardCount / DECK_COLUMNS));

    const widthUnits = DECK_COLUMNS * 8 + (DECK_COLUMNS - 1);
    let spacing = Math.max(1, deckWidth / widthUnits);
    let cardWidth = spacing * 8;
    let cardHeight = cardWidth / CARD_ASPECT_RATIO;

    const totalHeight =
      rowCount * cardHeight + Math.max(0, rowCount - 1) * spacing;

    if (totalHeight > deckHeight && deckHeight > 0) {
      const heightSpacing =
        deckHeight / (rowCount * (8 / CARD_ASPECT_RATIO) + (rowCount - 1));
      spacing = Math.max(1, Math.floor(heightSpacing));
      cardWidth = Math.round(spacing * 8);
      cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);
    }

    return { cardWidth, cardHeight, spacing };
  }

  private positionCardNode(
    deck: Node,
    cardNode: Node,
    cardIndex: number,
    cardCount: number,
    cardWidth: number,
    cardHeight: number,
    spacing: number,
  ): void {
    const transform = deck.getComponent(UITransform);
    const deckHeight = transform?.contentSize.height ?? 0;
    const rowCount = Math.max(1, Math.ceil(cardCount / DECK_COLUMNS));
    const totalHeight =
      rowCount * cardHeight + Math.max(0, rowCount - 1) * spacing;
    const startY = totalHeight / 2 - cardHeight / 2;
    const row = Math.floor(cardIndex / DECK_COLUMNS);
    const column = cardIndex % DECK_COLUMNS;
    const cardsInRow = Math.min(DECK_COLUMNS, cardCount - row * DECK_COLUMNS);
    const rowWidth = cardsInRow * cardWidth + (cardsInRow - 1) * spacing;
    const startX = -rowWidth / 2 + cardWidth / 2;
    const x = startX + column * (cardWidth + spacing);
    const y = startY - row * (cardHeight + spacing);
    const verticalOffset = deckHeight / 2 - totalHeight / 2;

    cardNode.setPosition(new Vec3(x, y + verticalOffset, 0));
  }

  private ensureSprite(node: Node): Sprite {
    const existingSprite = this.findSprite(node);
    if (existingSprite) {
      return existingSprite;
    }

    return node.addComponent(Sprite);
  }

  private findSprite(node: Node): Sprite | null {
    const sprite = node.getComponent(Sprite);
    if (sprite) {
      return sprite;
    }

    for (const child of node.children) {
      const childSprite = this.findSprite(child);
      if (childSprite) {
        return childSprite;
      }
    }

    return null;
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
