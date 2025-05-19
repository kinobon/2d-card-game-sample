import React, { useState } from 'react';
import WebSocketDemo from './WebSocketDemo';
import { Activity } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">WebSocket Demo</h1>
          <p className="text-indigo-200">Real-time communication with Hono WebSocket</p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <WebSocketDemo />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          <p>Hono + React + WebSocket Template</p>
        </div>
      </footer>
    </div>
  );
}

export default App;