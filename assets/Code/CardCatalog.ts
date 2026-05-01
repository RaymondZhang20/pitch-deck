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

function createBinaryCard(
  id: number,
  type: CardType,
  title: string,
  content: string,
  correctPoints: number,
  wrongPoints: number,
): CardDefinition {
  const wrongPointsText = wrongPoints === 0 ? "-0" : `${wrongPoints}`;

  return {
    id,
    type,
    title,
    content,
    effect: `猜对+${correctPoints}点数\n猜错${wrongPointsText}点数`,
    calculation: {
      kind: "binary",
      correctPoints,
      wrongPoints,
    },
  };
}

const CARD_DEFINITIONS: CardDefinition[] = [
  createBinaryCard(1, "lineup", "平行422", "队伍使用了422阵型", 100, 0),
  createBinaryCard(2, "lineup", "433", "队伍使用了433阵型", 100, 0),
  createBinaryCard(3, "lineup", "双后腰", "队伍使用了4231阵型", 100, 0),
  createBinaryCard(4, "lineup", "五中场", "队伍使用了352阵型", 100, 0),
  createBinaryCard(5, "lineup", "343", "队伍使用了343阵型", 100, 0),
  createBinaryCard(6, "lineup", "铁桶阵", "队伍使用了541阵型", 100, 0),
  createBinaryCard(7, "lineup", "单后腰", "队伍使用了4141阵型", 100, 0),
  createBinaryCard(8, "lineup", "窄菱形", "队伍使用了4312阵型", 100, 0),
  createBinaryCard(9, "lineup", "圣诞树", "队伍使用了4321阵型", 100, 0),
  createBinaryCard(10, "lineup", "上来就苟？", "队伍首发了5个及以上后场球员", 250, -100),
  createBinaryCard(11, "lineup", "不设防？", "队伍首发了3个及以下后场球员", 250, -100),
  createBinaryCard(12, "lineup", "单箭头", "队伍只首发了1个前场球员\n中~锋~", 250, -100),
  createBinaryCard(13, "lineup", "双箭头", "队伍只首发了2个前场球员", 250, -100),
  createBinaryCard(14, "lineup", "我要控场", "队伍首发了5个及以上中场球员", 250, -100),
  createBinaryCard(15, "lineup", "三叉戟", "队伍首发了3个前场球员", 250, -100),
  createBinaryCard(
    16,
    "lineup",
    "青春风暴",
    "队伍首发中至少有5名球员不大于23岁或平均首发年龄不大于25岁",
    250,
    -100,
  ),
  createBinaryCard(
    17,
    "lineup",
    "养老院？",
    "队伍首发中至少有5名球员不小于30岁或平均首发年龄不小于32岁",
    250,
    -100,
  ),
  createBinaryCard(18, "lineup", "按兵不动", "队伍未出场替补球员", 1000, -200),
  createBinaryCard(19, "lineup", "常规操作", "队伍出场3至4个替补球员", 100, -50),
  createBinaryCard(20, "lineup", "两套阵容", "队伍出场5个及以上替补球员", 300, -50),
  createBinaryCard(200, "goal", "正好一个", "队伍在比赛中正好进了一个球", 200, 0),
  createBinaryCard(201, "goal", "行不行呀", "队伍在比赛中没有进球", 200, 0),
  createBinaryCard(202, "goal", "乏善可陈", "队伍在比赛中进了两个球", 200, 0),
  createBinaryCard(203, "goal", "狂轰滥炸！", "队伍在比赛中进了不少于3个进球", 400, -100),
  createBinaryCard(204, "goal", "零封！", "队伍在这场比赛没有丢一个球", 300, -100),
  createBinaryCard(205, "goal", "纸糊防守", "队伍在这场比赛丢了三个以上球", 600, -100),
  createBinaryCard(206, "goal", "闪击", "队伍在这场比赛前10分钟内就进球", 500, -100),
  createBinaryCard(
    207,
    "goal",
    "12码核爆！",
    "队伍打进至少一粒点球（除点球大战）",
    150,
    0,
  ),
  createBinaryCard(208, "goal", "Sui!!!", "队伍打进至少两粒点球", 500, -100),
  createBinaryCard(209, "goal", "游龙！", "队伍打进至少一粒定位球", 250, 0),
  createBinaryCard(210, "goal", "儒尼尼奥？", "队伍打进至少两粒定位球", 700, -100),
  createBinaryCard(211, "goal", "暴扣", "队伍打进至少一粒头球", 150, 0),
  createBinaryCard(212, "goal", "空接之城", "队伍打进至少两粒头球", 500, -100),
  createBinaryCard(213, "goal", "乌龙", "队伍打进至少一粒乌龙球", 400, -100),
  createBinaryCard(214, "goal", "一支穿云箭", "队伍打进至少一粒世界波", 200, 0),
  createBinaryCard(215, "goal", "洲际导弹群", "队伍打进至少两粒世界波", 600, -100),
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
