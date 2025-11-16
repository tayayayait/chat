export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp?: number;
  status?: 'sending' | 'delivered' | 'error';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}
