import {
  BlockInputEvents,
  Button,
  Color,
  Graphics,
  instantiate,
  Label,
  Node,
  Prefab,
  resources,
  UITransform,
  Vec3,
  Widget,
} from "cc";

export type DialogOptions = {
  message: string;
  confirmLabel?: string;
  discardLabel?: string;
  prefabPath?: string;
  onConfirm?: () => void;
  onDiscard?: () => void;
};

const DEFAULT_DIALOG_PREFAB_PATH = "prefabs/Dialog";

export async function showDialog(
  canvas: Node,
  options: DialogOptions,
): Promise<Node> {
  const prefab = await loadDialogPrefab(
    options.prefabPath ?? DEFAULT_DIALOG_PREFAB_PATH,
  );
  const dialogNode = instantiate(prefab);
  canvas.addChild(dialogNode);
  prepareDialogRoot(canvas, dialogNode);
  ensureBackdrop(dialogNode);

  const messageLabel = findDialogTextLabel(dialogNode);
  if (messageLabel) {
    messageLabel.string = options.message;
    messageLabel.enableWrapText = true;
    messageLabel.overflow = Label.Overflow.RESIZE_HEIGHT;
    messageLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    messageLabel.lineHeight = messageLabel.fontSize + 5;
    const currentPosition = messageLabel.node.position;
    messageLabel.node.setPosition(
      currentPosition.x,
      currentPosition.y - 20,
      currentPosition.z,
    );
    const labelTransform = messageLabel.getComponent(UITransform);
    if (labelTransform) {
      const currentSize = labelTransform.contentSize;
      labelTransform.setContentSize(currentSize.width * 3, currentSize.height);
    }
  }

  const confirmButton = findNodeByName(dialogNode, "confirmBtn");
  const discardButton = findNodeByName(dialogNode, "discardBtn");

  const confirmLabel = findButtonLabel(confirmButton);
  if (confirmLabel) {
    confirmLabel.string = options.confirmLabel ?? "确定";
  }

  bindButton(confirmButton, () => {
    options.onConfirm?.();
    dialogNode.destroy();
  });

  if (options.onDiscard || options.discardLabel) {
    if (discardButton) {
      const discardLabel = findButtonLabel(discardButton);
      if (discardLabel) {
        discardLabel.string = options.discardLabel ?? "取消";
      }

      discardButton.active = true;
      bindButton(discardButton, () => {
        options.onDiscard?.();
        dialogNode.destroy();
      });
    }
  } else if (discardButton) {
    discardButton.removeFromParent();
    discardButton.destroy();
    centerNodeHorizontally(confirmButton);
  }

  return dialogNode;
}

function prepareDialogRoot(canvas: Node, dialogNode: Node): void {
  const canvasTransform = canvas.getComponent(UITransform);
  let dialogTransform = dialogNode.getComponent(UITransform);
  if (!dialogTransform) {
    dialogTransform = dialogNode.addComponent(UITransform);
  }

  if (canvasTransform) {
    dialogTransform.setContentSize(canvasTransform.contentSize);
  }

  let widget = dialogNode.getComponent(Widget);
  if (!widget) {
    widget = dialogNode.addComponent(Widget);
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

  const dialogContainer = findDialogContainer(dialogNode);
  if (dialogContainer) {
    const containerWidget = dialogContainer.getComponent(Widget);
    if (containerWidget) {
      containerWidget.enabled = false;
    }

    dialogContainer.setPosition(0, 0, 0);
  }

  if (!dialogNode.getComponent(BlockInputEvents)) {
    dialogNode.addComponent(BlockInputEvents);
  }
}

function ensureBackdrop(dialogNode: Node): void {
  let backdrop = dialogNode.getChildByName("Backdrop");
  if (!backdrop) {
    backdrop = new Node("Backdrop");
    dialogNode.addChild(backdrop);
  }

  backdrop.setSiblingIndex(0);

  let transform = backdrop.getComponent(UITransform);
  if (!transform) {
    transform = backdrop.addComponent(UITransform);
  }

  const dialogTransform = dialogNode.getComponent(UITransform);
  if (dialogTransform) {
    transform.setContentSize(dialogTransform.contentSize);
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
  graphics.fillColor = new Color(0, 0, 0, 160);
  const size = transform.contentSize;
  graphics.rect(-size.width / 2, -size.height / 2, size.width, size.height);
  graphics.fill();

  if (!backdrop.getComponent(BlockInputEvents)) {
    backdrop.addComponent(BlockInputEvents);
  }
}

function bindButton(node: Node | null, handler: () => void): void {
  if (!node) {
    return;
  }

  const button = node.getComponent(Button);
  if (button) {
    node.off(Button.EventType.CLICK);
    node.on(Button.EventType.CLICK, handler);
    return;
  }

  node.off(Node.EventType.TOUCH_END);
  node.on(Node.EventType.TOUCH_END, handler);
}

function centerNodeHorizontally(node: Node | null): void {
  if (!node) {
    return;
  }

  const widget = node.getComponent(Widget);
  if (widget) {
    widget.enabled = false;
  }

  const currentPosition = node.position;
  node.setPosition(new Vec3(0, currentPosition.y, currentPosition.z));
}

function findDialogTextLabel(root: Node): Label | null {
  const dialogContainer = findDialogContainer(root);
  if (!dialogContainer) {
    return null;
  }

  for (const child of dialogContainer.children) {
    const childName = child.name.toLowerCase();
    if (childName === "confirmbtn" || childName === "discardbtn") {
      continue;
    }

    const directLabel = child.getComponent(Label);
    if (directLabel) {
      return directLabel;
    }

    const nestedLabel = findFirstComponentInTree(child, Label);
    if (nestedLabel) {
      return nestedLabel;
    }
  }

  return null;
}

function findButtonLabel(buttonNode: Node | null): Label | null {
  if (!buttonNode) {
    return null;
  }

  return buttonNode.getComponentInChildren(Label);
}

function findNodeByName(root: Node, name: string): Node | null {
  const targetName = name.toLowerCase();
  if (root.name.toLowerCase() === targetName) {
    return root;
  }

  for (const child of root.children) {
    const result = findNodeByName(child, name);
    if (result) {
      return result;
    }
  }

  return null;
}

function findDialogContainer(root: Node): Node | null {
  for (const child of root.children) {
    if (child.name.toLowerCase() === "dialog") {
      return child;
    }
  }

  return findNodeByName(root, "dialog");
}

function findFirstComponentInTree<T extends object>(
  root: Node,
  componentType: new (...args: never[]) => T,
): T | null {
  const direct = root.getComponent(componentType);
  if (direct) {
    return direct;
  }

  for (const child of root.children) {
    const result = findFirstComponentInTree(child, componentType);
    if (result) {
      return result;
    }
  }

  return null;
}

function loadDialogPrefab(path: string): Promise<Prefab> {
  return new Promise((resolve, reject) => {
    resources.load(path, Prefab, (err, asset) => {
      if (err || !asset) {
        reject(err ?? new Error(`Failed to load dialog prefab at ${path}`));
        return;
      }

      resolve(asset);
    });
  });
}
