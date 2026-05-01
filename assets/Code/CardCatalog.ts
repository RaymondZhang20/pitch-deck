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

export type AccuracyMultiplierCardEffect = {
  kind: "accuracyMultiplier";
  formula: "0.5PlusAccuracy" | "1.5MinusAccuracy";
};

export type TopCardModifierEffect = {
  kind: "topCardModifier";
  rule: "doubleBestCorrectIfMoreCorrectElseDoubleWorstWrong";
};

export type CardEffect =
  | BinaryCardEffect
  | AccuracyMultiplierCardEffect
  | TopCardModifierEffect;

export type CardDefinition = {
  id: number;
  type: CardType;
  title: string;
  content: string;
  effect: string;
  calculation: CardEffect;
};

function createBinaryCard(id: number, type: CardType, title: string, content: string, correctPoints: number, wrongPoints: number): CardDefinition {
  const correctPointsText = formatSignedPoints(correctPoints);
  const wrongPointsText = formatSignedPoints(wrongPoints);

  return {
    id,
    type,
    title,
    content,
    effect: `猜对${correctPointsText}点数\n猜错${wrongPointsText}点数`,
    calculation: {
      kind: "binary",
      correctPoints,
      wrongPoints,
    },
  };
}

function formatSignedPoints(points: number): string {
  return points >= 0 ? `+${points}` : `${points}`;
}

function createAccuracyMultiplierCard(id: number, title: string, content: string, effect: string, formula: AccuracyMultiplierCardEffect["formula"]): CardDefinition {
  return {
    id,
    type: "special",
    title,
    content,
    effect,
    calculation: {
      kind: "accuracyMultiplier",
      formula,
    },
  };
}

