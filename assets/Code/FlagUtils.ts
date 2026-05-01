import { resources, Sprite, SpriteFrame } from "cc";

const flagFramePromiseCache = new Map<string, Promise<SpriteFrame>>();

export function getFlagResourcePathByCode(code: string): string {
  return `flags/${code.toLowerCase()}/spriteFrame`;
}

export function loadFlagSpriteFrameByCode(code: string): Promise<SpriteFrame> {
  const normalizedCode = code.toLowerCase();
  const cached = flagFramePromiseCache.get(normalizedCode);
  if (cached) {
    return cached;
  }

  const promise = new Promise<SpriteFrame>((resolve, reject) => {
    resources.load(
      getFlagResourcePathByCode(normalizedCode),
      SpriteFrame,
      (err, asset) => {
        if (err || !asset) {
          flagFramePromiseCache.delete(normalizedCode);
          reject(
            err ??
              new Error(
                `[FlagUtils] Missing SpriteFrame for flag code: ${normalizedCode}`,
              ),
          );
          return;
        }

        resolve(asset);
      },
    );
  });

  flagFramePromiseCache.set(normalizedCode, promise);
  return promise;
}

export async function setFlagByCode(
  sprite: Sprite | null,
  code: string,
): Promise<void> {
  if (!sprite) {
    return;
  }

  const frame = await loadFlagSpriteFrameByCode(code);
  sprite.node.active = true;
  sprite.enabled = true;
  sprite.spriteFrame = frame;
  sprite.sizeMode = Sprite.SizeMode.CUSTOM;
}
