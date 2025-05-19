import React, { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Plus, LogIn, Users, Copy, User } from 'lucide-react';
import { connectionStatusAtom, roomStatusAtom, roomIdAtom, wsAtom, usernameAtom } from '../state/store';

const RoomManager: React.FC = () => {
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [roomStatus, setRoomStatus] = useAtom(roomStatusAtom);
  const [roomId, setRoomId] = useAtom(roomIdAtom);
  const [ws] = useAtom(wsAtom);
  const [username, setUsername] = useAtom(usernameAtom);
  const [password, setPassword] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'room_created':
          setRoomStatus('creating');
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
        data: { 
          password: password || undefined,
          username
        }
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
          password: joinPassword || undefined,
          username
        }
      }));
      setRoomStatus('joining');
      setError(null);
    }
  };

  const copyRoomId = async () => {
    if (roomId) {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (roomStatus === 'matched') {
    return null;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Game Room</h2>
      
      {/* Username Input */}
      <div className="mb-6">
        <div className="flex items-center gap-2 max-w-xs">
          <User className="h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      {roomStatus === 'creating' && roomId && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Room Created!</h3>
          <p className="text-green-700 mb-2">Share this room ID with your opponent:</p>
          <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-200">
            <code className="flex-1 font-mono text-lg">{roomId}</code>
            <button
              onClick={copyRoomId}
              className="p-2 hover:bg-green-50 rounded"
              title="Copy room ID"
            >
              <Copy className="h-5 w-5 text-green-700" />
            </button>
          </div>
          {copied && (
            <p className="text-green-600 text-sm mt-2">Room ID copied to clipboard!</p>
          )}
        </div>
      )}

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
              disabled={connectionStatus !== 'connected' || roomStatus === 'creating' || !username.trim()}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {roomStatus === 'creating' ? 'Waiting for opponent...' : 'Create Room'}
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
              disabled={connectionStatus !== 'connected' || !joinRoomId || roomStatus === 'joining' || !username.trim()}
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