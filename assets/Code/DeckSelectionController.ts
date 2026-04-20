import {
  _decorator,
  Color,
  Component,
  instantiate,
  Label,
  Layout,
  Node,
  Prefab,
  resources,
  UITransform,
  Widget,
} from "cc";
import { getAllCardDefinitions } from "./CardCatalog";
import { GameCard } from "./GameCard";
import { getSelectedMatchInfo } from "./MatchSelectionState";

const { ccclass } = _decorator;

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

    const root = this.ensureRoot(canvas);
    root.removeAllChildren();
    this.createTitle(root);

    const grid = this.createGrid(root);
    const prefab = await this.loadPrefab();
    const cards = getAllCardDefinitions().slice(0, 6);

    for (const card of cards) {
      const cardNode = instantiate(prefab);
      grid.addChild(cardNode);

      const gameCard = cardNode.getComponent(GameCard);
      if (gameCard) {
        gameCard.setCardSize(210, 312);
        await gameCard.configure(card.id);
      }
    }
  }

  private ensureRoot(canvas: Node): Node {
    let root = canvas.getChildByName("DeckSelectionContent");
    if (root) {
      return root;
    }

    root = new Node("DeckSelectionContent");
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
    layout.paddingTop = 180;
    layout.paddingBottom = 80;
    layout.spacingY = 48;

    return root;
  }

  private createTitle(parent: Node): void {
    const titleNode = new Node("Title");
    parent.addChild(titleNode);

    const transform = titleNode.addComponent(UITransform);
    transform.setContentSize(750, 100);

    const label = titleNode.addComponent(Label);
    label.string = "\u62bd\u5230\u7684\u5361\u724c";
    label.fontSize = 48;
    label.lineHeight = 54;
    label.isBold = true;
    label.color = new Color(255, 255, 255, 255);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;

    const matchInfo = getSelectedMatchInfo();
    if (matchInfo) {
      label.string = `\u62bd\u5230\u7684\u5361\u724c\n${matchInfo.matchId}  ${matchInfo.homeCountryId} vs ${matchInfo.awayCountryId}`;
      label.fontSize = 40;
      label.lineHeight = 48;
    }
  }

  private createGrid(parent: Node): Node {
    const grid = new Node("CardGrid");
    parent.addChild(grid);

    const transform = grid.addComponent(UITransform);
    transform.setContentSize(750, 760);

    const layout = grid.addComponent(Layout);
    layout.type = Layout.Type.GRID;
    layout.resizeMode = Layout.ResizeMode.CONTAINER;
    layout.startAxis = Layout.AxisDirection.HORIZONTAL;
    layout.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
    layout.verticalDirection = Layout.VerticalDirection.TOP_TO_BOTTOM;
    layout.constraint = Layout.Constraint.FIXED_COL;
    layout.constraintNum = 3;
    layout.spacingX = 24;
    layout.spacingY = 36;
    layout.paddingLeft = 36;
    layout.paddingRight = 36;

    return grid;
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
