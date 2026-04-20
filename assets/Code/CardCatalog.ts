export type CardType =
  | "lineup"
  | "result"
  | "goal"
  | "player"
  | "team"
  | "special";

export type BinaryCardEffect = {
  kind: "binary";
  correctPoints: number;
  wrongPoints: number;
};

export type CardDefinition = {
  id: number;
  type: CardType;
  title: string;
  content: string;
  effect: string;
  calculation: BinaryCardEffect;
};

const CARD_DEFINITIONS: CardDefinition[] = [
  {
    id: 1,
    type: "lineup",
    title: "平行422",
    content: "队伍使用了422阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 2,
    type: "lineup",
    title: "433",
    content: "队伍使用了433阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 3,
    type: "lineup",
    title: "双后腰",
    content: "队伍使用了4231阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 4,
    type: "lineup",
    title: "五中场",
    content: "队伍使用了352阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 5,
    type: "lineup",
    title: "343",
    content: "队伍使用了343阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 6,
    type: "lineup",
    title: "铁桶阵",
    content: "队伍使用了541阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 7,
    type: "lineup",
    title: "单后腰",
    content: "队伍使用了4141阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 8,
    type: "lineup",
    title: "窄菱形",
    content: "队伍使用了4312阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 9,
    type: "lineup",
    title: "圣诞树",
    content: "队伍使用了4321阵型",
    effect: "猜对+100点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: 0 },
  },
  {
    id: 10,
    type: "lineup",
    title: "上来就苟？",
    content: "队伍首发了5个及以上后场球员",
    effect: "猜对+250点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: -100 },
  },
  {
    id: 11,
    type: "lineup",
    title: "不设防？",
    content: "队伍首发了3个及以下后场球员",
    effect: "猜对+250点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: -100 },
  },
  {
    id: 12,
    type: "lineup",
    title: "单箭头",
    content: "队伍只首发了1个前场球员\n中~锋~",
    effect: "猜对+250点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: -100 },
  },
  {
    id: 13,
    type: "lineup",
    title: "双箭头",
    content: "队伍只首发了2个前场球员",
    effect: "猜对+250点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: -100 },
  },
  {
    id: 14,
    type: "lineup",
    title: "我要控场",
    content: "队伍首发了5个及以上中场球员",
    effect: "猜对+250点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: -100 },
  },
  {
    id: 15,
    type: "lineup",
    title: "三叉戟",
    content: "队伍首发了3个前场球员",
    effect: "猜对+250点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: -100 },
  },
  {
    id: 16,
    type: "lineup",
    title: "青春风暴",
    content: "队伍首发中至少有5名球员不大于23岁或平均首发年龄不大于25岁",
    effect: "猜对+250点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: -100 },
  },
  {
    id: 17,
    type: "lineup",
    title: "养老院？",
    content: "队伍首发中至少有5名球员不小于30岁或平均首发年龄不小于32岁",
    effect: "猜对+250点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: -100 },
  },
  {
    id: 18,
    type: "lineup",
    title: "按兵不动",
    content: "队伍未出场替补球员",
    effect: "猜对+1000点数\n猜错-200点数",
    calculation: { kind: "binary", correctPoints: 1000, wrongPoints: -200 },
  },
  {
    id: 19,
    type: "lineup",
    title: "常规操作",
    content: "队伍出场3至4个替补球员",
    effect: "猜对+100点数\n猜错-50点数",
    calculation: { kind: "binary", correctPoints: 100, wrongPoints: -50 },
  },
  {
    id: 20,
    type: "lineup",
    title: "两套阵容",
    content: "队伍出场5个及以上替补球员",
    effect: "猜对+300点数\n猜错-50点数",
    calculation: { kind: "binary", correctPoints: 300, wrongPoints: -50 },
  },
  {
    id: 200,
    type: "goal",
    title: "正好一个",
    content: "队伍在比赛中正好进了一个球",
    effect: "猜对+200点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 200, wrongPoints: 0 },
  },
  {
    id: 201,
    type: "goal",
    title: "行不行呀",
    content: "队伍在比赛中没有进球",
    effect: "猜对+200点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 200, wrongPoints: 0 },
  },
  {
    id: 202,
    type: "goal",
    title: "乏善可陈",
    content: "队伍在比赛中进了两个球",
    effect: "猜对+200点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 200, wrongPoints: 0 },
  },
  {
    id: 203,
    type: "goal",
    title: "狂轰滥炸！",
    content: "队伍在比赛中进了不少于3个进球",
    effect: "猜对+400点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 400, wrongPoints: -100 },
  },
  {
    id: 204,
    type: "goal",
    title: "零封！",
    content: "队伍在这场比赛没有丢一个球",
    effect: "猜对+300点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 300, wrongPoints: -100 },
  },
  {
    id: 205,
    type: "goal",
    title: "纸糊防守",
    content: "队伍在这场比赛丢了三个以上球",
    effect: "猜对+600点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 600, wrongPoints: -100 },
  },
  {
    id: 206,
    type: "goal",
    title: "闪击",
    content: "队伍在这场比赛前10分钟内就进球",
    effect: "猜对+500点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 500, wrongPoints: -100 },
  },
  {
    id: 207,
    type: "goal",
    title: "12码核爆！",
    content: "队伍打进至少一粒点球（除点球大战）",
    effect: "猜对+150点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 150, wrongPoints: 0 },
  },
  {
    id: 208,
    type: "goal",
    title: "Sui!!!",
    content: "队伍打进至少两粒点球",
    effect: "猜对+500点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 500, wrongPoints: -100 },
  },
  {
    id: 209,
    type: "goal",
    title: "游龙！",
    content: "队伍打进至少一粒定位球",
    effect: "猜对+250点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 250, wrongPoints: 0 },
  },
  {
    id: 210,
    type: "goal",
    title: "儒尼尼奥？",
    content: "队伍打进至少两粒定位球",
    effect: "猜对+700点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 700, wrongPoints: -100 },
  },
  {
    id: 211,
    type: "goal",
    title: "暴扣",
    content: "队伍打进至少一粒头球",
    effect: "猜对+150点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 150, wrongPoints: 0 },
  },
  {
    id: 212,
    type: "goal",
    title: "空接之城",
    content: "队伍打进至少两粒头球",
    effect: "猜对+500点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 500, wrongPoints: -100 },
  },
  {
    id: 213,
    type: "goal",
    title: "乌龙",
    content: "队伍打进至少一粒乌龙球",
    effect: "猜对+400点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 400, wrongPoints: -100 },
  },
  {
    id: 214,
    type: "goal",
    title: "一支穿云箭",
    content: "队伍打进至少一粒世界波",
    effect: "猜对+200点数\n猜错-0点数",
    calculation: { kind: "binary", correctPoints: 200, wrongPoints: 0 },
  },
  {
    id: 215,
    type: "goal",
    title: "洲际导弹群",
    content: "队伍打进至少两粒世界波",
    effect: "猜对+600点数\n猜错-100点数",
    calculation: { kind: "binary", correctPoints: 600, wrongPoints: -100 },
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
