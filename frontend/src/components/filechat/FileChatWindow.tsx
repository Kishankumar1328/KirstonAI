import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Send, Sparkles, X, Loader2, Bot, User as UserIcon, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FileAttachmentItem {
  id: string;
  file: File;
  previewUrl?: string;
  isImage: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
}

export const FileChatWindow: React.FC = () => {
  const [attachments, setAttachments] = useState<FileAttachmentItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingReasoning, setStreamingReasoning] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 10 - attachments.length);
    const newItems: FileAttachmentItem[] = selected.map((file) => {
      const isImg = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
        isImage: isImg,
      };
    });

    setAttachments((prev) => [...prev, ...newItems].slice(0, 10));
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSend = async () => {
    if (!inputPrompt.trim() || streaming) return;

    const userText = inputPrompt.trim();
    setInputPrompt('');

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userText,
    };
    setMessages((prev) => [...prev, userMsg]);

    let activeSessionId = sessionId;

    // Upload current attachments so backend DB session attachments match 100%
    if (attachments.length > 0) {
      setUploading(true);
      try {
        const formData = new FormData();
        attachments.forEach((att) => formData.append('files', att.file));
        if (activeSessionId) {
          formData.append('session_id', activeSessionId);
        }

        const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${BASE_URL}/api/v1/file-chat/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('File upload failed.');
        const data = await res.json();
        activeSessionId = data.session_id;
        setSessionId(data.session_id);
      } catch (err: any) {
        console.error('Upload error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `❌ File Upload Error: ${err.message || 'Failed to process files.'}`,
          },
        ]);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID();
    }

    // Start SSE Streaming from /api/v1/file-chat/stream
    setStreaming(true);
    setStreamingContent('');
    setStreamingReasoning('');

    try {
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${BASE_URL}/api/v1/file-chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          message: userText,
        }),
      });

      if (!response.ok) throw new Error('Streaming failed.');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let fullReasoning = '';

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'token') {
                fullContent += event.token;
                setStreamingContent(fullContent);
              } else if (event.type === 'reasoning') {
                fullReasoning += event.reasoning;
                setStreamingReasoning(fullReasoning);
              } else if (event.type === 'done') {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: fullContent,
                    reasoning: fullReasoning,
                  },
                ]);
                setStreaming(false);
                setStreamingContent('');
                setStreamingReasoning('');
              }
            } catch (e) {
              // Ignore parse error on partial chunks
            }
          }
        }
      }
    } catch (err: any) {
      console.error('File Chat Stream error:', err);
      setStreaming(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0D0E] relative overflow-hidden select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-[#242A2E] px-5 flex items-center justify-between bg-[#15191C]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 flex items-center justify-center text-black font-extrabold shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-sans">AI File Chat Studio</h2>
            <p className="text-[10px] text-[#76B900] font-mono">Direct Multi-File & Vision Model Analysis (Llama 3.2 Vision / Nemotron 3.5)</p>
          </div>
        </div>
      </header>

      {/* Main Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="max-w-xl mx-auto my-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#76B900]/15 border border-[#76B900]/40 flex items-center justify-center text-[#76B900] mx-auto shadow-glow-nvidia">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-extrabold text-white">Chat directly with your files & images</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Upload up to 10 files (PDFs, DOCX, TXT, CSV, Code, and PNG/JPG images). Ask questions, summarize, extract data, compare documents, or analyze charts instantly.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 p-4 rounded-2xl ${
              msg.role === 'user' ? 'bg-[#15191C]/70 border border-[#242A2E]' : 'bg-[#111417] border border-[#76B900]/30'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-[#242A2E] text-gray-300' : 'bg-[#76B900]/20 text-[#76B900]'
            }`}>
              {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-xs font-bold text-gray-300 font-mono">
                {msg.role === 'user' ? 'You' : 'File Chat AI (Llama 3.2 Vision)'}
              </div>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex gap-4 p-4 rounded-2xl bg-[#111417] border border-[#76B900]/50 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-[#76B900]/20 text-[#76B900] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="text-xs font-bold text-[#76B900] font-mono">Analyzing Files...</div>
              <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent || 'Processing file context...'}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Input Dock with Multi-File Attachment Preview Bar */}
      <div className="p-4 bg-[#15191C]/90 border-t border-[#242A2E] space-y-3">
        {/* File Attachments Pills Carousel */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B0D0E] border border-[#76B900]/40 text-xs text-gray-200 shrink-0 font-mono"
              >
                {att.isImage ? (
                  <img src={att.previewUrl} alt={att.file.name} className="w-5 h-5 rounded object-cover" />
                ) : (
                  <FileText className="w-4 h-4 text-[#76B900]" />
                )}
                <span className="truncate max-w-[140px]">{att.file.name}</span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-0.5 hover:text-red-400 text-gray-400 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <span className="text-[10px] text-[#76B900] font-mono shrink-0">({attachments.length}/10 files attached)</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2 bg-[#0B0D0E] border border-[#76B900]/50 rounded-2xl p-2 focus-within:border-[#76B900] transition">
          <input
            type="file"
            multiple
            accept=".txt,.md,.json,.csv,.py,.js,.ts,.pdf,.docx,.png,.jpg,.jpeg,.webp"
            onChange={handleFileSelect}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= 10}
            className="p-2 rounded-xl text-gray-400 hover:text-[#76B900] hover:bg-[#15191C] transition disabled:opacity-40"
            title="Attach up to 10 documents or images"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              attachments.length > 0
                ? `Ask questions, summarize, or extract data from ${attachments.length} attached file(s)...`
                : 'Attach files (PDFs, DOCX, TXT, Images) and ask anything...'
            }
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputPrompt.trim() || streaming || uploading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#76B900] to-emerald-500 hover:from-[#84cc16] hover:to-emerald-400 text-black font-extrabold transition disabled:opacity-30"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Send className="w-4 h-4 text-black stroke-[3]" />}
          </button>
        </div>
      </div>
    </div>
  );
};