function createTopCardModifierCard(id: number, title: string, content: string, effect: string): CardDefinition {
  return {
    id,
    type: "special",
    title,
    content,
    effect,
    calculation: {
      kind: "topCardModifier",
      rule: "doubleBestCorrectIfMoreCorrectElseDoubleWorstWrong",
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
  createBinaryCard(16, "lineup", "青春风暴", "队伍首发中至少有5名球员不大于23岁或平均首发年龄不大于25岁", 250, -100),
  createBinaryCard(17, "lineup", "养老院？", "队伍首发中至少有5名球员不小于30岁或平均首发年龄不小于32岁", 250, -100),
  createBinaryCard(18, "lineup", "主教练睡着了？", "队伍未出场替补球员", 1000, -200),
  createBinaryCard(19, "lineup", "常规操作", "队伍出场3至4个替补球员", 100, -50),
  createBinaryCard(20, "lineup", "两套阵容", "队伍出场5个及以上替补球员", 300, -50),
  createBinaryCard(200, "goal", "正好一个", "队伍在比赛中正好进了一个球", 200, 0),
  createBinaryCard(201, "goal", "行不行呀", "队伍在比赛中没有进球", 200, 0),
  createBinaryCard(202, "goal", "乏善可陈", "队伍在比赛中进了两个球", 200, 0),
  createBinaryCard(203, "goal", "狂轰滥炸！", "队伍在比赛中进了不少于3个进球", 400, -100),
  createBinaryCard(204, "goal", "零封！", "队伍在这场比赛没有丢一个球", 300, -100),
  createBinaryCard(205, "goal", "纸糊防守", "队伍在这场比赛丢了三个以上球", 600, -100),
  createBinaryCard(206, "goal", "闪击", "队伍在这场比赛前10分钟内就进球", 500, -100),
  createBinaryCard(207, "goal", "12码核爆！", "队伍打进至少一粒点球（除点球大战）", 150, 0),
  createBinaryCard(208, "goal", "Sui!!!", "队伍打进至少两粒点球", 500, -100),
  createBinaryCard(209, "goal", "游龙！", "队伍打进至少一粒定位球", 250, 0),
  createBinaryCard(210, "goal", "儒尼尼奥？", "队伍打进至少两粒定位球", 700, -100),
  createBinaryCard(211, "goal", "暴扣", "队伍打进至少一粒头球", 150, 0),
  createBinaryCard(212, "goal", "空接之城", "队伍打进至少两粒头球", 500, -100),
  createBinaryCard(213, "goal", "乌龙", "队伍打进至少一粒乌龙球", 400, -100),
  createBinaryCard(214, "goal", "一支穿云箭", "队伍打进至少一粒世界波", 200, 0),
  createBinaryCard(215, "goal", "洲际导弹群", "队伍打进至少两粒世界波", 600, -100),
  createBinaryCard(300, "player", "梅开二度", "队伍中有球员进了至少两球", 500, -100),
  createBinaryCard(301, "player", "帽子戏法", "队伍中有球员进了至少三球", 900, -200),
  createBinaryCard(302, "player", "铁树开花", "队伍中有后场球员进了至少一球", 300, -100),
  createBinaryCard(303, "player", "金童？小妖？", "队伍中有不大于20岁球员进了至少一球", 300, -100),
  createBinaryCard(304, "player", "超新星爆发", "队伍中有不大于20岁球员进了至少两球", 600, -100),
  createBinaryCard(305, "player", "老骥伏枥", "队伍中有不小于30岁球员进了至少一球", 300, -100),
  createBinaryCard(306, "player", "伤病退散", "队伍中有球员因伤离场", 150, 50),
  createBinaryCard(307, "player", "黄非红", "队伍中有球员领到黄牌", 200, 0),
  createBinaryCard(308, "player", "两黄变一红", "队伍中有球员累计领到两张黄牌", 500, -100),
  createBinaryCard(309, "player", "打卡下班", "队伍中有球员直接领到红牌下场", 500, -100),
  createBinaryCard(310, "player", "水花四溅", "队伍中有球员因为假摔领到黄牌或者犯规", 300, -50),
  createBinaryCard(400, "team", "控球游戏", "队伍这场比赛的控球率大于50%", 100, 0),
  createBinaryCard(401, "team", "就压着打！", "队伍这场比赛的控球率大于70%", 500, -100),
  createBinaryCard(402, "team", "防守反击", "队伍这场比赛的控球率小于50%", 100, 0),
  createBinaryCard(403, "team", "烫手山芋", "队伍这场比赛的控球率小于30%", 500, -100),
  createBinaryCard(404, "team", "给我射", "队伍这场比赛的射门次数高于对手", 100, 0),
  createBinaryCard(405, "team", "我射门键呢", "队伍这场比赛的射门次数低于对手", 100, 0),
  createBinaryCard(406, "team", "精准制导", "队伍这场比赛的射正率高于对手", 200, 0),
  createBinaryCard(407, "team", "努角", "队伍这场比赛的射正率低于对手", 200, 0),
  createBinaryCard(408, "team", "美丽足球", "队伍这场比赛的传球次数高于对手", 100, 0),
  createBinaryCard(409, "team", "简洁高效", "队伍这场比赛的传球次数低于对手", 100, 0),
  createBinaryCard(410, "team", "这不是拳击赛吗", "队伍这场比赛的犯规次数高于对手", 150, 0),
  createBinaryCard(411, "team", "我是来踢球的", "队伍这场比赛的犯规次数低于对手", 150, 0),
  createBinaryCard(412, "team", "占领角旗区", "队伍这场比赛的角球次数高于对手", 150, 0),
  createBinaryCard(413, "team", "越王勾践", "队伍这场比赛的越位次数高于对手", 200, 0),
  createAccuracyMultiplierCard(900, "预言家", "将你的所有卡片预测的正确率加上0.5乘到你的点数中，你预测对的越多分数乘越多的倍率", "点数*(0.5+正确率)", "0.5PlusAccuracy"),
  createAccuracyMultiplierCard(901, "全靠蒙", "将1.5减去你的所有卡片预测的正确率乘到你的点数中，你预测对的越多分数乘越多的倍率", "点数*(1.5-正确率)", "1.5MinusAccuracy"),
  createBinaryCard(902, "special", "主教练正在热身", "队伍的主教练上场踢球", -10000, 200),
  createBinaryCard(903, "special", "给个好评", "快召集你的小伙伴一起来竞猜吧！", 200, 200),
  createBinaryCard(904, "special", "我是赌狗", "一半概率猜对，一半概率猜错", 200, -100),
  createTopCardModifierCard(905, "巴巴博弈", "若猜错的卡多，将失分最多的卡加倍；若猜对的卡多，将得分最多的卡加倍。", "猜对多+？？？点数\n猜错多-？？？点数"),
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
