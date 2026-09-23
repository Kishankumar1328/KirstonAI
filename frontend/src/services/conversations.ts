import { fetchApi } from './api';
import { Conversation, SearchResult, DocumentItem } from '../types/conversation';
import { Message } from '../types/chat';

export async function createConversation(title?: string, thread_id?: string): Promise<Conversation> {
  return fetchApi<Conversation>('/api/v1/conversations', {
    method: 'POST',
    body: JSON.stringify({ title, thread_id }),
  });
}

export async function listConversations(limit = 50, offset = 0): Promise<{ conversations: Conversation[]; total: number }> {
  return fetchApi<{ conversations: Conversation[]; total: number }>(`/api/v1/conversations?limit=${limit}&offset=${offset}`);
}

export async function getConversation(thread_id: string): Promise<Conversation> {
  return fetchApi<Conversation>(`/api/v1/conversations/${thread_id}`);
}

export async function updateConversationTitle(thread_id: string, title: string): Promise<Conversation> {
  return fetchApi<Conversation>(`/api/v1/conversations/${thread_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export async function deleteConversation(thread_id: string): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/api/v1/conversations/${thread_id}`, {
    method: 'DELETE',
  });
}

export async function listMessages(thread_id: string): Promise<{ messages: Message[]; total: number }> {
  return fetchApi<{ messages: Message[]; total: number }>(`/api/v1/conversations/${thread_id}/messages`);
}

export async function searchHistory(query: string): Promise<{ query: string; results: SearchResult[]; total: number }> {
  return fetchApi<{ query: string; results: SearchResult[]; total: number }>(`/api/v1/search?q=${encodeURIComponent(query)}`);
}

export async function uploadDocument(file: File): Promise<{ document: DocumentItem; message: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(`${BASE_URL}/api/v1/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: 'Upload failed' } }));
    throw new Error(err.error?.message || 'Document upload failed');
  }

  return response.json();
}

export async function uploadBatchDocuments(files: File[]): Promise<{
  total_submitted: number;
  successful_count: number;
  results: Array<{
    filename: string;
    status: 'completed' | 'failed';
    error: string | null;
    document: DocumentItem | null;
  }>;
  message: string;
}> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(`${BASE_URL}/api/v1/documents/batch`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: 'Batch upload failed' } }));
    throw new Error(err.error?.message || err.detail || 'Batch document upload failed');
  }

  return response.json();
}

export async function listDocuments(): Promise<DocumentItem[]> {
  return fetchApi<DocumentItem[]>('/api/v1/documents');
}
