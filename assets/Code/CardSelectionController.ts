import {
  _decorator,
  Color,
  Component,
  director,
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
import { GameCard } from "./GameCard";
import { clearSelectedCardId, getSelectedCardId } from "./CardSelectionState";

const { ccclass } = _decorator;

@ccclass("CardSelectionController")
export class CardSelectionController extends Component {
  onLoad(): void {
    void this.render();
  }

  private async render(): Promise<void> {
    const canvas = this.node.parent;
    if (!canvas) {
      return;
    }

    const cardId = getSelectedCardId() ?? 200;
    const card = getCardDefinition(cardId);
    if (!card) {
      return;
    }

    const content = this.ensureContentRoot(canvas);
    content.removeAllChildren();

    this.createBackButton(content);
    await this.createCard(content, card.id);
    this.createTextBlock(content, "Title", card.title, 56, true);
    this.createTextBlock(content, "Content", card.content, 36, false);
    this.createTextBlock(content, "Effect", card.effect, 34, false);
  }

  private ensureContentRoot(canvas: Node): Node {
    let root = canvas.getChildByName("CardSelectionContent");
    if (root) {
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
    layout.spacingY = 30;
    layout.paddingTop = 180;
    layout.paddingLeft = 56;
    layout.paddingRight = 56;
    layout.paddingBottom = 80;

    return root;
  }

  private createBackButton(parent: Node): void {
    const buttonNode = new Node("BackLabel");
    parent.addChild(buttonNode);

    const transform = buttonNode.addComponent(UITransform);
    transform.setContentSize(200, 48);

    const label = buttonNode.addComponent(Label);
    label.string = "< \u8fd4\u56de";
    label.fontSize = 34;
    label.lineHeight = 40;
    label.color = new Color(255, 255, 255, 255);
    label.isBold = true;

    buttonNode.on(Node.EventType.TOUCH_END, () => {
      clearSelectedCardId();
      director.loadScene("DeckSelection");
    });
  }

  private async createCard(parent: Node, cardId: number): Promise<void> {
    const holder = new Node("CardHolder");
    parent.addChild(holder);

    const transform = holder.addComponent(UITransform);
    transform.setContentSize(750, 760);

    const prefab = await this.loadPrefab();
    const cardNode = instantiate(prefab);
    holder.addChild(cardNode);
    cardNode.setPosition(new Vec3(0, 0, 0));

    const gameCard = cardNode.getComponent(GameCard);
    if (gameCard) {
      gameCard.setOpenSceneOnFace(false);
      gameCard.setCardSize(460, 690);
      await gameCard.configure(cardId);
      await gameCard.showFaceInstant();
    }
  }

  private createTextBlock(
    parent: Node,
    name: string,
    text: string,
    fontSize: number,
    bold: boolean,
  ): void {
    const node = new Node(name);
    parent.addChild(node);

    const transform = node.addComponent(UITransform);
    transform.setContentSize(638, bold ? 72 : 120);

    const label = node.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 12;
    label.color = new Color(255, 255, 255, 255);
    label.isBold = bold;
    label.enableWrapText = true;
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
