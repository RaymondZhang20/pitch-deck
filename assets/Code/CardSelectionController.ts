import {
  _decorator,
  Button,
  Color,
  Component,
  director,
  EventHandler,
  instantiate,
  Label,
  Layout,
  Node,
  Prefab,
  resources,
  UITransform,
  Vec3,
  Widget,
} from "cc";
import { getCardDefinition } from "./CardCatalog";
import { clearSelectedCardId, getSelectedCardId } from "./CardSelectionState";
import { discardViewedCard, selectViewedCard } from "./DeckSelectionState";
import { GameCard } from "./GameCard";

const { ccclass } = _decorator;

@ccclass("CardSelectionController")
export class CardSelectionController extends Component {
  private currentCardId: number | null = null;

  onLoad(): void {
    void this.render();
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

    const content = this.ensureContentRoot(canvas);
    content.removeAllChildren();

    await this.createCard(content, card.id);
    this.createTextBlock(content, card.title, 56, true, 90);
    this.createTextBlock(content, card.content, 36, false, 120);
    this.createTextBlock(content, card.effect, 34, false, 110);
    this.bindButtons(canvas, card.id);
  }

  private ensureContentRoot(canvas: Node): Node {
    let root = canvas.getChildByName("CardSelectionContent");
    if (root) {
      this.placeContentAboveBackground(canvas, root);
      return root;
    }

    root = new Node("CardSelectionContent");
    canvas.addChild(root);

    const transform = root.addComponent(UITransform);
    transform.setContentSize(750, 1624);

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

    const layout = root.addComponent(Layout);
    layout.type = Layout.Type.VERTICAL;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
    layout.spacingY = 24;
    layout.paddingTop = 220;
    layout.paddingLeft = 56;
    layout.paddingRight = 56;
    layout.paddingBottom = 320;

    this.placeContentAboveBackground(canvas, root);

    return root;
  }

  private bindButtons(canvas: Node, _cardId: number): void {
    const returnButton = canvas.getChildByName("returnBtn");
    this.bringButtonToFront(canvas, returnButton);
    this.bindButtonClick(returnButton, "onReturnClick");

    const selectButton = canvas.getChildByName("selectBtn");
    this.bringButtonToFront(canvas, selectButton);
    this.bindButtonClick(selectButton, "onSelectClick");

    const discardButton = canvas.getChildByName("discardBtn");
    this.bringButtonToFront(canvas, discardButton);
    this.bindButtonClick(discardButton, "onDiscardClick");
  }

  private bringButtonToFront(canvas: Node, button: Node | null): void {
    if (!button) {
      return;
    }

    button.setSiblingIndex(canvas.children.length - 1);
  }

  private placeContentAboveBackground(canvas: Node, content: Node): void {
    const background = canvas.getChildByName("BG");
    if (!background) {
      return;
    }

    content.setSiblingIndex(background.getSiblingIndex() + 1);
  }

  private bindButtonClick(buttonNode: Node | null, handler: string): void {
    const button = buttonNode?.getComponent(Button);
    if (!button) {
      return;
    }

    const clickEvent = new EventHandler();
    clickEvent.target = this.node;
    clickEvent.component = "CardSelectionController";
    clickEvent.handler = handler;
    button.clickEvents = [clickEvent];
  }

  public onReturnClick(): void {
    clearSelectedCardId();
    director.loadScene("DeckSelection");
  }

  public onSelectClick(): void {
    if (this.currentCardId === null) {
      return;
    }

    selectViewedCard(this.currentCardId);
    clearSelectedCardId();
    director.loadScene("DeckSelection");
  }

  public onDiscardClick(): void {
    if (this.currentCardId === null) {
      return;
    }

    discardViewedCard(this.currentCardId);
    clearSelectedCardId();
    director.loadScene("DeckSelection");
  }

  private async createCard(parent: Node, cardId: number): Promise<void> {
    const holder = new Node("CardHolder");
    parent.addChild(holder);

    const transform = holder.addComponent(UITransform);
    transform.setContentSize(638, 760);

    const prefab = await this.loadPrefab();
    const cardNode = instantiate(prefab);
    holder.addChild(cardNode);
    cardNode.setPosition(new Vec3(0, 0, 0));

    const gameCard = cardNode.getComponent(GameCard);
    if (!gameCard) {
      return;
    }

    gameCard.setOpenSceneOnFace(false);
    gameCard.setSideChangeHandler(null);
    gameCard.setCardSize(460, 690);
    await gameCard.configure(cardId, "face");
  }

  private createTextBlock(
    parent: Node,
    text: string,
    fontSize: number,
    bold: boolean,
    height: number,
  ): void {
    const node = new Node("TextBlock");
    parent.addChild(node);

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
