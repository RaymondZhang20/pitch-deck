import {
  _decorator,
  Color,
  Component,
  Label,
  Node,
  Sprite,
  tween,
  UIOpacity,
  Vec3,
} from "cc";

const { ccclass } = _decorator;

const SELECTED_SCALE = new Vec3(1.12, 1.12, 1);
const NORMAL_SCALE = new Vec3(1, 1, 1);
const SELECTED_LABEL_SCALE = new Vec3(1.08, 1.08, 1);
const NORMAL_LABEL_SCALE = new Vec3(1, 1, 1);
const SELECTED_LABEL_OFFSET_Y = 9;
const SELECTED_LABEL_COLOR = new Color(255, 255, 255, 255);
const NORMAL_LABEL_COLOR = new Color(130, 130, 130, 255);
const SELECTED_BG_COLOR = new Color(255, 255, 255, 255);
const NORMAL_BG_COLOR = new Color(168, 168, 168, 255);
const TRANSITION_SECONDS = 0.18;

@ccclass("SegmentedControl")
export class SegmentedControl extends Component {
  private readonly labelBasePositions = new Map<Node, Vec3>();

  public setSelectedIndex(selectedIndex: number, animated = true): void {
    const tabs = this.node.getChildByName("Tabs");
    if (!tabs) {
      return;
    }

    for (let index = 0; index < tabs.children.length; index += 1) {
      this.setTabSelected(tabs.children[index], index === selectedIndex, animated);
    }
  }

  private setTabSelected(tab: Node, selected: boolean, animated: boolean): void {
    const normalBg = tab.getChildByName("NormalBg");
    const selectedBg = tab.getChildByName("SelectedBg");
    const selectedShadow = tab.getChildByName("SelectedShadow");
    const labelNode = tab.getChildByName("Label");
    const labelBasePosition = this.getLabelBasePosition(labelNode);

    this.transitionSpriteColor(normalBg, NORMAL_BG_COLOR, animated);
    this.transitionSpriteColor(
      selectedBg,
      selected ? SELECTED_BG_COLOR : NORMAL_BG_COLOR,
      animated,
    );
    this.transitionNodeScale(
      selectedBg,
      selected ? SELECTED_SCALE : NORMAL_SCALE,
      animated,
    );
    this.transitionLabelTransform(
      labelNode,
      labelBasePosition
        ? new Vec3(
            labelBasePosition.x,
            labelBasePosition.y + (selected ? SELECTED_LABEL_OFFSET_Y : 0),
            labelBasePosition.z,
          )
        : null,
      selected ? SELECTED_LABEL_SCALE : NORMAL_LABEL_SCALE,
      animated,
    );
    this.transitionLabelColor(
      labelNode,
      selected ? SELECTED_LABEL_COLOR : NORMAL_LABEL_COLOR,
      animated,
    );
    this.transitionOpacity(selectedBg, selected ? 255 : 0, animated);
    this.transitionOpacity(selectedShadow, selected ? 95 : 0, animated);
  }

  private transitionNodeScale(
    node: Node | null,
    scale: Vec3,
    animated: boolean,
  ): void {
    if (!node) {
      return;
    }

    tween(node).stop();
    if (!animated) {
      node.setScale(scale);
      return;
    }

    tween(node).to(TRANSITION_SECONDS, { scale }).start();
  }

  private transitionLabelTransform(
    node: Node | null,
    position: Vec3 | null,
    scale: Vec3,
    animated: boolean,
  ): void {
    if (!node || !position) {
      return;
    }

    tween(node).stop();
    if (!animated) {
      node.setPosition(position);
      node.setScale(scale);
      return;
    }

    tween(node).to(TRANSITION_SECONDS, { position, scale }).start();
  }

  private transitionOpacity(
    node: Node | null,
    opacity: number,
    animated: boolean,
  ): void {
    if (!node) {
      return;
    }

    node.active = true;
    const uiOpacity =
      node.getComponent(UIOpacity) ?? node.addComponent(UIOpacity);
    tween(uiOpacity).stop();

    if (!animated) {
      uiOpacity.opacity = opacity;
      node.active = opacity > 0;
      return;
    }

    tween(uiOpacity)
      .to(TRANSITION_SECONDS, { opacity })
      .call(() => {
        node.active = opacity > 0;
      })
      .start();
  }

  private transitionSpriteColor(
    node: Node | null,
    color: Color,
    animated: boolean,
  ): void {
    const sprite = node?.getComponent(Sprite);
    if (!sprite) {
      return;
    }

    if (!animated) {
      sprite.color = color;
      return;
    }

    const start = sprite.color.clone();
    const state = { t: 0 };
    tween(state)
      .to(TRANSITION_SECONDS, { t: 1 }, {
        onUpdate: () => {
          sprite.color = lerpColor(start, color, state.t);
        },
      })
      .start();
  }

  private transitionLabelColor(
    node: Node | null,
    color: Color,
    animated: boolean,
  ): void {
    const label = node?.getComponent(Label);
    if (!label) {
      return;
    }

    if (!animated) {
      label.color = color;
      return;
    }

    const start = label.color.clone();
    const state = { t: 0 };
    tween(state)
      .to(TRANSITION_SECONDS, { t: 1 }, {
        onUpdate: () => {
          label.color = lerpColor(start, color, state.t);
        },
      })
      .start();
  }

  private getLabelBasePosition(node: Node | null): Vec3 | null {
    if (!node) {
      return null;
    }

    const existingPosition = this.labelBasePositions.get(node);
    if (existingPosition) {
      return existingPosition;
    }

    const basePosition = node.position.clone();
    this.labelBasePositions.set(node, basePosition);
    return basePosition;
  }
}

function lerpColor(start: Color, end: Color, amount: number): Color {
  return new Color(
    start.r + (end.r - start.r) * amount,
    start.g + (end.g - start.g) * amount,
    start.b + (end.b - start.b) * amount,
    start.a + (end.a - start.a) * amount,
  );
}
