import React, { useEffect } from 'react';
import { useAtom } from 'jotai';
import { gameStateAtom } from '../game/gameState';
import { usernameAtom, roomStatusAtom, wsAtom } from '../state/store';
import CardList from './CardList';
import { Card } from '../game/types';

const GameBoard: React.FC = () => {
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [username] = useAtom(usernameAtom);
  const [roomStatus] = useAtom(roomStatusAtom);
  const [ws] = useAtom(wsAtom);

  useEffect(() => {
    if (roomStatus === 'matched' && ws) {
      // Initialize game state when matched
      ws.send(JSON.stringify({
        type: 'game_init',
        data: { username }
      }));
    }
  }, [roomStatus, ws, username]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'game_state') {
        setGameState(data.data);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, setGameState]);

  const handleCardPlay = (card: Card) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'play_card',
        data: { cardId: card.id }
      }));
    }
  };

  if (!gameState.currentTurn || roomStatus !== 'matched') {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Waiting for game to start...</p>
      </div>
    );
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
            <div className="text-lg font-semibold flex items-center gap-2">
              <span>{opponent.username || 'Opponent'}</span>
              {opponent.isCurrentTurn && (
                <span className="text-green-600 text-sm">(Active)</span>
              )}
            </div>
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
            <div className="text-lg font-semibold flex items-center gap-2">
              <span>{username} (You)</span>
              {player.isCurrentTurn && (
                <span className="text-green-600 text-sm">(Active)</span>
              )}
            </div>
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