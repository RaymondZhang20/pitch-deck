export type CardType =
  | "lineup"
  | "result"
  | "goal"
  | "player"
  | "team"
  | "special";

export type CardDefinition = {
  id: number;
  imageId: string;
  type: CardType;
  title: string;
  content: string;
  effect: string;
};

const CARD_DEFINITIONS: CardDefinition[] = [
  {
    id: 200,
    imageId: "001",
    type: "goal",
    title: "\u6b63\u597d\u4e00\u4e2a",
    content: "\u961f\u4f0d\u5728\u6bd4\u8d5b\u4e2d\u6b63\u597d\u8fdb\u4e86\u4e00\u4e2a\u7403",
    effect: "\u731c\u5bf9+200\u70b9\u6570\n\u731c\u9519-0\u70b9\u6570",
  },
  {
    id: 201,
    imageId: "002",
    type: "result",
    title: "\u884c\u4e0d\u884c\u5440",
    content: "\u961f\u4f0d\u5728\u6bd4\u8d5b\u4e2d\u6ca1\u6709\u8fdb\u7403",
    effect: "\u731c\u5bf9+200\u70b9\u6570\n\u731c\u9519-0\u70b9\u6570",
  },
  {
    id: 202,
    imageId: "003",
    type: "goal",
    title: "\u4e4f\u5584\u53ef\u9648",
    content: "\u961f\u4f0d\u5728\u6bd4\u8d5b\u4e2d\u8fdb\u4e86\u4e24\u4e2a\u7403",
    effect: "\u731c\u5bf9+200\u70b9\u6570\n\u731c\u9519-0\u70b9\u6570",
  },
  {
    id: 203,
    imageId: "004",
    type: "goal",
    title: "\u72c2\u8f70\u6ee5\u70b8\uff01",
    content: "\u961f\u4f0d\u5728\u6bd4\u8d5b\u4e2d\u8fdb\u4e86\u4e0d\u5c11\u4e8e3\u4e2a\u8fdb\u7403",
    effect: "\u731c\u5bf9+400\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
  {
    id: 204,
    imageId: "005",
    type: "team",
    title: "\u96f6\u5c01\uff01",
    content: "\u961f\u4f0d\u5728\u8fd9\u573a\u6bd4\u8d5b\u6ca1\u6709\u4e22\u4e00\u4e2a\u7403",
    effect: "\u731c\u5bf9+300\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
  {
    id: 205,
    imageId: "006",
    type: "team",
    title: "\u7eb8\u7cca\u9632\u5b88",
    content: "\u961f\u4f0d\u5728\u8fd9\u573a\u6bd4\u8d5b\u4e22\u4e86\u4e09\u4e2a\u4ee5\u4e0a\u7403",
    effect: "\u731c\u5bf9+600\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
  {
    id: 206,
    imageId: "007",
    type: "special",
    title: "\u95ea\u51fb",
    content: "\u961f\u4f0d\u5728\u8fd9\u573a\u6bd4\u8d5b\u524d10\u5206\u949f\u5185\u5c31\u8fdb\u7403",
    effect: "\u731c\u5bf9+500\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
  {
    id: 207,
    imageId: "008",
    type: "goal",
    title: "12\u7801\u6838\u7206\uff01",
    content:
      "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e00\u7c92\u70b9\u7403\uff08\u9664\u70b9\u7403\u5927\u6218\uff09",
    effect: "\u731c\u5bf9+150\u70b9\u6570\n\u731c\u9519-0\u70b9\u6570",
  },
  {
    id: 208,
    imageId: "009",
    type: "goal",
    title: "Sui!!!",
    content: "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e24\u7c92\u70b9\u7403",
    effect: "\u731c\u5bf9+500\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
  {
    id: 209,
    imageId: "010",
    type: "goal",
    title: "\u6e38\u9f99\uff01",
    content: "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e00\u7c92\u5b9a\u4f4d\u7403",
    effect: "\u731c\u5bf9+250\u70b9\u6570\n\u731c\u9519-0\u70b9\u6570",
  },
  {
    id: 210,
    imageId: "011",
    type: "goal",
    title: "\u5112\u5c3c\u5c3c\u5965\uff1f",
    content: "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e24\u7c92\u5b9a\u4f4d\u7403",
    effect: "\u731c\u5bf9+700\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
  {
    id: 211,
    imageId: "012",
    type: "goal",
    title: "\u66b4\u6263",
    content: "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e00\u7c92\u5934\u7403",
    effect: "\u731c\u5bf9+150\u70b9\u6570\n\u731c\u9519-0\u70b9\u6570",
  },
  {
    id: 212,
    imageId: "013",
    type: "goal",
    title: "\u7a7a\u63a5\u4e4b\u57ce",
    content: "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e24\u7c92\u5934\u7403",
    effect: "\u731c\u5bf9+500\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
  {
    id: 213,
    imageId: "014",
    type: "special",
    title: "\u4e4c\u9f99",
    content: "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e00\u7c92\u4e4c\u9f99\u7403",
    effect: "\u731c\u5bf9+400\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
  {
    id: 214,
    imageId: "015",
    type: "special",
    title: "\u4e00\u652f\u7a7f\u4e91\u7bad",
    content: "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e00\u7c92\u4e16\u754c\u6ce2",
    effect: "\u731c\u5bf9+200\u70b9\u6570\n\u731c\u9519-0\u70b9\u6570",
  },
  {
    id: 215,
    imageId: "016",
    type: "special",
    title: "\u6d32\u9645\u5bfc\u5f39\u7fa4",
    content: "\u961f\u4f0d\u6253\u8fdb\u81f3\u5c11\u4e24\u7c92\u4e16\u754c\u6ce2",
    effect: "\u731c\u5bf9+600\u70b9\u6570\n\u731c\u9519-100\u70b9\u6570",
  },
];

const CARD_BY_ID = new Map<number, CardDefinition>(
  CARD_DEFINITIONS.map((card) => [card.id, card]),
);

export function getCardDefinition(cardId: number): CardDefinition | null {
  return CARD_BY_ID.get(cardId) ?? null;
}

export function getAllCardDefinitions(): readonly CardDefinition[] {
  return CARD_DEFINITIONS;
}
