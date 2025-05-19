import React from 'react';
import { useAtom } from 'jotai';
import { gameStateAtom } from '../game/gameState';

const GameBoard: React.FC = () => {
  const [gameState] = useAtom(gameStateAtom);

  if (!gameState.currentTurn) {
    return null; // Don't show game board until game starts
  }

  return (
    <div className="p-6 border-t border-gray-200">
      <div className="flex flex-col gap-8">
        {/* Opponent's Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">Opponent</div>
            <div className="flex items-center gap-4">
              <div>Life: 20</div>
              <div>Mana: 0/0</div>
            </div>
          </div>
          <div className="h-32 bg-gray-100 rounded-lg p-4">
            Field
          </div>
          <div className="h-24 bg-gray-100 rounded-lg p-4">
            Hand
          </div>
        </div>

        {/* Middle Area */}
        <div className="flex justify-center items-center h-16">
          <div className="text-lg font-semibold">
            Turn {gameState.turnNumber} - {gameState.phase} Phase
          </div>
        </div>

        {/* Player's Area */}
        <div className="space-y-4">
          <div className="h-24 bg-gray-100 rounded-lg p-4">
            Hand
          </div>
          <div className="h-32 bg-gray-100 rounded-lg p-4">
            Field
          </div>
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">You</div>
            <div className="flex items-center gap-4">
              <div>Life: 20</div>
              <div>Mana: 0/0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;