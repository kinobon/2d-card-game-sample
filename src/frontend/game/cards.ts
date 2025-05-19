import { Card } from './types';

export const cardDatabase: Card[] = [
  {
    id: 'flame-warrior-1',
    name: '炎刃の戦士',
    type: 'creature',
    cost: 1,
    attack: 2,
    health: 1
  },
  {
    id: 'water-mage-1',
    name: '水流の魔導士',
    type: 'creature',
    cost: 2,
    attack: 1,
    health: 2,
    effect: 'Draw a card when this creature enters the field.'
  },
  {
    id: 'forest-guardian-1',
    name: '森林の守護者',
    type: 'creature',
    cost: 2,
    attack: 2,
    health: 2
  },
  {
    id: 'light-angel-1',
    name: '光翼の天使',
    type: 'creature',
    cost: 3,
    attack: 1,
    health: 4
  },
  {
    id: 'shadow-assassin-1',
    name: '闇影の刺客',
    type: 'creature',
    cost: 2,
    attack: 3,
    health: 1
  },
  {
    id: 'flame-spell-1',
    name: '炎熱の呪文',
    type: 'spell',
    cost: 2,
    effect: 'Deal 3 damage to target player.'
  },
  // Add more cards following the same pattern...
];

export function createInitialDeck(): Card[] {
  // For now, return a simple 20-card deck
  return Array(20).fill(null).map((_, index) => ({
    ...cardDatabase[index % cardDatabase.length],
    id: `${cardDatabase[index % cardDatabase.length].id}-${Math.random().toString(36).substr(2, 9)}`
  }));
}

export function shuffleDeck(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}