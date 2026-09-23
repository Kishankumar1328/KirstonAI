import { create } from 'zustand';
import { Conversation, SearchResult, DocumentItem } from '../types/conversation';
import { Message, RAGSource } from '../types/chat';

export interface ThreadStreamState {
  isStreaming: boolean;
  streamingContent: string;
  streamingReasoning: string;
  streamingSources: RAGSource[];
  streamingMessageId?: string | null;
}

interface ChatState {
  activeThreadId: string | null;
  conversations: Conversation[];
  threadMessages: Record<string, Message[]>; // Map threadId -> Message[]
  threadStreams: Record<string, ThreadStreamState>; // Map threadId -> ThreadStreamState
  
  useRag: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  documents: DocumentItem[];
  isSidebarOpen: boolean;
  isDocumentModalOpen: boolean;

  setActiveThreadId: (id: string | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversationTitleInStore: (id: string, title: string) => void;
  removeConversationFromStore: (id: string) => void;

  setThreadMessages: (threadId: string, messages: Message[]) => void;
  addThreadMessage: (threadId: string, message: Message) => void;

  startThreadStream: (threadId: string) => void;
  setThreadMessageId: (threadId: string, messageId: string) => void;
  appendThreadToken: (threadId: string, token: string) => void;
  appendThreadReasoning: (threadId: string, reasoningChunk: string) => void;
  setThreadSources: (threadId: string, sources: RAGSource[]) => void;
  finishThreadStream: (threadId: string, assistantMsg?: Message) => void;

  setUseRag: (useRag: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setDocuments: (documents: DocumentItem[]) => void;
  addDocument: (document: DocumentItem) => void;

  setSidebarOpen: (isOpen: boolean) => void;
  setDocumentModalOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeThreadId: null,
  conversations: [],
  threadMessages: {},
  threadStreams: {},
  useRag: true,
  searchQuery: '',
  searchResults: [],
  documents: [],
  isSidebarOpen: false,
  isDocumentModalOpen: false,

  setActiveThreadId: (id) => set({ activeThreadId: id }),
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations.filter((c) => c.id !== conversation.id)],
    })),
  updateConversationTitleInStore: (id, title) =>
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
    })),
  removeConversationFromStore: (id) =>
    set((state) => {
      const newMessages = { ...state.threadMessages };
      delete newMessages[id];
      const newStreams = { ...state.threadStreams };
      delete newStreams[id];

      return {
        conversations: state.conversations.filter((c) => c.id !== id),
        threadMessages: newMessages,
        threadStreams: newStreams,
        activeThreadId: state.activeThreadId === id ? null : state.activeThreadId,
      };
    }),

  setThreadMessages: (threadId, messages) =>
    set((state) => ({
      threadMessages: { ...state.threadMessages, [threadId]: messages },
    })),

  addThreadMessage: (threadId, message) =>
    set((state) => {
      const existing = state.threadMessages[threadId] || [];
      return {
        threadMessages: {
          ...state.threadMessages,
          [threadId]: [...existing.filter((m) => m.id !== message.id), message],
        },
      };
    }),

  startThreadStream: (threadId) =>
    set((state) => ({
      threadStreams: {
        ...state.threadStreams,
        [threadId]: {
          isStreaming: true,
          streamingContent: '',
          streamingReasoning: '',
          streamingSources: [],
          streamingMessageId: null,
        },
      },
    })),

  setThreadMessageId: (threadId, messageId) =>
    set((state) => {
      const curr = state.threadStreams[threadId] || {
        isStreaming: true,
        streamingContent: '',
        streamingReasoning: '',
        streamingSources: [],
      };
      return {
        threadStreams: {
          ...state.threadStreams,
          [threadId]: { ...curr, streamingMessageId: messageId },
        },
      };
    }),

  appendThreadToken: (threadId, token) =>
    set((state) => {
      const curr = state.threadStreams[threadId] || {
        isStreaming: true,
        streamingContent: '',
        streamingReasoning: '',
        streamingSources: [],
      };
      return {
        threadStreams: {
          ...state.threadStreams,
          [threadId]: { ...curr, streamingContent: curr.streamingContent + token },
        },
      };
    }),

  appendThreadReasoning: (threadId, reasoningChunk) =>
    set((state) => {
      const curr = state.threadStreams[threadId] || {
        isStreaming: true,
        streamingContent: '',
        streamingReasoning: '',
        streamingSources: [],
      };
      return {
        threadStreams: {
          ...state.threadStreams,
          [threadId]: { ...curr, streamingReasoning: curr.streamingReasoning + reasoningChunk },
        },
      };
    }),

  setThreadSources: (threadId, sources) =>
    set((state) => {
      const curr = state.threadStreams[threadId] || {
        isStreaming: true,
        streamingContent: '',
        streamingReasoning: '',
        streamingSources: [],
      };
      return {
        threadStreams: {
          ...state.threadStreams,
          [threadId]: { ...curr, streamingSources: sources },
        },
      };
    }),

  finishThreadStream: (threadId, assistantMsg) =>
    set((state) => {
      const newStreams = { ...state.threadStreams };
      delete newStreams[threadId];

      let newMessages = { ...state.threadMessages };
      if (assistantMsg) {
        const existing = newMessages[threadId] || [];
        newMessages[threadId] = [...existing.filter((m) => m.id !== assistantMsg.id), assistantMsg];
      }

      return {
        threadStreams: newStreams,
        threadMessages: newMessages,
      };
    }),

  setUseRag: (useRag) => set({ useRag }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) =>
    set((state) => ({ documents: [document, ...state.documents] })),

  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setDocumentModalOpen: (isOpen) => set({ isDocumentModalOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
