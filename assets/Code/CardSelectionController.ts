import {
  _decorator,
  Button,
  Color,
  Component,
  director,
  EventTouch,
  instantiate,
  Label,
  Node,
  Prefab,
  resources,
  Sprite,
  UITransform,
  Vec3,
  Widget,
} from "cc";
import { getCardDefinition } from "./CardCatalog";
import { clearSelectedCardId, getSelectedCardId } from "./CardSelectionState";
import { selectViewedCard, discardViewedCard } from "./DeckSelectionState";
import { setFlagByCode } from "./FlagUtils";
import { GameCard } from "./GameCard";
import { getSelectedMatchInfo } from "./MatchSelectionState";

const { ccclass } = _decorator;

const CONTENT_WIDTH = 750;
const CONTENT_HEIGHT = 1624;
const CARD_WIDTH = 460;
const CARD_HEIGHT = 690;
const CARD_CENTER_Y = 120;
const MAX_DRAG_X = 250;
const MAX_FLAG_SCALE = 1.5;
const MAX_CARD_ROTATION = 18;

@ccclass("CardSelectionController")
export class CardSelectionController extends Component {
  private currentCardId: number | null = null;
  private contentRoot: Node | null = null;
  private cardHolder: Node | null = null;
  private cardNode: Node | null = null;
  private titleNode: Node | null = null;
  private contentNode: Node | null = null;
  private effectNode: Node | null = null;
  private leftFlagNode: Node | null = null;
  private rightFlagNode: Node | null = null;
  private assignmentMode = false;
  private dragStartPointerX = 0;
  private dragStartCardX = 0;

  onLoad(): void {
    void this.render();
  }

  onDestroy(): void {
    this.detachDragEvents();
  }

  private async render(): Promise<void> {
    const canvas = this.node.parent;
    if (!canvas) {
      return;
    }

    const cardId = getSelectedCardId();
    if (cardId === null) {
      director.loadScene("DeckSelection");
      return;
    }

    const card = getCardDefinition(cardId);
    if (!card) {
      director.loadScene("DeckSelection");
      return;
    }

    this.currentCardId = cardId;
    this.assignmentMode = false;

    const content = this.ensureContentRoot(canvas);
    content.removeAllChildren();
    this.contentRoot = content;
    this.leftFlagNode = null;
    this.rightFlagNode = null;

    await this.createCard(content, card.id);
    this.titleNode = this.createTextBlock(
      content,
      card.title,
      56,
      true,
      90,
      -360,
    );
    this.contentNode = this.createTextBlock(
      content,
      card.content,
      36,
      false,
      140,
      -480,
    );
    this.effectNode = this.createTextBlock(
      content,
      card.effect,
      34,
      false,
      120,
      -620,
    );
    this.setButtonsVisible(canvas, true);
    this.bindButtons(canvas);
  }

  private ensureContentRoot(canvas: Node): Node {
    let root = canvas.getChildByName("CardSelectionContent");
    if (!root) {
      root = new Node("CardSelectionContent");
      canvas.addChild(root);

      const transform = root.addComponent(UITransform);
      transform.setContentSize(CONTENT_WIDTH, CONTENT_HEIGHT);

      const widget = root.addComponent(Widget);
      widget.isAlignLeft = true;
      widget.isAlignRight = true;
      widget.isAlignTop = true;
      widget.isAlignBottom = true;
      widget.left = 0;
      widget.right = 0;
      widget.top = 0;
      widget.bottom = 0;
      widget.alignMode = 2;
    }

    const background = canvas.getChildByName("BG");
    if (background) {
      root.setSiblingIndex(background.getSiblingIndex() + 1);
    }

    return root;
  }

  private bindButtons(canvas: Node): void {
    this.bindButton(
      canvas.getChildByName("returnBtn"),
      this.onReturnClick.bind(this),
    );
    this.bindButton(
      canvas.getChildByName("selectBtn"),
      this.onSelectClick.bind(this),
    );
    this.bindButton(
      canvas.getChildByName("discardBtn"),
      this.onDiscardClick.bind(this),
    );
  }

