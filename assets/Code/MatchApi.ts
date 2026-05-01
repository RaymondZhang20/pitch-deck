export type MatchStatusKey = "not-started" | "in-progress" | "finished";

export type MatchInfo = {
  matchId: string;
  time: string;
  status: string;
  statusKey: MatchStatusKey;
  homeTeam: string;
  awayTeam: string;
  homeFlagCode: string;
  awayFlagCode: string;
};

const MATCH_LIST_API_URL = "http://127.0.0.1:3000/api/match/list";
const MATCH_API_BASE_URL = "http://127.0.0.1:3000/api/match";

export async function fetchMatchList(): Promise<MatchInfo[]> {
  const response = await fetch(MATCH_LIST_API_URL, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `[MatchApi] Failed to fetch matches: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as {
    matches?: MatchInfo[];
  };

  return Array.isArray(payload.matches) ? payload.matches : [];
}

export async function fetchMatchById(matchId: string): Promise<MatchInfo> {
  const response = await fetch(
    `${MATCH_API_BASE_URL}/${encodeURIComponent(matchId)}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(
      `[MatchApi] Failed to fetch match ${matchId}: ${response.status} ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as {
    match?: MatchInfo;
  };

  if (!payload.match) {
    throw new Error(`[MatchApi] Missing match payload for ${matchId}`);
  }

  return payload.match;
}
