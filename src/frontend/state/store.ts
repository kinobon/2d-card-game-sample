import { atom } from 'jotai';
import { createStore } from 'jotai/vanilla';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ChatMessage {
  username: string;
  text: string;
  timestamp: string;
}

export const messagesAtom = atom<ChatMessage[]>([]);
export const connectionStatusAtom = atom<ConnectionStatus>('connecting');