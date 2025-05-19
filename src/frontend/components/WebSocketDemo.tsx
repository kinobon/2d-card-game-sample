import React, { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { Send, Wifi, WifiOff, Users, Key, Plus, LogIn } from 'lucide-react';
import { connectionStatusAtom, messagesAtom } from '../state/store';

const WebSocketDemo: React.FC = () => {
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState(`User_${Math.floor(Math.random() * 1000)}`);
  const [connectionStatus, setConnectionStatus] = useAtom(connectionStatusAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [roomStatus, setRoomStatus] = useState<'idle' | 'creating' | 'joining' | 'matched'>('idle');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setConnectionStatus('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        switch (data.type) {
          case 'room_created':
            setRoomStatus('matched');
            setRoomId(data.data.roomId);
            setMessages([]);
            setError(null);
            break;
          
          case 'matched':
            setRoomStatus('matched');
            setRoomId(data.data.roomId);
            setMessages([]);
            setError(null);
            break;
          
          case 'chat':
            setMessages(prev => [...prev, data.data]);
            break;
          
          case 'user_left':
            setRoomStatus('idle');
            setRoomId(null);
            setMessages(prev => [...prev, {
              username: 'System',
              text: data.data.message,
              timestamp: new Date().toISOString()
            }]);
            break;

          case 'error':
            setError(data.data.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setConnectionStatus('disconnected');
      setRoomStatus('idle');
      setRoomId(null);
    };

    ws.onerror = () => {
      setConnectionStatus('error');
    };

    return () => {
      ws.close();
    };
  }, [setConnectionStatus, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createRoom = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'create_room',
        data: { password: password || undefined }
      }));
      setRoomStatus('creating');
    }
  };

  const joinRoom = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_room',
        data: {
          roomId: joinRoomId,
          password: joinPassword || undefined
        }
      }));
      setRoomStatus('joining');
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const chatMessage = {
      type: 'chat',
      data: {
        username,
        text: message,
        timestamp: new Date().toISOString()
      }
    };

    wsRef.current.send(JSON.stringify(chatMessage));
    setMessages(prev => [...prev, chatMessage.data]);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          {connectionStatus === 'connected' ? (
            <Wifi className="h-5 w-5 text-green-500 mr-2" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500 mr-2" />
          )}
          <span className="font-medium">
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="Your name"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="flex-1 border border-gray-200 rounded-md mb-4 overflow-y-auto p-4 bg-gray-50">
        {roomStatus === 'matched' ? (
          <>
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md mb-4">
              Room ID: {roomId}
            </div>
            {messages.map((msg, index) => (
              <div key={index} className="mb-3">
                <div className="flex items-baseline">
                  <span className="font-semibold text-indigo-600">{msg.username}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-700 ml-1">{msg.text}</p>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-full max-w-sm">
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
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                  disabled={connectionStatus !== 'connected'}
                >
                  Create Room
                </button>
              </div>
            </div>

            <div className="w-full max-w-sm">
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
                  className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  disabled={connectionStatus !== 'connected' || !joinRoomId}
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {roomStatus === 'matched' && (
        <div className="flex">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={sendMessage}
            className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 flex items-center"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WebSocketDemo;