let selectedCardId: number | null = null;

export function setSelectedCardId(cardId: number): void {
  selectedCardId = cardId;
}

export function getSelectedCardId(): number | null {
  return selectedCardId;
}

export function clearSelectedCardId(): void {
  selectedCardId = null;
}
