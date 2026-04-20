export type SelectedMatchInfo = {
  matchId: string;
  homeCountryId: string;
  awayCountryId: string;
};

let selectedMatchInfo: SelectedMatchInfo | null = null;

export function setSelectedMatchInfo(matchInfo: SelectedMatchInfo): void {
  selectedMatchInfo = matchInfo;
}

export function getSelectedMatchInfo(): SelectedMatchInfo | null {
  return selectedMatchInfo;
}

export function clearSelectedMatchInfo(): void {
  selectedMatchInfo = null;
}
