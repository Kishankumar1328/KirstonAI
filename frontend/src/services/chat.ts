import { RAGSource } from '../types/chat';

export interface StreamChatOptions {
  thread_id: string;
  message: string;
  model?: string;
  use_rag?: boolean;
  signal?: AbortSignal;
  onMessageStart?: (data: { message_id: string; thread_id: string; sources?: RAGSource[] }) => void;
  onReasoning?: (chunk: string) => void;
  onToken?: (token: string) => void;
  onConversationUpdated?: (data: { title: string; thread_id: string }) => void;
  onMessageComplete?: (data: { message_id: string; content: string }) => void;
  onError?: (error: string) => void;
}

export async function streamChat({
  thread_id,
  message,
  model = 'nvidia/nemotron-3.5-lightning-30b-a3b',
  use_rag = true,
  signal,
  onMessageStart,
  onReasoning,
  onToken,
  onConversationUpdated,
  onMessageComplete,
  onError,
}: StreamChatOptions): Promise<void> {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${BASE_URL}/api/v1/chat/stream`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ thread_id, message, model, use_rag }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = 'Failed to connect to streaming endpoint.';
      try {
        const json = JSON.parse(errText);
        errMsg = json.error?.message || errMsg;
      } catch (e) {}
      if (onError) onError(errMsg);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      if (onError) onError('ReadableStream not supported by browser.');
      return;
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let currentEvent = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.substring(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.substring(5).trim();
          try {
            const data = JSON.parse(rawData);
            if (currentEvent === 'message_start' && onMessageStart) {
              onMessageStart(data);
            } else if (currentEvent === 'reasoning' && onReasoning) {
              onReasoning(data.content || '');
            } else if (currentEvent === 'token' && onToken) {
              onToken(data.content || '');
            } else if (currentEvent === 'conversation_updated' && onConversationUpdated) {
              onConversationUpdated(data);
            } else if (currentEvent === 'message_complete' && onMessageComplete) {
              onMessageComplete(data);
            } else if (currentEvent === 'error' && onError) {
              onError(data.message || 'Stream error occurred.');
            }
          } catch (e) {
            console.error('Error parsing SSE data line:', line, e);
          }
        }
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Stream cancelled by user.');
    } else {
      if (onError) onError(err.message || 'Network stream error.');
    }
  }
}
