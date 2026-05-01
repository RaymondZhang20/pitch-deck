import {
  _decorator,
  BlockInputEvents,
  Color,
  Component,
  Graphics,
  Label,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  UITransform,
  UIOpacity,
  Vec3,
  Widget,
  isValid,
} from "cc";

const { ccclass } = _decorator;

const BACKDROP_ALPHA = 160;
const SPINNER_SIZE = 140;
const SPINNER_DISPLAY_SCALE = 1;
const SPINNER_ROTATION_SPEED = 220;
const DOT_FRAME_DURATION = 0.45;
const INPUT_BLOCK_DURATION = 5;

@ccclass("LoadingSpinnerController")
export class LoadingSpinnerController extends Component {
  private spinnerNode: Node | null = null;
  private loadingLabel: Label | null = null;
  private blockerNode: Node | null = null;
  private rotationAngle = 0;
  private dotTimer = 0;
  private dotCount = 1;

  onLoad(): void {
    this.buildUi();
    this.resetInputBlock();
    void this.loadSpinnerArt();
  }

  update(deltaTime: number): void {
    this.rotationAngle -= deltaTime * SPINNER_ROTATION_SPEED;
    this.spinnerNode?.setRotationFromEuler(0, 0, this.rotationAngle);

    this.dotTimer += deltaTime;
    if (this.dotTimer < DOT_FRAME_DURATION) {
      return;
    }

    this.dotTimer = 0;
    this.dotCount = (this.dotCount % 3) + 1;
    if (this.loadingLabel) {
      this.loadingLabel.string = `loading${".".repeat(this.dotCount)}`;
    }
  }

  public resetInputBlock(): void {
    this.unschedule(this.releaseInputBlock);

    const blockerNode = this.ensureInputBlocker();
    blockerNode.active = true;
    if (!blockerNode.getComponent(BlockInputEvents)) {
      blockerNode.addComponent(BlockInputEvents);
    }

    this.scheduleOnce(this.releaseInputBlock, INPUT_BLOCK_DURATION);
  }

  public refreshLayout(): void {
    this.ensureRootLayout();
    this.drawBackdrop();
  }

  private releaseInputBlock = (): void => {
    const blockerNode = this.blockerNode;
    if (!blockerNode || !isValid(blockerNode)) {
      return;
    }

    blockerNode.getComponent(BlockInputEvents)?.destroy();
    blockerNode.active = false;
  };

  private buildUi(): void {
    this.ensureRootLayout();
    this.drawBackdrop();
    this.spinnerNode = this.ensureSpinnerNode();
    this.loadingLabel = this.ensureLoadingLabel();
    this.ensureInputBlocker();
  }

  private ensureRootLayout(): void {
    const parent = this.node.parent;
    const parentTransform = parent?.getComponent(UITransform);

    let transform = this.node.getComponent(UITransform);
    if (!transform) {
      transform = this.node.addComponent(UITransform);
    }
    if (parentTransform) {
      transform.setContentSize(parentTransform.contentSize);
    }

    let widget = this.node.getComponent(Widget);
    if (!widget) {
      widget = this.node.addComponent(Widget);
    }
    widget.isAlignTop = true;
    widget.isAlignBottom = true;
    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.top = 0;
    widget.bottom = 0;
    widget.left = 0;
    widget.right = 0;
    widget.alignMode = 2;
    widget.updateAlignment();
  }

  private drawBackdrop(): void {
    let backdrop = this.node.getChildByName("Backdrop");
    if (!backdrop) {
      backdrop = new Node("Backdrop");
      this.node.addChild(backdrop);
    }
    backdrop.setSiblingIndex(0);

    let transform = backdrop.getComponent(UITransform);
    if (!transform) {
      transform = backdrop.addComponent(UITransform);
    }
    const rootTransform = this.node.getComponent(UITransform);
    if (rootTransform) {
      transform.setContentSize(rootTransform.contentSize);
    }

    let widget = backdrop.getComponent(Widget);
    if (!widget) {
      widget = backdrop.addComponent(Widget);
    }
    widget.isAlignTop = true;
    widget.isAlignBottom = true;
    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.top = 0;
    widget.bottom = 0;
    widget.left = 0;
    widget.right = 0;
    widget.updateAlignment();

    let graphics = backdrop.getComponent(Graphics);
    if (!graphics) {
      graphics = backdrop.addComponent(Graphics);
    }
    graphics.clear();
    graphics.fillColor = new Color(8, 12, 28, BACKDROP_ALPHA);
    const size = transform.contentSize;
    graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
    graphics.fill();
  }

