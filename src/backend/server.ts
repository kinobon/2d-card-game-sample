import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { WebSocket } from 'ws';
import { createNodeWebSocket } from '@hono/node-ws'
import { cardDatabase, shuffleDeck } from '../frontend/game/cards'

const app = new Hono()
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// Room and game state management
interface Room {
  id: string;
  users: Set<WebSocket>;
  password?: string;
  gameState?: GameState;
}

interface GameState {
  players: {
    [key: string]: {
      id: string;
      username: string;
      life: number;
      mana: number;
      maxMana: number;
      deck: any[];
      hand: any[];
      field: any[];
      isCurrentTurn: boolean;
    };
  };
  currentTurn: string;
  phase: 'draw' | 'main' | 'battle' | 'end';
  turnNumber: number;
}

const waitingUsers = new Set<WebSocket>();
const rooms = new Map<string, Room>();
const userRooms = new Map<WebSocket, string>();
const usernames = new Map<WebSocket, string>();

function createInitialGameState(players: WebSocket[]): GameState {
  const gameState: GameState = {
    players: {},
    currentTurn: '',
    phase: 'main',
    turnNumber: 1
  };

  players.forEach((ws, index) => {
    const deck = shuffleDeck([...cardDatabase]);
    const hand = deck.splice(0, 5);
    const username = usernames.get(ws) || `Player ${index + 1}`;
    const playerId = Math.random().toString(36).substring(7);

    gameState.players[playerId] = {
      id: playerId,
      username,
      life: 20,
      mana: 1,
      maxMana: 1,
      deck,
      hand,
      field: [],
      isCurrentTurn: index === 0 // First player starts
    };

    if (index === 0) {
      gameState.currentTurn = playerId;
    }
  });

  return gameState;
}

function createRoom(user1: WebSocket, password?: string): Room {
  const roomId = Math.random().toString(36).substring(7);
  const room = {
    id: roomId,
    users: new Set([user1]),
    password
  };
  rooms.set(roomId, room);
  userRooms.set(user1, roomId);
  return room;
}

function broadcastGameState(room: Room) {
  if (!room.gameState) return;

  const gameStateMessage = JSON.stringify({
    type: 'game_state',
    data: room.gameState
  });
  
  room.users.forEach(user => {
    if (user.readyState === WebSocket.OPEN) {
      user.send(gameStateMessage);
    }
  });
}

function joinRoom(ws: WebSocket, roomId: string, password?: string): boolean {
  const room = rooms.get(roomId);
  
  if (!room) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Room not found' }
    }));
    return false;
  }

  if (room.password && room.password !== password) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Incorrect password' }
    }));
    return false;
  }

  if (room.users.size >= 2) {
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Room is full' }
    }));
    return false;
  }

  room.users.add(ws);
  userRooms.set(ws, roomId);

  // Initialize game state when second player joins
  if (room.users.size === 2) {
    room.gameState = createInitialGameState([...room.users]);
  }

  // Notify both users about the match
  const matchMessage = JSON.stringify({
    type: 'matched',
    data: { roomId: room.id }
  });
  
  room.users.forEach(user => {
    user.send(matchMessage);
  });

  // Send initial game state
  if (room.gameState) {
    broadcastGameState(room);
  }

  return true;
}

// WebSocket route
app.get('/ws', upgradeWebSocket((c) => {
  return {
    onMessage(event, ws) {
      try {
        const message = JSON.parse(event.data.toString());
        console.log('Received:', message);
        
        switch (message.type) {
          case 'create_room':
            if (!userRooms.has(ws)) {
              const room = createRoom(ws, message.data?.password);
              ws.send(JSON.stringify({
                type: 'room_created',
                data: { roomId: room.id }
              }));
            }
            break;

          case 'join_room':
            if (!userRooms.has(ws)) {
              joinRoom(ws, message.data.roomId, message.data.password);
            }
            break;

          case 'game_init':
            const username = message.data.username;
            usernames.set(ws, username);
            const roomId = userRooms.get(ws);
            if (roomId) {
              const room = rooms.get(roomId);
              if (room?.gameState) {
                broadcastGameState(room);
              }
            }
            break;
            
          case 'play_card':
            const currentRoomId = userRooms.get(ws);
            if (currentRoomId) {
              const room = rooms.get(currentRoomId);
              if (room?.gameState) {
                // Handle card play logic here
                broadcastGameState(room);
              }
            }
            break;
            
          case 'leave_room':
            const leaveRoomId = userRooms.get(ws);
            if (leaveRoomId) {
              const room = rooms.get(leaveRoomId);
              if (room) {
                room.users.delete(ws);
                userRooms.delete(ws);
                usernames.delete(ws);
                
                if (room.users.size === 0) {
                  rooms.delete(leaveRoomId);
                } else {
                  room.users.forEach(user => {
                    if (user !== ws && user.readyState === WebSocket.OPEN) {
                      user.send(JSON.stringify({
                        type: 'user_left',
                        data: { message: 'Opponent left the room' }
                      }));
                    }
                  });
                }
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    },

    onClose(ws) {
      const roomId = userRooms.get(ws);
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          room.users.delete(ws);
          userRooms.delete(ws);
          usernames.delete(ws);
          
          if (room.users.size === 0) {
            rooms.delete(roomId);
          } else {
            room.users.forEach(user => {
              if (user !== ws && user.readyState === WebSocket.OPEN) {
                user.send(JSON.stringify({
                  type: 'user_left',
                  data: { message: 'Opponent disconnected' }
                }));
              }
            });
          }
        }
      }
      console.log('Client disconnected');
    }
  }
}))

app.get('/api/health', (c) => c.json({ status: 'healthy' }))

const PORT = 3001
console.log(`Server is running on http://localhost:${PORT}`)

const server = serve({
  fetch: app.fetch,
  port: PORT
})

injectWebSocket(server)