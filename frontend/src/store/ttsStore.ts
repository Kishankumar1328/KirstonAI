import { create } from 'zustand';

export interface TTSItem {
  messageId: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  audioUrl: string | null;
  error: string | null;
}

interface TTSState {
  ttsItems: Record<string, TTSItem>;
  playingMessageId: string | null;

  requestTTS: (messageId: string, text: string, voice?: string) => Promise<void>;
  setPlayingMessageId: (messageId: string | null) => void;
  stopAllPlayback: () => void;
  clearError: (messageId: string) => void;
}

export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove markdown images
    .replace(/\[.*?\]\(.*?\)/g, '') // remove markdown links (keep alt/text if needed, or stripped)
    .replace(/```[\s\S]*?```/g, 'Code block omitted for speech.') // code blocks replaced cleanly
    .replace(/[*_#`~>]/g, '') // remove markdown formatting symbols
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();
}

export const useTTSStore = create<TTSState>((set, get) => ({
  ttsItems: {},
  playingMessageId: null,

  setPlayingMessageId: (messageId) => set({ playingMessageId: messageId }),

  stopAllPlayback: () => set({ playingMessageId: null }),

  clearError: (messageId) =>
    set((state) => {
      const existing = state.ttsItems[messageId];
      if (!existing) return state;
      return {
        ttsItems: {
          ...state.ttsItems,
          [messageId]: { ...existing, status: 'idle', error: null },
        },
      };
    }),

  requestTTS: async (messageId: string, text: string, voice = 'default') => {
    const state = get();
    const existing = state.ttsItems[messageId];

    // Caching check: If audio is already synthesized successfully, reuse cached URL
    if (existing && existing.status === 'success' && existing.audioUrl) {
      return;
    }

    // Duplicate check: If currently loading for this message, do not duplicate request
    if (existing && existing.status === 'loading') {
      return;
    }

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) {
      set((s) => ({
        ttsItems: {
          ...s.ttsItems,
          [messageId]: {
            messageId,
            status: 'error',
            audioUrl: null,
            error: 'No speakable text found in response.',
          },
        },
      }));
      return;
    }

    // Set loading state
    set((s) => ({
      ttsItems: {
        ...s.ttsItems,
        [messageId]: {
          messageId,
          status: 'loading',
          audioUrl: null,
          error: null,
        },
      },
    }));

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${BASE_URL}/api/v1/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText,
          message_id: messageId,
          voice,
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to synthesize speech audio.';
        try {
          const errData = await response.json();
          errorMsg = errData.detail || errData.error?.message || errorMsg;
        } catch (e) {
          errorMsg = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Received empty audio response from server.');
      }

      const audioUrl = URL.createObjectURL(blob);

      set((s) => ({
        ttsItems: {
          ...s.ttsItems,
          [messageId]: {
            messageId,
            status: 'success',
            audioUrl,
            error: null,
          },
        },
      }));
    } catch (err: any) {
      console.error(`[TTS Store Error] Message ID ${messageId}:`, err);
      set((s) => ({
        ttsItems: {
          ...s.ttsItems,
          [messageId]: {
            messageId,
            status: 'error',
            audioUrl: null,
            error: err.message || 'TTS generation failed.',
          },
        },
      }));
    }
  },
}));
