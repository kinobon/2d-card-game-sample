import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

// Room management
interface Room {
  id: string;
  users: Set<WebSocket>;
  password?: string;
}

const waitingUsers = new Set<WebSocket>();
const rooms = new Map<string, Room>();
const userRooms = new Map<WebSocket, string>();

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

// WebSocket route
app.get('/ws', upgradeWebSocket((c) => {
  console.log('Client connected');

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
            
          case 'chat':
            const roomId = userRooms.get(ws);
            if (roomId) {
              const room = rooms.get(roomId);
              if (room) {
                const chatMessage = {
                  type: 'chat',
                  data: {
                    username: message.data.username,
                    text: message.data.text,
                    timestamp: new Date().toISOString()
                  }
                };
                
                room.users.forEach(user => {
                  if (user !== ws && user.readyState === 1) {
                    user.send(JSON.stringify(chatMessage));
                  }
                });
              }
            }
            break;
            
          case 'leave_room':
            const currentRoomId = userRooms.get(ws);
            if (currentRoomId) {
              const room = rooms.get(currentRoomId);
              if (room) {
                room.users.delete(ws);
                userRooms.delete(ws);
                
                if (room.users.size === 0) {
                  rooms.delete(currentRoomId);
                } else {
                  room.users.forEach(user => {
                    if (user !== ws && user.readyState === 1) {
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
          
          if (room.users.size === 0) {
            rooms.delete(roomId);
          } else {
            room.users.forEach(user => {
              if (user !== ws && user.readyState === 1) {
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