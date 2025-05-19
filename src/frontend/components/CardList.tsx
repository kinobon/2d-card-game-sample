import React from 'react';
import { Card as CardType } from '../game/types';
import Card from './Card';

interface CardListProps {
  cards: CardType[];
  onCardClick?: (card: CardType) => void;
  isPlayable?: boolean;
  showBack?: boolean;
}

const CardList: React.FC<CardListProps> = ({ 
  cards, 
  onCardClick, 
  isPlayable = true,
  showBack = false 
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto p-2">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onClick={() => onCardClick?.(card)}
          isPlayable={isPlayable}
          showBack={showBack}
        />
      ))}
    </div>
  );
};

export default CardList;