  private bindButton(buttonNode: Node | null, handler: () => void): void {
    const button = buttonNode?.getComponent(Button);
    if (!button || !buttonNode) {
      return;
    }

    buttonNode.off(Node.EventType.TOUCH_END);
    buttonNode.on(Node.EventType.TOUCH_END, handler, this);
  }

  private setButtonsVisible(canvas: Node, visible: boolean): void {
    const buttonNames = ["returnBtn", "selectBtn", "discardBtn"];
    for (const name of buttonNames) {
      const node = canvas.getChildByName(name);
      if (node) {
        node.active = visible;
      }
    }
  }

  public onReturnClick(): void {
    if (this.assignmentMode) {
      return;
    }

    clearSelectedCardId();
    director.loadScene("DeckSelection");
  }

  public onSelectClick(): void {
    if (this.assignmentMode || this.currentCardId === null) {
      return;
    }

    void this.enterAssignmentMode();
  }

  public onDiscardClick(): void {
    if (this.assignmentMode || this.currentCardId === null) {
      return;
    }

    discardViewedCard(this.currentCardId);
    clearSelectedCardId();
    director.loadScene("DeckSelection");
  }

  private async enterAssignmentMode(): Promise<void> {
    const canvas = this.node.parent;
    const content = this.contentRoot;
    const holder = this.cardHolder;
    const cardNode = this.cardNode;
    const matchInfo = getSelectedMatchInfo();
    if (!canvas || !content || !holder || !cardNode || !matchInfo) {
      return;
    }

    this.assignmentMode = true;
    this.setButtonsVisible(canvas, false);
    this.setTextVisible(false);
    holder.setPosition(0, CARD_CENTER_Y, 0);
    cardNode.setRotationFromEuler(0, 0, 0);

    const leftFlag = this.ensureFlagNode(content, "LeftFlag", -220, 610);
    const rightFlag = this.ensureFlagNode(content, "RightFlag", 220, 610);
    this.leftFlagNode = leftFlag;
    this.rightFlagNode = rightFlag;

    await Promise.allSettled([
      setFlagByCode(leftFlag.getComponent(Sprite), matchInfo.homeCountryId),
      setFlagByCode(rightFlag.getComponent(Sprite), matchInfo.awayCountryId),
    ]);

    this.updateAssignmentVisuals(0);
    this.attachDragEvents();
  }

  private setTextVisible(visible: boolean): void {
    for (const node of [this.titleNode, this.contentNode, this.effectNode]) {
      if (node) {
        node.active = visible;
      }
    }
  }

  private ensureFlagNode(
    parent: Node,
    name: string,
    x: number,
    y: number,
  ): Node {
    let flagNode = parent.getChildByName(name);
    if (!flagNode) {
      flagNode = new Node(name);
      parent.addChild(flagNode);
      const transform = flagNode.addComponent(UITransform);
      transform.setContentSize(120, 80);
      flagNode.addComponent(Sprite);
    }

    flagNode.active = true;
    flagNode.setScale(1, 1, 1);
    flagNode.setPosition(x, y, 0);
    return flagNode;
  }

  private attachDragEvents(): void {
    const holder = this.cardHolder;
    if (!holder) {
      return;
    }

    this.detachDragEvents();
    holder.on(Node.EventType.TOUCH_START, this.onCardDragStart, this);
    holder.on(Node.EventType.TOUCH_MOVE, this.onCardDragMove, this);
    holder.on(Node.EventType.TOUCH_END, this.onCardDragEnd, this);
    holder.on(Node.EventType.TOUCH_CANCEL, this.onCardDragEnd, this);
  }

  private detachDragEvents(): void {
    if (!this.cardHolder) {
      return;
    }

    this.cardHolder.off(Node.EventType.TOUCH_START, this.onCardDragStart, this);
    this.cardHolder.off(Node.EventType.TOUCH_MOVE, this.onCardDragMove, this);
    this.cardHolder.off(Node.EventType.TOUCH_END, this.onCardDragEnd, this);
    this.cardHolder.off(Node.EventType.TOUCH_CANCEL, this.onCardDragEnd, this);
  }

  private onCardDragStart(event: EventTouch): void {
    if (!this.assignmentMode || !this.cardHolder || !this.contentRoot) {
      return;
    }

    const pointer = this.toLocalPoint(event);
    this.dragStartPointerX = pointer.x;
    this.dragStartCardX = this.cardHolder.position.x;
  }

