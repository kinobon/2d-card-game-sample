import React, { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { Wifi, WifiOff } from 'lucide-react';
import { connectionStatusAtom } from './frontend/state/store';

function App() {
  const [connectionStatus, setConnectionStatus] = useAtom(connectionStatusAtom);
  const [lastMessage, setLastMessage] = useState<string>('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001/ws');
    setWs(websocket);

    websocket.onopen = () => {
      console.log('Connected to WebSocket');
      setConnectionStatus('connected');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(JSON.stringify(data, null, 2));
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
  }, [setConnectionStatus]);

  const sendTestMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'test', data: 'Hello Server!' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-6 w-6 text-green-500 mr-2" />
            ) : (
              <WifiOff className="h-6 w-6 text-red-500 mr-2" />
            )}
            <span className="font-medium">
              Status: {connectionStatus}
            </span>
          </div>
          <button
            onClick={sendTestMessage}
            disabled={connectionStatus !== 'connected'}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Send Test Message
          </button>
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last Message:</h3>
          <pre className="text-sm whitespace-pre-wrap break-words">
            {lastMessage || 'No messages received'}
          </pre>
        </div>
      </div>
    </div>
  );
}