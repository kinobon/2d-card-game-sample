// Card Types
export type CardType = 'creature' | 'spell';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  attack?: number;
  health?: number;
  effect?: string;
}

// Game State Types
export interface Player {
  id: string;
  life: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  field: Card[];
}

export interface GameState {
  players: {
    [key: string]: Player;
  };
  currentTurn: string; // player ID
  phase: 'draw' | 'main' | 'battle' | 'end';
  turnNumber: number;
}

// Game Actions
export type GameAction = 
  | { type: 'PLAY_CARD'; playerId: string; cardId: string; target?: string }
  | { type: 'ATTACK'; attackerId: string; targetId: string }
  | { type: 'END_TURN'; playerId: string };