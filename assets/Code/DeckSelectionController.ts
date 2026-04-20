import {
  _decorator,
  Color,
  Component,
  instantiate,
  Label,
  Node,
  Prefab,
  resources,
  UITransform,
  Vec3,
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

    this.renderTitle(canvas);

    const grid = this.ensureCardGrid(canvas);
    grid.removeAllChildren();

    const prefab = await this.loadPrefab();
    const cards = getAllCardDefinitions().slice(0, 6);
    const cardWidth = 176;
    const cardHeight = 262;
    const spacingX = 10;
    const spacingY = 14;
    const columns = 3;

    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index];
      const cardNode = instantiate(prefab);
      grid.addChild(cardNode);

      const gameCard = cardNode.getComponent(GameCard);
      if (gameCard) {
        gameCard.setCardSize(cardWidth, cardHeight);
        await gameCard.configure(card.id);
      }

      this.positionCard(cardNode, index, {
        cardWidth,
        cardHeight,
        spacingX,
        spacingY,
        columns,
      });
    }
  }

  private renderTitle(canvas: Node): void {
    let titleNode = canvas.getChildByName("DeckSelectionTitle");
    if (!titleNode) {
      titleNode = new Node("DeckSelectionTitle");
      canvas.addChild(titleNode);

      const transform = titleNode.addComponent(UITransform);
      transform.setContentSize(670, 120);

      const widget = titleNode.addComponent(Widget);
      widget.isAlignTop = true;
      widget.isAlignLeft = true;
      widget.isAlignRight = true;
      widget.top = 150;
      widget.left = 40;
      widget.right = 40;
      widget.alignMode = 2;

      const label = titleNode.addComponent(Label);
      label.fontSize = 40;
      label.lineHeight = 48;
      label.isBold = true;
      label.color = new Color(255, 255, 255, 255);
      label.horizontalAlign = Label.HorizontalAlign.CENTER;
      label.enableWrapText = true;
    }

    const label = titleNode.getComponent(Label);
    if (!label) {
      return;
    }

    const matchInfo = getSelectedMatchInfo();
    if (matchInfo) {
      label.string = `抽到的卡牌\n${matchInfo.matchId}  ${matchInfo.homeCountryId} vs ${matchInfo.awayCountryId}`;
      return;
    }

    label.string = "抽到的卡牌";
  }

  private ensureCardGrid(canvas: Node): Node {
    let grid = canvas.getChildByName("CardGrid");
    if (!grid) {
      grid = new Node("CardGrid");
      canvas.addChild(grid);

      const transform = grid.addComponent(UITransform);
      transform.setContentSize(548, 1124);

      const widget = grid.addComponent(Widget);
      widget.isAlignHorizontalCenter = true;
      widget.isAlignTop = true;
      widget.isAlignBottom = true;
      widget.horizontalCenter = 0;
      widget.top = 300;
      widget.bottom = 200;
      widget.alignMode = 2;
    }

    const transform = grid.getComponent(UITransform);
    transform?.setContentSize(548, 1124);

    const widget = grid.getComponent(Widget);
    if (widget) {
      widget.isAlignLeft = false;
      widget.isAlignRight = false;
      widget.isAlignHorizontalCenter = true;
      widget.horizontalCenter = 0;
      widget.isAlignTop = true;
      widget.isAlignBottom = true;
      widget.top = 300;
      widget.bottom = 200;
      widget.alignMode = 2;
      widget.updateAlignment();
    }

    return grid;
  }

  private positionCard(
    cardNode: Node,
    index: number,
    options: {
      cardWidth: number;
      cardHeight: number;
      spacingX: number;
      spacingY: number;
      columns: number;
    },
  ): void {
    const { cardWidth, cardHeight, spacingX, spacingY, columns } = options;
    const column = index % columns;
    const row = Math.floor(index / columns);
    const totalWidth = columns * cardWidth + (columns - 1) * spacingX;
    const x = -totalWidth / 2 + cardWidth / 2 + column * (cardWidth + spacingX);
    const y = -cardHeight / 2 - row * (cardHeight + spacingY);

    cardNode.setPosition(new Vec3(x, y, 0));
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
