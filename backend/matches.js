const matches = [
  { matchId: "match-001", time: "06/18 20:00", status: "未开始", statusKey: "not-started", homeTeam: "日本", awayTeam: "韩国", homeFlagCode: "jp", awayFlagCode: "kr" },
  { matchId: "match-002", time: "06/19 19:30", status: "未开始", statusKey: "not-started", homeTeam: "美国", awayTeam: "墨西哥", homeFlagCode: "us", awayFlagCode: "mx" },
  { matchId: "match-003", time: "06/20 18:00", status: "未开始", statusKey: "not-started", homeTeam: "英格兰", awayTeam: "葡萄牙", homeFlagCode: "gb-eng", awayFlagCode: "pt" },
  { matchId: "match-010", time: "06/27 16:00", status: "未开始", statusKey: "not-started", homeTeam: "墨西哥", awayTeam: "加拿大", homeFlagCode: "mx", awayFlagCode: "ca" },
  { matchId: "match-011", time: "06/28 20:45", status: "未开始", statusKey: "not-started", homeTeam: "卡塔尔", awayTeam: "伊朗", homeFlagCode: "qa", awayFlagCode: "ir" },
  { matchId: "match-012", time: "06/29 18:15", status: "未开始", statusKey: "not-started", homeTeam: "乌拉圭", awayTeam: "哥伦比亚", homeFlagCode: "uy", awayFlagCode: "co" },
  { matchId: "match-013", time: "06/30 21:00", status: "未开始", statusKey: "not-started", homeTeam: "意大利", awayTeam: "比利时", homeFlagCode: "it", awayFlagCode: "be" },
  { matchId: "match-004", time: "06/21 21:15", status: "进行中", statusKey: "in-progress", homeTeam: "巴西", awayTeam: "阿根廷", homeFlagCode: "br", awayFlagCode: "ar" },
  { matchId: "match-005", time: "06/22 17:45", status: "进行中", statusKey: "in-progress", homeTeam: "西班牙", awayTeam: "法国", homeFlagCode: "es", awayFlagCode: "fr" },
  { matchId: "match-006", time: "06/23 19:00", status: "进行中", statusKey: "in-progress", homeTeam: "荷兰", awayTeam: "德国", homeFlagCode: "nl", awayFlagCode: "de" },
  { matchId: "match-007", time: "06/24 20:30", status: "已结束", statusKey: "finished", homeTeam: "韩国", awayTeam: "澳大利亚", homeFlagCode: "kr", awayFlagCode: "au" },
  { matchId: "match-008", time: "06/25 18:30", status: "已结束", statusKey: "finished", homeTeam: "摩洛哥", awayTeam: "尼日利亚", homeFlagCode: "ma", awayFlagCode: "ng" },
  { matchId: "match-009", time: "06/26 22:00", status: "已结束", statusKey: "finished", homeTeam: "克罗地亚", awayTeam: "瑞士", homeFlagCode: "hr", awayFlagCode: "ch" },
];

module.exports = { matches };
