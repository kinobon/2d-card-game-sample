import React from 'react';
import { useAtom } from 'jotai';
import { gameStateAtom } from '../game/gameState';
import CardList from './CardList';
import { Card } from '../game/types';

const GameBoard: React.FC = () => {
  const [gameState] = useAtom(gameStateAtom);

  const handleCardPlay = (card: Card) => {
    console.log('Playing card:', card);
    // Implementation will be added later
  };

  if (!gameState.currentTurn) {
    return null; // Don't show game board until game starts
  }

  // For demonstration, using the first player as opponent and second as current player
  const playerIds = Object.keys(gameState.players);
  const opponentId = playerIds[0];
  const playerId = playerIds[1];
  
  const opponent = gameState.players[opponentId];
  const player = gameState.players[playerId];

  if (!opponent || !player) return null;

  const isPlayerTurn = gameState.currentTurn === playerId;

  return (
    <div className="p-6 border-t border-gray-200">
      <div className="flex flex-col gap-8">
        {/* Opponent's Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">Opponent</div>
            <div className="flex items-center gap-4">
              <div>Life: {opponent.life}</div>
              <div>Mana: {opponent.mana}/{opponent.maxMana}</div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <CardList 
              cards={opponent.field} 
              isPlayable={false}
            />
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <CardList 
              cards={opponent.hand} 
              showBack={true}
              isPlayable={false}
            />
          </div>
        </div>

        {/* Middle Area */}
        <div className="flex justify-center items-center h-16">
          <div className="text-lg font-semibold">
            Turn {gameState.turnNumber} - {gameState.phase} Phase
            {isPlayerTurn && <span className="text-green-600 ml-2">(Your Turn)</span>}
          </div>
        </div>

        {/* Player's Area */}
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <CardList 
              cards={player.hand}
              onCardClick={handleCardPlay}
              isPlayable={isPlayerTurn && gameState.phase === 'main'}
            />
          </div>
          <div className="bg-gray-100 rounded-lg p-4">
            <CardList 
              cards={player.field}
              isPlayable={isPlayerTurn && gameState.phase === 'battle'}
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">You</div>
            <div className="flex items-center gap-4">
              <div>Life: {player.life}</div>
              <div>Mana: {player.mana}/{player.maxMana}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;