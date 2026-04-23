import {
  _decorator,
  Component,
  director,
  isValid,
  Mask,
  Node,
  Sprite,
  tween,
  UITransform,
  Vec3,
} from "cc";
import { getCardDefinition } from "./CardCatalog";
import type { CardSide } from "./DeckSelectionState";
import {
  loadCardBackSpriteFrame,
  loadCardFaceSpriteFrame,
  loadCardTypeSpriteFrame,
  setSpriteFrame,
} from "./CardAssetUtils";
import { setSelectedCardId } from "./CardSelectionState";

const { ccclass, property } = _decorator;

const RAW_CARD_WIDTH = 1024;
const RAW_CARD_HEIGHT = 1536;
const CROP_X = 266;
const CROP_Y = 175;
const CROP_WIDTH = 551;
const CROP_HEIGHT = 820;

@ccclass("GameCard")
export class GameCard extends Component {
  @property(Node)
  public artNode: Node | null = null;

  @property
  public cardId = 200;

  @property
  public openSceneOnFace = true;

  private artSprite: Sprite | null = null;
  private artImageNode: Node | null = null;
  private sideChangeHandler: ((side: CardSide) => void) | null = null;
  private currentSide: CardSide = "back";
  private isBusy = false;

  onLoad(): void {
    this.setupArtViewport();
    this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    void this.showSideInstant("back");
  }

  onDestroy(): void {
    if (isValid(this.node)) {
      this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }
  }

  public async configure(cardId: number, initialSide: CardSide = "back"): Promise<void> {
    this.cardId = cardId;
    await this.showSideInstant(initialSide);
  }

  public setOpenSceneOnFace(enabled: boolean): void {
    this.openSceneOnFace = enabled;
  }

  public setSideChangeHandler(handler: ((side: CardSide) => void) | null): void {
    this.sideChangeHandler = handler;
  }

  public async showFaceInstant(): Promise<void> {
    await this.showSideInstant("face");
  }

  public setCardSize(width: number, height: number): void {
    const rootTransform = this.node.getComponent(UITransform);
    rootTransform?.setContentSize(width, height);
    this.artNode?.getComponent(UITransform)?.setContentSize(width, height);
    this.updateArtImageLayout();
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
    this.sideChangeHandler?.(nextSide);
    this.isBusy = false;
  }

  private async showSideInstant(side: CardSide): Promise<void> {
    await this.applySide(side);
    this.currentSide = side;
    this.sideChangeHandler?.(side);
  }

  private async applySide(side: CardSide): Promise<void> {
    const definition = getCardDefinition(this.cardId);
    if (!definition) {
      return;
    }

    if (side === "back") {
      setSpriteFrame(this.artSprite, await loadCardBackSpriteFrame());
      this.updateArtImageLayout();
      return;
    }

    if (side === "type") {
      setSpriteFrame(this.artSprite, await loadCardTypeSpriteFrame(definition.type));
      this.updateArtImageLayout();
      return;
    }

    setSpriteFrame(this.artSprite, await loadCardFaceSpriteFrame(definition.id));
    this.updateArtImageLayout();
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

  private setupArtViewport(): void {
    if (!this.artNode) {
      return;
    }

    let mask = this.artNode.getComponent(Mask);
    if (!mask) {
      mask = this.artNode.addComponent(Mask);
    }
    mask.type = Mask.Type.RECT;

    const viewportSprite = this.artNode.getComponent(Sprite);
    if (viewportSprite) {
      viewportSprite.enabled = false;
    }

    let artImageNode = this.artNode.getChildByName("ArtImage");
    if (!artImageNode) {
      artImageNode = new Node("ArtImage");
      this.artNode.addChild(artImageNode);
    }

    let artImageTransform = artImageNode.getComponent(UITransform);
    if (!artImageTransform) {
      artImageTransform = artImageNode.addComponent(UITransform);
    }

    let artImageSprite = artImageNode.getComponent(Sprite);
    if (!artImageSprite) {
      artImageSprite = artImageNode.addComponent(Sprite);
    }

    this.artImageNode = artImageNode;
    this.artSprite = artImageSprite;
    this.updateArtImageLayout();
  }

  private updateArtImageLayout(): void {
    if (!this.artNode || !this.artImageNode) {
      return;
    }

    const viewportTransform = this.artNode.getComponent(UITransform);
    const imageTransform = this.artImageNode.getComponent(UITransform);
    if (!viewportTransform || !imageTransform) {
      return;
    }

    const viewportWidth = viewportTransform.contentSize.width;
    const viewportHeight = viewportTransform.contentSize.height;
    const uniformScale = Math.min(viewportWidth / CROP_WIDTH, viewportHeight / CROP_HEIGHT);
    const cropCenterX = CROP_X + CROP_WIDTH / 2;
    const cropCenterY = CROP_Y + CROP_HEIGHT / 2;

    imageTransform.setContentSize(RAW_CARD_WIDTH * uniformScale, RAW_CARD_HEIGHT * uniformScale);
    this.artImageNode.setPosition(
      new Vec3(
        (RAW_CARD_WIDTH / 2 - cropCenterX) * uniformScale,
        (cropCenterY - RAW_CARD_HEIGHT / 2) * uniformScale,
        0,
      ),
    );
  }
}
