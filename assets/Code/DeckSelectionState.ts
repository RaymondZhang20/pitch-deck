import { getAllCardDefinitions } from "./CardCatalog";
import { SelectedMatchInfo } from "./MatchSelectionState";

export type CardSide = "back" | "type" | "face";

export type DeckCardSlot = {
  cardId: number | null;
  side: CardSide;
};

export type DeckSelectionState = {
  matchId: string;
  selectedLimit: number;
  drawPileIds: number[];
  slots: DeckCardSlot[];
  selectedCardIds: number[];
  discardedCardIds: number[];
  redrawRemaining: number;
  pendingDeckCompleteNotice: boolean;
};

const INITIAL_VISIBLE_CARD_COUNT = 9;
const REDEAL_CARD_COUNT = 9;
const DEFAULT_SELECTED_LIMIT = 4;
const DEFAULT_REDRAW_COUNT = 6;

let state: DeckSelectionState | null = null;

export function ensureDeckSelectionState(
  matchInfo: SelectedMatchInfo | null,
): DeckSelectionState {
  const matchId = matchInfo?.matchId ?? "default-match";
  if (state && state.matchId === matchId) {
    return state;
  }

  const shuffledIds = shuffle(
    [...getAllCardDefinitions()].map((card) => card.id),
  );
  const slots: DeckCardSlot[] = [];

  for (let index = 0; index < INITIAL_VISIBLE_CARD_COUNT; index += 1) {
    slots.push({
      cardId: shuffledIds.shift() ?? null,
      side: "back",
    });
  }

  state = {
    matchId,
    selectedLimit: DEFAULT_SELECTED_LIMIT,
    drawPileIds: shuffledIds,
    slots,
    selectedCardIds: [],
    discardedCardIds: [],
    redrawRemaining: DEFAULT_REDRAW_COUNT,
    pendingDeckCompleteNotice: false,
  };

  return state;
}

export function getDeckSelectionState(): DeckSelectionState | null {
  return state;
}

export function clearDeckSelectionState(): void {
  state = null;
}

export function getDeckSlots(): readonly DeckCardSlot[] {
  return state?.slots ?? [];
}

export function getSelectedCardIds(): readonly number[] {
  return state?.selectedCardIds ?? [];
}

export function getDiscardedCardIds(): readonly number[] {
  return state?.discardedCardIds ?? [];
}

export function getDrawPileCount(): number {
  if (!state) {
    return 0;
  }

  return (
    state.drawPileIds.length +
    state.slots.filter((slot) => typeof slot.cardId === "number").length
  );
}

export function getSelectedLimit(): number {
  return state?.selectedLimit ?? DEFAULT_SELECTED_LIMIT;
}

export function getRedrawRemaining(): number {
  return state?.redrawRemaining ?? DEFAULT_REDRAW_COUNT;
}

export function setSlotSide(cardId: number, side: CardSide): void {
  if (!state) {
    return;
  }

  const slot = state.slots.find((item) => item.cardId === cardId);
  if (slot) {
    slot.side = side;
  }
}

export function selectViewedCard(cardId: number): boolean {
  if (!state) {
    return false;
  }

  if (state.selectedCardIds.length >= state.selectedLimit) {
    state.pendingDeckCompleteNotice = true;
    return false;
  }

  const didProcess = processViewedCard(cardId, "select");
  if (didProcess && state.selectedCardIds.length >= state.selectedLimit) {
    state.pendingDeckCompleteNotice = true;
  }

  return didProcess;
}

export function discardViewedCard(cardId: number): boolean {
  return processViewedCard(cardId, "discard");
}

export function consumeDeckCompleteNotice(): boolean {
  if (!state?.pendingDeckCompleteNotice) {
    return false;
  }

  state.pendingDeckCompleteNotice = false;
  return true;
}

export function redealCards(): boolean {
  if (!state || state.redrawRemaining <= 0) {
    return false;
  }

  for (const slot of state.slots) {
    if (typeof slot.cardId === "number") {
      state.discardedCardIds.push(slot.cardId);
    }

    slot.cardId = null;
    slot.side = "back";
  }

  for (let index = 0; index < REDEAL_CARD_COUNT; index += 1) {
    refillDrawPileFromDiscardIfNeeded();
    const nextCardId = state.drawPileIds.shift();
    if (typeof nextCardId !== "number") {
      break;
    }

    state.slots[index].cardId = nextCardId;
    state.slots[index].side = "back";
  }

  state.redrawRemaining -= 1;
  return true;
}

function refillDrawPileFromDiscardIfNeeded(): void {
  if (
    !state ||
    state.drawPileIds.length > 0 ||
    state.discardedCardIds.length === 0
  ) {
    return;
  }

  state.drawPileIds = shuffle([...state.discardedCardIds]);
  state.discardedCardIds = [];
}

function processViewedCard(
  cardId: number,
  action: "select" | "discard",
): boolean {
  if (!state) {
    return false;
  }

  const slot = state.slots.find((item) => item.cardId === cardId);
  if (!slot) {
    return false;
  }

  slot.cardId = null;
  slot.side = "back";

  if (action === "select") {
    state.selectedCardIds.push(cardId);
  } else {
    state.discardedCardIds.push(cardId);
  }

  return true;
}

function shuffle(values: number[]): number[] {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }

  return values;
}
