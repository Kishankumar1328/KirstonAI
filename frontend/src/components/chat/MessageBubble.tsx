import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, RAGSource } from '../../types/chat';
import { SourceList } from './SourceList';
import { AudioPlayer } from './AudioPlayer';
import { useTTSStore } from '../../store/ttsStore';
import {
  Copy,
  Check,
  RefreshCw,
  User as UserIcon,
  Cpu,
  ExternalLink,
  Sparkles,
  Volume2,
  Loader2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  isLastAssistant?: boolean;
  onSelectSource?: (source: RAGSource) => void;
}

const MediaCard: React.FC<{ src: string; alt?: string }> = ({ src, alt = "" }) => {
  const altText = alt.toLowerCase();

  const isAudioTag = src.includes('tts') || src.endsWith('.wav') || src.endsWith('.mp3') || altText.includes('audio') || altText.includes('speech');
  if (isAudioTag) {
    return <AudioPlayer src={src} title={alt || "KirstonAI Speech Synthesis"} />;
  }

  // Image Generation NIM Rendering
  return (
    <div className="my-4 space-y-2 group/img inline-block max-w-2xl w-full">
      <div className="relative rounded-2xl overflow-hidden border border-[#76B900]/60 shadow-glow-nvidia bg-[#15191C]">
        <img
          src={src}
          alt={alt || "NVIDIA Image NIM"}
          className="w-full h-auto object-cover max-h-[520px] rounded-2xl hover:scale-[1.01] transition-transform duration-200"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center gap-2">
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-black/80 backdrop-blur-md text-white hover:text-[#76B900] border border-white/20 transition"
            title="Open full resolution"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#76B900] font-mono px-1">
        <span className="flex items-center gap-1.5 font-bold">
          <Sparkles className="w-3.5 h-3.5 text-[#76B900]" />
          NVIDIA FLUX.1 Image NIM Visual Output
        </span>
        <span className="text-gray-400 font-semibold">1024x1024 High-Res</span>
      </div>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRegenerate,
  isLastAssistant,
  onSelectSource,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const ttsItem = useTTSStore((state) => state.ttsItems[message.id]);
  const requestTTS = useTTSStore((state) => state.requestTTS);
  const clearTTSError = useTTSStore((state) => state.clearError);

  const isTTSLoading = ttsItem?.status === 'loading';
  const isTTSSuccess = ttsItem?.status === 'success' && ttsItem.audioUrl;
  const isTTSError = ttsItem?.status === 'error';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleTTSClick = () => {
    if (isTTSLoading) return;
    if (isTTSError) {
      clearTTSError(message.id);
    }
    requestTTS(message.id, message.content);
  };

  return (
    <div className={`flex gap-4 p-4 md:p-6 ${isUser ? 'bg-transparent' : 'bg-[#111417]/40 dark:bg-[#111417]/40 light:bg-[#F1F5F9]'} border-b border-[#242A2E]/40 group`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isUser
          ? 'bg-[#15191C] border border-[#242A2E] text-gray-300'
          : 'bg-[#76B900]/15 border border-[#76B900]/40 text-[#76B900]'
        }`}>
        {isUser ? <UserIcon className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
      </div>

      <div className="flex-1 overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-1.5 text-xs text-gray-400">
          <div className="flex items-center gap-2 font-medium">
            <span>{isUser ? 'You' : 'KirstonAI'}</span>
            {!isUser && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#76B900]/15 border border-[#76B900]/30 text-[#76B900] font-mono">
                Nemotron 3.5 Lightning
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isUser && (
              <button
                onClick={handleTTSClick}
                disabled={isTTSLoading}
                className={`p-1 border border-transparent hover:border-[#242A2E] rounded transition flex items-center gap-1 text-[11px] ${
                  isTTSLoading
                    ? 'bg-[#76B900]/20 text-[#76B900] border-[#76B900]/50 animate-pulse cursor-not-allowed'
                    : isTTSSuccess
                    ? 'bg-[#76B900]/20 text-[#76B900] border-[#76B900]/40'
                    : 'hover:bg-[#15191C] text-gray-400 hover:text-white'
                }`}
                title={isTTSLoading ? 'Generating audio...' : isTTSSuccess ? 'Audio generated' : 'Read Aloud (TTS)'}
              >
                {isTTSLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#76B900] animate-spin" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isTTSLoading
                    ? 'Generating audio...'
                    : isTTSSuccess
                    ? 'Audio Ready'
                    : 'Listen'}
                </span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1 hover:bg-[#15191C] border border-transparent hover:border-[#242A2E] text-gray-400 hover:text-white rounded transition flex items-center gap-1 text-[11px]"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#76B900]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? <span className="text-[#76B900]">Copied</span> : <span>Copy</span>}
            </button>

            {!isUser && isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 hover:bg-[#15191C] border border-transparent hover:border-[#242A2E] text-gray-400 hover:text-white rounded transition flex items-center gap-1 text-[11px]"
                title="Regenerate response"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceList sources={message.sources} onSelectSource={onSelectSource} />
        )}

        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ node, ...props }) => (
                <MediaCard src={props.src || ''} alt={props.alt || ''} />
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* TTS Audio Player Component when synthesized */}
        {!isUser && isTTSSuccess && ttsItem?.audioUrl && (
          <div className="mt-3">
            <AudioPlayer
              src={ttsItem.audioUrl}
              messageId={message.id}
              title="KirstonAI Speech Synthesis"
            />
          </div>
        )}

        {/* TTS Error Alert */}
        {!isUser && isTTSError && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{ttsItem?.error || 'Failed to generate audio stream.'}</span>
            </div>
            <button
              onClick={handleTTSClick}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-sans flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
