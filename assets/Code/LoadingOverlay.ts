import {
  instantiate,
  isValid,
  Node,
  Prefab,
  resources,
  UITransform,
  Widget,
} from "cc";
import { LoadingSpinnerController } from "./LoadingSpinnerController";

const LOADING_PREFAB_PATH = "prefabs/LoadingSpinner";
const LOADING_NODE_NAME = "LoadingSpinnerOverlay";

type LoadingOverlayEntry = {
  count: number;
  node: Node;
};

const overlayEntries = new Map<Node, LoadingOverlayEntry>();

export async function showLoadingOverlay(canvas: Node): Promise<void> {
  const existing = overlayEntries.get(canvas);
  if (existing && isValid(existing.node)) {
    existing.count += 1;
    existing.node.active = true;
    existing.node.getComponent(LoadingSpinnerController)?.resetInputBlock();
    existing.node.getComponent(LoadingSpinnerController)?.refreshLayout();
    return;
  }

  const prefab = await loadLoadingPrefab();
  const overlayNode = instantiate(prefab);
  overlayNode.name = LOADING_NODE_NAME;
  canvas.addChild(overlayNode);
  prepareOverlayRoot(canvas, overlayNode);

  const controller =
    overlayNode.getComponent(LoadingSpinnerController) ??
    overlayNode.addComponent(LoadingSpinnerController);
  controller.refreshLayout();
  controller.resetInputBlock();

  overlayEntries.set(canvas, {
    count: 1,
    node: overlayNode,
  });
}

export function hideLoadingOverlay(canvas: Node): void {
  const entry = overlayEntries.get(canvas);
  if (!entry) {
    return;
  }

  entry.count -= 1;
  if (entry.count > 0) {
    return;
  }

  if (isValid(entry.node)) {
    entry.node.destroy();
  }
  overlayEntries.delete(canvas);
}

export async function withLoadingOverlay<T>(
  canvas: Node,
  task: () => Promise<T>,
): Promise<T> {
  await showLoadingOverlay(canvas);
  try {
    return await task();
  } finally {
    hideLoadingOverlay(canvas);
  }
}

function prepareOverlayRoot(canvas: Node, overlayNode: Node): void {
  const canvasTransform = canvas.getComponent(UITransform);
  let overlayTransform = overlayNode.getComponent(UITransform);
  if (!overlayTransform) {
    overlayTransform = overlayNode.addComponent(UITransform);
  }
  if (canvasTransform) {
    overlayTransform.setContentSize(canvasTransform.contentSize);
  }

  let widget = overlayNode.getComponent(Widget);
  if (!widget) {
    widget = overlayNode.addComponent(Widget);
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

  overlayNode.setSiblingIndex(canvas.children.length - 1);
}

function loadLoadingPrefab(): Promise<Prefab> {
  return new Promise((resolve, reject) => {
    resources.load(LOADING_PREFAB_PATH, Prefab, (err, asset) => {
      if (err || !asset) {
        reject(
          err ?? new Error(`[LoadingOverlay] Failed to load ${LOADING_PREFAB_PATH}`),
        );
        return;
      }

      resolve(asset);
    });
  });
}
