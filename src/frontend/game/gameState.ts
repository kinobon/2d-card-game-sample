import { atom } from 'jotai';
import { GameState, Player, Card } from './types';
import { createInitialDeck, shuffleDeck } from './cards';

function createInitialPlayer(id: string): Player {
  const deck = shuffleDeck(createInitialDeck());
  const hand = deck.slice(0, 5); // Initial hand size of 5
  
  return {
    id,
    life: 20,
    mana: 1,
    maxMana: 1,
    deck: deck.slice(5), // Remaining cards after drawing initial hand
    hand,
    field: []
  };
}

export const initialGameState: GameState = {
  players: {},
  currentTurn: '',
  phase: 'draw',
  turnNumber: 1
};

export const gameStateAtom = atom<GameState>(initialGameState);

// Helper functions for game state updates
export function drawCard(player: Player): Player {
  if (player.deck.length === 0) return player; // Handle deck out condition

  const [drawnCard, ...remainingDeck] = player.deck;
  return {
    ...player,
    deck: remainingDeck,
    hand: [...player.hand, drawnCard]
  };
}

export function playCard(player: Player, cardId: string): Player {
  const cardIndex = player.hand.findIndex(card => card.id === cardId);
  if (cardIndex === -1) return player;

  const card = player.hand[cardIndex];
  if (player.mana < card.cost) return player;

  const newHand = [...player.hand];
  newHand.splice(cardIndex, 1);

  return {
    ...player,
    mana: player.mana - card.cost,
    hand: newHand,
    field: card.type === 'creature' ? [...player.field, card] : player.field
  };
}