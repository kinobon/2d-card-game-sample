import React from 'react';
import { Card as CardType } from '../game/types';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  isPlayable?: boolean;
  showBack?: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, isPlayable = true, showBack = false }) => {
  if (showBack) {
    return (
      <div 
        className="w-24 h-32 bg-indigo-600 rounded-lg shadow-md flex items-center justify-center border-2 border-indigo-700"
      >
        <div className="text-white font-bold text-2xl">★</div>
      </div>
    );
  }

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`w-24 h-32 bg-white rounded-lg shadow-md border-2 ${
        isPlayable ? 'border-green-500 cursor-pointer hover:border-green-600' : 'border-gray-300'
      } p-2 flex flex-col relative overflow-hidden`}
    >
      {/* Mana Cost */}
      <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
        {card.cost}
      </div>

      {/* Card Name */}
      <div className="text-xs font-semibold mt-1 mb-2 text-center">
        {card.name}
      </div>

      {/* Card Image Placeholder */}
      <div className="flex-1 bg-gray-100 rounded mb-2"></div>

      {/* Stats for Creatures */}
      {card.type === 'creature' && (
        <div className="flex justify-between px-1">
          <div className="text-red-600 font-bold">{card.attack}</div>
          <div className="text-green-600 font-bold">{card.health}</div>
        </div>
      )}

      {/* Effect Text */}
      {card.effect && (
        <div className="text-xs italic text-gray-600 mt-1">
          {card.effect}
        </div>
      )}
    </div>
  );
};

export default Card;