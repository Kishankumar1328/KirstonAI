import { useRef } from 'react';
import { useChatStore, ThreadStreamState } from '../store/chatStore';
import * as convService from '../services/conversations';
import { streamChat } from '../services/chat';
import { Message } from '../types/chat';

// Global map of AbortControllers by thread_id to allow background streaming across route switches
const globalAbortControllers: Record<string, AbortController> = {};

export function useChat(threadId: string | null, activeModel: string = 'nvidia/nemotron-3.5-lightning-30b-a3b') {
  const {
    threadMessages,
    threadStreams,
    setThreadMessages,
    addThreadMessage,
    startThreadStream,
    setThreadMessageId,
    appendThreadToken,
    appendThreadReasoning,
    setThreadSources,
    finishThreadStream,
    useRag,
    updateConversationTitleInStore,
  } = useChatStore();

  const messages = (threadId && threadMessages[threadId]) || [];
  const currentStreamState: ThreadStreamState = (threadId && threadStreams[threadId]) || {
    isStreaming: false,
    streamingContent: '',
    streamingReasoning: '',
    streamingSources: [],
  };

  const loadMessages = async (id: string) => {
    try {
      const res = await convService.listMessages(id);
      setThreadMessages(id, res.messages);
    } catch (e) {
      console.error('Failed to load thread messages:', e);
      setThreadMessages(id, []);
    }
  };

  const sendMessage = async (text: string) => {
    if (!threadId || !text.trim()) return;

    // Check if this thread is already streaming
    if (threadStreams[threadId]?.isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: threadId,
      role: 'user',
      content: text,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addThreadMessage(threadId, userMessage);

    // Initialize background streaming for this thread
    startThreadStream(threadId);
    const abortController = new AbortController();
    globalAbortControllers[threadId] = abortController;

    try {
      await streamChat({
        thread_id: threadId,
        message: text,
        model: activeModel,
        use_rag: useRag,
        signal: abortController.signal,
        onMessageStart: (data) => {
          setThreadMessageId(threadId, data.message_id);
          if (data.sources) setThreadSources(threadId, data.sources);
        },
        onReasoning: (reasoningChunk) => {
          appendThreadReasoning(threadId, reasoningChunk);
        },
        onToken: (token) => {
          appendThreadToken(threadId, token);
        },
        onConversationUpdated: (data) => {
          updateConversationTitleInStore(data.thread_id, data.title);
        },
        onMessageComplete: (data) => {
          const assistantMsg: Message = {
            id: data.message_id,
            conversation_id: threadId,
            role: 'assistant',
            content: data.content,
            status: 'completed',
            sources: useChatStore.getState().threadStreams[threadId]?.streamingSources || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          delete globalAbortControllers[threadId];
          finishThreadStream(threadId, assistantMsg);
        },
        onError: (err) => {
          console.error(`Stream error for thread '${threadId}':`, err);
          delete globalAbortControllers[threadId];
          finishThreadStream(threadId);
        },
      });
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Unhandled stream error:', e);
      }
      delete globalAbortControllers[threadId];
      finishThreadStream(threadId);
    }
  };

  const stopGeneration = () => {
    if (!threadId) return;

    const controller = globalAbortControllers[threadId];
    if (controller) {
      controller.abort();
      delete globalAbortControllers[threadId];
    }

    const state = useChatStore.getState();
    const stream = state.threadStreams[threadId];

    if (stream && stream.streamingContent.trim()) {
      const stoppedMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: threadId,
        role: 'assistant',
        content: stream.streamingContent + " [Stopped by user]",
        status: 'completed',
        sources: stream.streamingSources,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      finishThreadStream(threadId, stoppedMsg);
    } else {
      finishThreadStream(threadId);
    }
  };

  const regenerateResponse = async (lastUserMessage: string) => {
    if (!threadId || currentStreamState.isStreaming) return;
    await sendMessage(lastUserMessage);
  };

  return {
    messages,
    isStreaming: currentStreamState.isStreaming,
    streamingContent: currentStreamState.streamingContent,
    streamingReasoning: currentStreamState.streamingReasoning,
    streamingSources: currentStreamState.streamingSources,
    useRag,
    loadMessages,
    sendMessage,
    stopGeneration,
    regenerateResponse,
  };
}