  private ensureSpinnerNode(): Node {
    let spinnerNode = this.node.getChildByName("Spinner");
    if (!spinnerNode) {
      spinnerNode = new Node("Spinner");
      this.node.addChild(spinnerNode);
    }

    spinnerNode.setPosition(new Vec3(0, 70, 0));
    spinnerNode.setScale(SPINNER_DISPLAY_SCALE, SPINNER_DISPLAY_SCALE, 1);
    let transform = spinnerNode.getComponent(UITransform);
    if (!transform) {
      transform = spinnerNode.addComponent(UITransform);
    }
    transform.setContentSize(SPINNER_SIZE, SPINNER_SIZE);

    if (!spinnerNode.getComponent(Sprite)) {
      spinnerNode.addComponent(Sprite);
    }

    return spinnerNode;
  }

  private ensureLoadingLabel(): Label {
    let labelNode = this.node.getChildByName("LoadingLabel");
    if (!labelNode) {
      labelNode = new Node("LoadingLabel");
      this.node.addChild(labelNode);
    }

    labelNode.setPosition(new Vec3(0, -55, 0));
    let transform = labelNode.getComponent(UITransform);
    if (!transform) {
      transform = labelNode.addComponent(UITransform);
    }
    transform.setContentSize(360, 88);

    let opacity = labelNode.getComponent(UIOpacity);
    if (!opacity) {
      opacity = labelNode.addComponent(UIOpacity);
    }
    opacity.opacity = 255;

    let label = labelNode.getComponent(Label);
    if (!label) {
      label = labelNode.addComponent(Label);
    }
    label.string = "loading.";
    label.fontSize = 42;
    label.lineHeight = 50;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.color = new Color(21, 52, 108, 255);
    label.isBold = true;
    label.enableOutline = true;
    label.outlineColor = new Color(255, 255, 255, 140);
    label.outlineWidth = 2;
    label.enableShadow = true;
    label.shadowColor = new Color(8, 15, 36, 180);
    label.shadowOffset = new Vec3(0, -3, 0);
    label.shadowBlur = 2;

    return label;
  }

  private ensureInputBlocker(): Node {
    let blockerNode = this.node.getChildByName("InputBlocker");
    if (!blockerNode) {
      blockerNode = new Node("InputBlocker");
      this.node.addChild(blockerNode);
    }

    blockerNode.setSiblingIndex(this.node.children.length - 1);
    let transform = blockerNode.getComponent(UITransform);
    if (!transform) {
      transform = blockerNode.addComponent(UITransform);
    }
    const rootTransform = this.node.getComponent(UITransform);
    if (rootTransform) {
      transform.setContentSize(rootTransform.contentSize);
    }

    let widget = blockerNode.getComponent(Widget);
    if (!widget) {
      widget = blockerNode.addComponent(Widget);
    }
    widget.isAlignTop = true;
    widget.isAlignBottom = true;
    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.top = 0;
    widget.bottom = 0;
    widget.left = 0;
    widget.right = 0;
    widget.updateAlignment();

    this.blockerNode = blockerNode;
    return blockerNode;
  }

  private async loadSpinnerArt(): Promise<void> {
    const spinnerSprite = this.spinnerNode?.getComponent(Sprite);
    if (!spinnerSprite) {
      return;
    }

    try {
      const frame = await this.loadSpinnerFrame();
      (spinnerSprite as unknown as { trim?: boolean }).trim = false;
      spinnerSprite.spriteFrame = frame;
      spinnerSprite.sizeMode = Sprite.SizeMode.CUSTOM;
      this.spinnerNode
        ?.getComponent(UITransform)
        ?.setContentSize(SPINNER_SIZE, SPINNER_SIZE);
      this.spinnerNode?.setScale(
        SPINNER_DISPLAY_SCALE,
        SPINNER_DISPLAY_SCALE,
        1,
      );
    } catch (error) {
      console.error(
        "[LoadingSpinnerController] Failed to load spinner art",
        error,
      );
    }
  }

  private loadSpinnerFrame(): Promise<SpriteFrame> {
    return new Promise((resolve, reject) => {
      resources.load(
        "loading/spinner/spriteFrame",
        SpriteFrame,
        (err, asset) => {
          if (err || !asset) {
            reject(
              err ??
                new Error(
                  "[LoadingSpinnerController] Missing spinner spriteFrame",
                ),
            );
            return;
          }

          resolve(asset);
        },
      );
    });
  }
}
