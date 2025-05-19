import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Plus, LogIn, Users } from 'lucide-react';
import { connectionStatusAtom, roomStatusAtom, roomIdAtom, wsAtom } from '../state/store';

const RoomManager: React.FC = () => {
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [roomStatus, setRoomStatus] = useAtom(roomStatusAtom);
  const [roomId, setRoomId] = useAtom(roomIdAtom);
  const [ws] = useAtom(wsAtom);
  const [password, setPassword] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'room_created':
          setRoomStatus('matched');
          setRoomId(data.data.roomId);
          setError(null);
          break;
        case 'matched':
          setRoomStatus('matched');
          setRoomId(data.data.roomId);
          setError(null);
          break;
        case 'error':
          setError(data.data.message);
          setRoomStatus('idle');
          break;
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, setRoomStatus, setRoomId]);

  const createRoom = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'create_room',
        data: { password: password || undefined }
      }));
      setRoomStatus('creating');
      setError(null);
    }
  };

  const joinRoom = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'join_room',
        data: {
          roomId: joinRoomId,
          password: joinPassword || undefined
        }
      }));
      setRoomStatus('joining');
      setError(null);
    }
  };

  if (roomStatus === 'matched') {
    return null; // Hide room manager when in a game
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Game Room</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create New Room
          </h3>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Room Password (optional)"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={createRoom}
              disabled={connectionStatus !== 'connected' || roomStatus === 'creating'}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {roomStatus === 'creating' ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <LogIn className="h-5 w-5 mr-2" />
            Join Existing Room
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value)}
              placeholder="Room ID"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              placeholder="Room Password (if required)"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <button
              onClick={joinRoom}
              disabled={connectionStatus !== 'connected' || !joinRoomId || roomStatus === 'joining'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {roomStatus === 'joining' ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
    </div>
  );
};

export default RoomManager;