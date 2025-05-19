import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { Card } from '../frontend/game/types'

const app = new Hono()
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// Room management
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
      deck: Card[];
      hand: Card[];
      field: Card[];
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

function createInitialGameState(player1: WebSocket, player2: WebSocket): GameState {
  const p1Username = usernames.get(player1) || 'Player 1';
  const p2Username = usernames.get(player2) || 'Player 2';
  
  return {
    players: {
      [player1.id]: {
        id: player1.id,
        username: p1Username,
        life: 20,
        mana: 1,
        maxMana: 1,
        deck: [],
        hand: [],
        field: [],
        isCurrentTurn: true
      },
      [player2.id]: {
        id: player2.id,
        username: p2Username,
        life: 20,
        mana: 1,
        maxMana: 1,
        deck: [],
        hand: [],
        field: [],
        isCurrentTurn: false
      }
    },
    currentTurn: player1.id,
    phase: 'main',
    turnNumber: 1
  };
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
  const players = Array.from(room.users);
  room.gameState = createInitialGameState(players[0], players[1]);

  // Notify both users about the match
  const matchMessage = JSON.stringify({
    type: 'matched',
    data: { roomId: room.id }
  });
  
  room.users.forEach(user => {
    user.send(matchMessage);
  });

  return true;
}

function broadcastGameState(room: Room) {
  if (!room.gameState) return;

  room.users.forEach(user => {
    if (user.readyState === WebSocket.OPEN) {
      user.send(JSON.stringify({
        type: 'game_state',
        data: room.gameState
      }));
    }
  });
}

// WebSocket route
app.get('/ws', upgradeWebSocket((c) => {
  console.log('Client connected');
  const ws = c.websocket;
  ws.id = Math.random().toString(36).substring(7);

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
            const roomId = userRooms.get(ws);
            if (roomId) {
              usernames.set(ws, message.data.username);
              const room = rooms.get(roomId);
              if (room && room.gameState) {
                broadcastGameState(room);
              }
            }
            break;

          case 'play_card':
            const currentRoomId = userRooms.get(ws);
            if (currentRoomId) {
              const room = rooms.get(currentRoomId);
              if (room?.gameState && room.gameState.currentTurn === ws.id) {
                const player = room.gameState.players[ws.id];
                const card = player.hand.find(c => c.id === message.data.cardId);
                
                if (card && player.mana >= card.cost) {
                  // Remove card from hand and add to field if it's a creature
                  player.hand = player.hand.filter(c => c.id !== card.id);
                  player.mana -= card.cost;
                  
                  if (card.type === 'creature') {
                    player.field.push(card);
                  }
                  
                  broadcastGameState(room);
                }
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