export interface RAGSource {
  document_id: string;
  filename: string;
  snippet: string;
  score: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  model?: string;
  status: 'streaming' | 'completed' | 'cancelled' | 'failed';
  sources?: RAGSource[];
  created_at: string;
  updated_at: string;
}

export interface ChatStreamEvent {
  event: 'message_start' | 'token' | 'message_complete' | 'conversation_updated' | 'error';
  data: any;
}
