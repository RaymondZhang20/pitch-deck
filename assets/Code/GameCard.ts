import {
  _decorator,
  Component,
  director,
  isValid,
  Node,
  Sprite,
  tween,
  UITransform,
  Vec3,
} from "cc";
import { getCardDefinition } from "./CardCatalog";
import {
  loadCardBackSpriteFrame,
  loadCardFaceSpriteFrame,
  loadCardTypeSpriteFrame,
  setSpriteFrame,
} from "./CardAssetUtils";
import { setSelectedCardId } from "./CardSelectionState";

const { ccclass, property } = _decorator;

type CardSide = "back" | "type" | "face";

@ccclass("GameCard")
export class GameCard extends Component {
  @property(Node)
  public artNode: Node | null = null;

  @property
  public cardId = 200;

  @property
  public openSceneOnFace = true;

  private artSprite: Sprite | null = null;
  private currentSide: CardSide = "back";
  private isBusy = false;

  onLoad(): void {
    this.artSprite = this.artNode?.getComponent(Sprite) ?? null;
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    void this.showSideInstant("back");
  }

  onDestroy(): void {
    if (isValid(this.node)) {
      this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
  }

  public async configure(cardId: number): Promise<void> {
    this.cardId = cardId;
    await this.showSideInstant("back");
  }

  public setOpenSceneOnFace(enabled: boolean): void {
    this.openSceneOnFace = enabled;
  }

  public async showFaceInstant(): Promise<void> {
    await this.showSideInstant("face");
  }

  public setCardSize(width: number, height: number): void {
    const rootTransform = this.node.getComponent(UITransform);
    rootTransform?.setContentSize(width, height);
  }

  private onTouchEnd(): void {
    void this.handleTap();
  }

  private async handleTap(): Promise<void> {
    if (this.isBusy) {
      return;
    }

    if (this.currentSide === "back") {
      await this.flipTo("type");
      return;
    }

    if (this.currentSide === "type") {
      await this.flipTo("face");
      return;
    }

    if (this.openSceneOnFace) {
      setSelectedCardId(this.cardId);
      director.loadScene("CardSelection");
    }
  }

  private async flipTo(nextSide: CardSide): Promise<void> {
    if (!this.artNode) {
      return;
    }

    this.isBusy = true;

    const originalScale = this.artNode.scale.clone();
    await this.playFlipHalf(new Vec3(0, originalScale.y, originalScale.z));
    await this.applySide(nextSide);
    this.artNode.setScale(0, originalScale.y, originalScale.z);
    await this.playFlipHalf(originalScale);

    this.currentSide = nextSide;
    this.isBusy = false;
  }

  private async showSideInstant(side: CardSide): Promise<void> {
    await this.applySide(side);
    this.currentSide = side;
  }

  private async applySide(side: CardSide): Promise<void> {
    const definition = getCardDefinition(this.cardId);
    if (!definition) {
      return;
    }

    if (side === "back") {
      setSpriteFrame(this.artSprite, await loadCardBackSpriteFrame());
      return;
    }

    if (side === "type") {
      setSpriteFrame(this.artSprite, await loadCardTypeSpriteFrame(definition.type));
      return;
    }

    setSpriteFrame(this.artSprite, await loadCardFaceSpriteFrame(definition.imageId));
  }

  private playFlipHalf(scale: Vec3): Promise<void> {
    return new Promise((resolve) => {
      if (!this.artNode) {
        resolve();
        return;
      }

      tween(this.artNode).to(0.14, { scale }).call(resolve).start();
    });
  }
}
