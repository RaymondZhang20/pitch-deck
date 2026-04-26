import { Node, Tween, Vec3, tween } from "cc";

export type PulseMotionHandle = {
  node: Node;
  tween: Tween<Node>;
};

export function startPulseMotion(node: Node): PulseMotionHandle {
  node.setScale(1, 1, 1);

  const motionTween = tween(node)
    .repeatForever(
      tween<Node>()
        .delay(0.5)
        .to(0.18, { scale: new Vec3(1.1, 1.1, 1) })
        .to(0.18, { scale: new Vec3(1, 1, 1) })
        .delay(0.5),
    )
    .start();

  return {
    node,
    tween: motionTween,
  };
}

export function stopPulseMotion(handle: PulseMotionHandle | null): null {
  if (!handle) {
    return null;
  }

  handle.tween.stop();
  handle.node.setScale(1, 1, 1);
  return null;
}
