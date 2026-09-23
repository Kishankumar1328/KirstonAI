import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SourceList } from './SourceList';
import { RAGSource } from '../../types/chat';
import { AudioPlayer } from './AudioPlayer';
import { Cpu, Brain, ChevronDown, ChevronUp, ExternalLink, Sparkles, Square } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
  reasoning?: string;
  sources?: RAGSource[];
  onSelectSource?: (source: RAGSource) => void;
  onStop?: () => void;
}

const MediaCardStream: React.FC<{ src: string; alt?: string }> = ({ src, alt = "" }) => {
  const altText = alt.toLowerCase();

  const isAudioTag = src.includes('tts') || src.endsWith('.wav') || altText.includes('audio') || altText.includes('speech');
  if (isAudioTag) {
    return <AudioPlayer src={src} title={alt || "NVIDIA Nemotron Speech Synthesis"} />;
  }

  // Image Generation NIM Rendering
  return (
    <div className="my-4 space-y-2 group/img inline-block max-w-2xl w-full">
      <div className="relative rounded-2xl overflow-hidden border border-[#76B900]/60 shadow-glow-nvidia bg-[#15191C]">
        <img
          src={src}
          alt={alt || "NVIDIA Image NIM"}
          className="w-full h-auto object-cover max-h-[520px] rounded-2xl"
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

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  content,
  reasoning = '',
  sources = [],
  onSelectSource,
  onStop,
}) => {
  const [showThinking, setShowThinking] = useState(true);

  return (
    <div className="flex gap-4 p-4 md:p-6 bg-[#111417]/60 dark:bg-[#111417]/60 light:bg-[#F1F5F9] border-b border-[#242A2E]/40 animate-pulse-glow">
      <div className="w-8 h-8 rounded-lg bg-[#76B900]/15 border border-[#76B900]/40 flex items-center justify-center text-[#76B900] shrink-0 mt-0.5">
        <Cpu className="w-4 h-4" />
      </div>

      <div className="flex-1 overflow-hidden min-w-0">
        <div className="flex items-center justify-between mb-2 text-xs">
          <div className="flex items-center gap-2 text-[#76B900] font-medium">
            <span>KirstonAI</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#76B900]/15 border border-[#76B900]/30 text-[#76B900] font-mono">
              Nemotron 3.5 Lightning
            </span>
          </div>

          {onStop && (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 text-xs font-mono font-semibold transition active:scale-95 shadow-sm"
              title="Stop response generation"
            >
              <Square className="w-3 h-3 fill-current animate-pulse" />
              <span>Stop Generating</span>
            </button>
          )}
        </div>

        {reasoning && (
          <div className="mb-3 bg-[#15191C] border border-[#242A2E] rounded-xl overflow-hidden text-xs">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full flex items-center justify-between p-2.5 bg-[#0B0D0E]/60 hover:bg-[#0B0D0E] text-gray-300 transition font-medium"
            >
              <div className="flex items-center gap-2 text-amber-400">
                <Brain className="w-3.5 h-3.5 animate-pulse" />
                <span>Reasoning Process (Nemotron 3.5 Thinking)</span>
              </div>
              {showThinking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showThinking && (
              <div className="p-3 text-[11px] font-mono text-gray-400 bg-[#0B0D0E]/90 border-t border-[#242A2E]/40 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {reasoning}
              </div>
            )}
          </div>
        )}

        {sources.length > 0 && <SourceList sources={sources} onSelectSource={onSelectSource} />}

        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: ({ node, ...props }) => (
                <MediaCardStream src={props.src || ''} alt={props.alt || ''} />
              )
            }}
          >
            {content || 'Generating response...'}
          </ReactMarkdown>
          <span className="inline-block w-2 h-4 ml-1 bg-[#76B900] animate-pulse align-middle" />
        </div>
      </div>
    </div>
  );
};
