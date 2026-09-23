export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  status: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface ConversationGroup {
  label: 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older';
  conversations: Conversation[];
}

export interface SearchResult {
  conversation_id: string;
  conversation_title: string;
  message_id?: string;
  snippet: string;
  match_type: 'title' | 'message';
  created_at: string;
}

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  chunk_count: number;
  created_at: string;
}
