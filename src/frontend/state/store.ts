import { atom } from 'jotai';
import { createStore } from 'jotai/vanilla';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export type RoomStatus = 'idle' | 'creating' | 'joining' | 'matched';

interface ChatMessage {
  username: string;
  text: string;
  timestamp: string;
}

interface ConnectedUser {
  id: string;
  username: string;
}

export const messagesAtom = atom<ChatMessage[]>([]);
export const connectionStatusAtom = atom<ConnectionStatus>('connecting');
export const roomStatusAtom = atom<RoomStatus>('idle');
export const roomIdAtom = atom<string | null>(null);
export const wsAtom = atom<WebSocket | null>(null);
export const usernameAtom = atom<string>(`Player_${Math.floor(Math.random() * 1000)}`);
export const connectedUsersAtom = atom<ConnectedUser[]>([]);