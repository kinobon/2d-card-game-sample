import React, { useEffect } from 'react';
import { Activity } from 'lucide-react';
import RoomManager from './RoomManager';
import GameBoard from './GameBoard';
import { useAtom } from 'jotai';
import { connectionStatusAtom, wsAtom } from '../state/store';

function App() {
  const [connectionStatus, setConnectionStatus] = useAtom(connectionStatusAtom);
  const [ws, setWs] = useAtom(wsAtom);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001/ws');
    setWs(websocket);

    websocket.onopen = () => {
      console.log('Connected to WebSocket');
      setConnectionStatus('connected');
    };

    websocket.onclose = () => {
      console.log('Disconnected from WebSocket');
      setConnectionStatus('disconnected');
    };

    websocket.onerror = () => {
      setConnectionStatus('error');
    };

    return () => {
      websocket.close();
    };
  }, [setConnectionStatus, setWs]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Card Battle Game</h1>
          <p className="text-indigo-200">
            {connectionStatus === 'connected' ? 'Connected to server' : 'Connecting...'}
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow">
          <RoomManager />
          <GameBoard />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          <p>Card Battle Game - Built with React + WebSocket</p>
        </div>
      </footer>
    </div>
  );
}

export default App;