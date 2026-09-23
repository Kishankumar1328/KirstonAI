import React, { useEffect, useRef } from 'react';
import { Message, RAGSource } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { Edit3, Image as ImageIcon, Volume2, FileText, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  streamingReasoning?: string;
  streamingSources: RAGSource[];
  onRegenerate: () => void;
  onExampleClick: (text: string) => void;
  onSelectSource?: (source: RAGSource) => void;
  onStop?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isStreaming,
  streamingContent,
  streamingReasoning = '',
  streamingSources,
  onRegenerate,
  onExampleClick,
  onSelectSource,
  onStop,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, streamingReasoning, isStreaming]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-between p-6 md:p-12 text-center max-w-4xl mx-auto w-full">
        {/* Top Headline & Subtext */}
        <div className="space-y-2.5 mt-6 md:mt-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-sans">
            Create, explore, be inspired
          </h1>
          <p className="text-xs md:text-sm text-gray-400 font-medium max-w-lg mx-auto">
            Multimodal AI workspace powered by Nemotron & NVIDIA NIMs
          </p>
        </div>

        {/* 2x2 Feature Cards Grid (NVIDIA Reasoning, Image Gen, Speech TTS, Document Studio) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full my-8 max-w-3xl">
          {/* Card 1: AI Text Writer (Nemotron 3.5) */}
          <div
            onClick={() => onExampleClick('Write a comprehensive draft and outline using Nemotron 3.5 reasoning.')}
            className="bg-[#15191C]/90 backdrop-blur-xl border border-[#76B900]/40 hover:border-[#76B900] hover:shadow-glow-nvidia rounded-2xl p-6 text-left transition duration-200 group cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#76B900]/15 border border-[#76B900]/30 flex items-center justify-center text-[#76B900] group-hover:scale-110 transition-transform">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#76B900] transition">
                AI Text Writer
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Nemotron 3.5 reasoning & outlines
              </p>
            </div>
          </div>

          {/* Card 2: NVIDIA Image Gen (FLUX.1 NIM) */}
          <div
            onClick={() => onExampleClick('Generate a visual prompt for NVIDIA FLUX.1 image generation NIM.')}
            className="bg-[#15191C]/90 backdrop-blur-xl border border-[#76B900]/40 hover:border-[#76B900] hover:shadow-glow-nvidia rounded-2xl p-6 text-left transition duration-200 group cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#76B900]/15 border border-[#76B900]/30 flex items-center justify-center text-[#76B900] group-hover:scale-110 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#76B900] transition">
                NVIDIA Image Gen
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                FLUX.1 NIM text-to-image synthesis
              </p>
            </div>
          </div>

          {/* Card 3: NVIDIA Text-to-Speech (Nemotron Speech NIM) */}
          <div
            onClick={() => onExampleClick('Convert text to natural speech using NVIDIA Nemotron Speech NIM.')}
            className="bg-[#15191C]/90 backdrop-blur-xl border border-[#76B900]/40 hover:border-[#76B900] hover:shadow-glow-nvidia rounded-2xl p-6 text-left transition duration-200 group cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#76B900]/15 border border-[#76B900]/30 flex items-center justify-center text-[#76B900] group-hover:scale-110 transition-transform">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#76B900] transition">
                NVIDIA Speech TTS
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Nemotron speech synthesis & audio controls
              </p>
            </div>
          </div>

          {/* Card 4: Document Studio (RAG Grounding) */}
          <div
            onClick={() => navigate('/knowledge')}
            className="bg-[#15191C]/90 backdrop-blur-xl border border-[#76B900]/40 hover:border-[#76B900] hover:shadow-glow-nvidia rounded-2xl p-6 text-left transition duration-200 group cursor-pointer space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#76B900]/15 border border-[#76B900]/30 flex items-center justify-center text-[#76B900] group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white group-hover:text-[#76B900] transition">
                Text editor & RAG Studio
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Writing tips, tricks, & document knowledge
              </p>
            </div>
          </div>
        </div>

        {/* Floating Quick Suggestion Prompt Pill */}
        <div className="mb-4 flex items-center justify-center">
          <button
            onClick={() => onExampleClick("Tell me about this year's top 5 trends!")}
            className="px-5 py-2.5 rounded-full bg-[#15191C]/90 border border-[#76B900]/50 hover:border-[#76B900] text-xs font-semibold text-gray-200 hover:text-white shadow-xl shadow-[#76B900]/15 transition flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#76B900]" />
            <span>Try: top 5 trends this year</span>
          </button>
        </div>
      </div>
    );
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((msg, idx) => {
        const isLastAssistant =
          msg.role === 'assistant' && idx === messages.length - 1 && !isStreaming;
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRegenerate={lastUserMsg ? () => onRegenerate() : undefined}
            isLastAssistant={isLastAssistant}
            onSelectSource={onSelectSource}
          />
        );
      })}

      {isStreaming && (
        <StreamingMessage
          content={streamingContent}
          reasoning={streamingReasoning}
          sources={streamingSources}
          onSelectSource={onSelectSource}
          onStop={onStop}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
};
