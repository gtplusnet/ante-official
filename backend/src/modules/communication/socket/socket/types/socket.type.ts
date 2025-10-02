export interface User {
  userId: string;
  userName: string;
  socketId: string;
}

export interface Room {
  name: string;
  host: User;
  users: User[];
}

export interface payload<T> {
  message: string;
  data: T;
}

export interface RequestPayload {
  message: string;
  data: object;
}

export interface AiChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface ServerToClientEvents {
  // AI chat events
  ai_chat_message: (eventPayload: payload<AiChatMessagePayload>) => void;
  // ... add other known events here as needed
}

export interface ClientToServerEvents {
  // AI chat events
  ai_chat_message: (eventPayload: payload<AiChatMessagePayload>) => void;
  // ... add other known events here as needed
}
