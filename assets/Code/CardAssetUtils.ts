import { resources, Sprite, SpriteFrame } from "cc";
import type { CardType } from "./CardCatalog";

const spriteFrameCache = new Map<string, Promise<SpriteFrame>>();

export function loadCardBackSpriteFrame(): Promise<SpriteFrame> {
  return loadSpriteFrame("cards/back/spriteFrame");
}

export function loadCardTypeSpriteFrame(type: CardType): Promise<SpriteFrame> {
  return loadSpriteFrame(`cards/type-${type}/spriteFrame`);
}

export function loadCardFaceSpriteFrame(cardId: number): Promise<SpriteFrame> {
  const cardKey = cardId.toString().padStart(3, "0");
  return loadSpriteFrame(`cards/face-${cardKey}/spriteFrame`).catch(() =>
    loadSpriteFrame("cards/notfound/spriteFrame"),
  );
}

export function setSpriteFrame(
  sprite: Sprite | null,
  frame: SpriteFrame | null,
): void {
  if (!sprite || !frame) {
    return;
  }

  // Force untrimmed rendering so back/type/face keep the same visual size.
  (sprite as unknown as { trim?: boolean }).trim = false;
  sprite.spriteFrame = frame;
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
  sprite.node.active = true;
  sprite.enabled = true;
}

function loadSpriteFrame(path: string): Promise<SpriteFrame> {
  const cached = spriteFrameCache.get(path);
  if (cached) {
    return cached;
  }

  const promise = new Promise<SpriteFrame>((resolve, reject) => {
    resources.load(path, SpriteFrame, (err, asset) => {
      if (err || !asset) {
        spriteFrameCache.delete(path);
        reject(
          err ?? new Error(`[CardAssetUtils] Missing SpriteFrame at ${path}`),
        );
        return;
      }

      resolve(asset);
    });
  });

  spriteFrameCache.set(path, promise);
  return promise;
}