  private onCardDragMove(event: EventTouch): void {
    if (!this.assignmentMode || !this.cardHolder) {
      return;
    }

    const pointer = this.toLocalPoint(event);
    const deltaX = pointer.x - this.dragStartPointerX;
    const nextX = clamp(this.dragStartCardX + deltaX, -MAX_DRAG_X, MAX_DRAG_X);
    this.cardHolder.setPosition(nextX, CARD_CENTER_Y, 0);
    this.updateAssignmentVisuals(nextX);
  }

  private onCardDragEnd(): void {
    if (
      !this.assignmentMode ||
      this.currentCardId === null ||
      !this.cardHolder
    ) {
      return;
    }

    const matchInfo = getSelectedMatchInfo();
    if (!matchInfo) {
      clearSelectedCardId();
      director.loadScene("DeckSelection");
      return;
    }

    const chosenCountryCode =
      this.cardHolder.position.x < 0
        ? matchInfo.homeCountryId
        : matchInfo.awayCountryId;

    this.detachDragEvents();
    selectViewedCard(this.currentCardId, chosenCountryCode);
    clearSelectedCardId();
    director.loadScene("DeckSelection");
  }

  private updateAssignmentVisuals(cardX: number): void {
    const cardNode = this.cardNode;
    if (cardNode) {
      const rotation = -(cardX / MAX_DRAG_X) * MAX_CARD_ROTATION;
      cardNode.setRotationFromEuler(0, 0, rotation);
    }

    const progress = Math.min(Math.abs(cardX) / MAX_DRAG_X, 1);
    const activeScale = 1 + Math.min(progress * 0.5, 0.5);
    const inactiveScale = 1;

    if (this.leftFlagNode) {
      const scale = cardX < 0 ? activeScale : inactiveScale;
      this.leftFlagNode.setScale(scale, scale, 1);
    }

    if (this.rightFlagNode) {
      const scale = cardX > 0 ? activeScale : inactiveScale;
      this.rightFlagNode.setScale(scale, scale, 1);
    }
  }

  private toLocalPoint(event: EventTouch): Vec3 {
    const uiTransform = this.contentRoot?.getComponent(UITransform);
    if (!uiTransform || !this.contentRoot) {
      return new Vec3();
    }

    const location = event.getUILocation();
    return uiTransform.convertToNodeSpaceAR(
      new Vec3(location.x, location.y, 0),
    );
  }

  private async createCard(parent: Node, cardId: number): Promise<void> {
    const holder = new Node("CardHolder");
    parent.addChild(holder);
    holder.setPosition(0, CARD_CENTER_Y, 0);

    const transform = holder.addComponent(UITransform);
    transform.setContentSize(638, 760);

    const prefab = await this.loadPrefab();
    const cardNode = instantiate(prefab);
    holder.addChild(cardNode);
    cardNode.setPosition(new Vec3(0, 0, 0));

    const gameCard = cardNode.getComponent(GameCard);
    if (gameCard) {
      gameCard.setOpenSceneOnFace(false);
      gameCard.setSideChangeHandler(null);
      gameCard.setCardSize(CARD_WIDTH, CARD_HEIGHT);
      await gameCard.configure(cardId, "face");
    }

    this.cardHolder = holder;
    this.cardNode = cardNode;
  }

  private createTextBlock(
    parent: Node,
    text: string,
    fontSize: number,
    bold: boolean,
    height: number,
    y: number,
  ): Node {
    const node = new Node("TextBlock");
    parent.addChild(node);
    node.setPosition(0, y, 0);

    const transform = node.addComponent(UITransform);
    transform.setContentSize(638, height);

    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 12;
    label.color = new Color(255, 255, 255, 255);
    label.isBold = bold;
    label.enableWrapText = true;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;

    return node;
  }

  private loadPrefab(): Promise<Prefab> {
    return new Promise((resolve, reject) => {
      resources.load("prefabs/GameCard", Prefab, (err, asset) => {
        if (err || !asset) {
          reject(err ?? new Error("Failed to load GameCard prefab"));
          return;
        }

        resolve(asset);
      });
    });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
