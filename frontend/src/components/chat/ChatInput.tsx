import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip, Mic, MicOff, FileText, Image as ImageIcon, Table, X, Volume2 } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  selectedModel?: string;
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, onStop, isStreaming, selectedModel }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: AttachedFile[] = Array.from(files).map((f) => ({
      name: f.name,
      type: f.type || f.name.split('.').pop() || 'file',
      size: f.size,
    }));
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerTTSPrompt = () => {
    if (!text.trim()) {
      setText('convert to speech: Welcome to KirstonAI Nemotron Speech Synthesis');
    } else if (!text.toLowerCase().includes('convert to speech') && !text.toLowerCase().includes('read aloud')) {
      setText(`convert to speech: ${text}`);
    }
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if ((!text.trim() && attachedFiles.length === 0) || isStreaming) return;

    let sendContent = text.trim();
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map((f) => f.name).join(', ');
      sendContent = sendContent ? `${sendContent} (Attached Files: ${fileNames})` : `[Attached Files: ${fileNames}]`;
    }

    onSend(sendContent);
    setText('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsListening(false);
  };

  const toggleSpeechToText = async () => {
    setSttError(null);

    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttError('Speech Recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.');
      return;
    }

    // Step 1: Request microphone permission explicitly via MediaDevices API
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      }
    } catch (err: any) {
      console.warn('Microphone permission denied:', err);
      setSttError('Microphone access denied. Please click the camera/microphone icon in your browser address bar to allow microphone access.');
      return;
    }

    // Step 2: Initialize Webkit Speech Recognition
    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const detectedLang = navigator.language || 'en-US';
      recognition.lang = detectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setSttError(null);
      };

      recognition.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript;
          }
        }

        const combined = (finalText + interimText).trim();
        if (combined) {
          setText(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          stopListening();
          setSttError('Microphone access blocked by browser security. Please allow microphone permissions.');
        } else if (event.error === 'network') {
          stopListening();
          setSttError('Speech network service error. Check internet connection or browser settings.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setSttError(`Speech recognition notice (${event.error})`);
        }
      };

      recognition.onend = () => {
        if (recognitionRef.current === recognition && isListening) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      stopListening();
      setSttError('Could not start speech recognition session.');
    }
  };

  let placeholderText = "Ask anything, convert text to speech, attach files, or generate media...";

  return (
    <div className="p-4 bg-[#0B0D0E]/90 dark:bg-[#0B0D0E]/90 light:bg-white/90 backdrop-blur border-t border-[#242A2E]/60 dark:border-[#242A2E]/60 light:border-[#E2E8F0] max-w-4xl mx-auto w-full space-y-2 font-sans">
      {/* Listening Indicator Bar */}
      {isListening && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/40 text-xs text-red-400 font-mono shadow-sm animate-pulse">
          <span className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            🎙️ Live Microphone Dictation Active ({navigator.language || 'en-US'}) — Speak now...
          </span>
          <button onClick={toggleSpeechToText} className="text-xs font-bold underline hover:text-white">
            Stop Recording
          </button>
        </div>
      )}

      {/* STT Error Notification */}
      {sttError && (
        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-400 font-mono">
          <span>⚠️ {sttError}</span>
          <button onClick={() => setSttError(null)} className="text-xs text-amber-300 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attached Files Preview Bar */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {attachedFiles.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#15191C] dark:bg-[#15191C] light:bg-[#F1F5F9] border border-[#76B900]/50 text-xs text-white dark:text-white light:text-[#0F172A] font-mono shrink-0 shadow-sm"
            >
              {file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? (
                <Table className="w-3.5 h-3.5 text-[#76B900]" />
              ) : file.name.endsWith('.pdf') || file.name.endsWith('.docx') ? (
                <FileText className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="truncate max-w-[140px]">{file.name}</span>
              <button onClick={() => removeAttachment(idx)} className="text-gray-400 hover:text-white ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-end bg-[#15191C]/90 dark:bg-[#15191C]/90 light:bg-white backdrop-blur-xl border border-[#242A2E] dark:border-[#242A2E] light:border-[#E2E8F0] rounded-2xl focus-within:border-[#76B900]/80 focus-within:ring-1 focus-within:ring-[#76B900]/40 transition shadow-glow-nvidia">
        {/* Hidden Multi-Format File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.docx,.txt,.csv,.xlsx,.xls,.json,.png,.jpg,.jpeg"
          className="hidden"
        />

        {/* Universal Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3.5 text-gray-400 hover:text-[#76B900] transition shrink-0"
          title="Attach Documents, Datasets, or Images"
        >
          <Paperclip className="w-4.5 h-4.5" />
        </button>

        {/* Text-to-Speech Quick Action Button */}
        <button
          type="button"
          onClick={triggerTTSPrompt}
          className="p-3.5 text-gray-400 hover:text-[#76B900] transition shrink-0"
          title="NVIDIA Nemotron Text-to-Speech (TTS) — Convert prompt text into audio speech"
        >
          <Volume2 className="w-4.5 h-4.5 text-[#76B900]" />
        </button>

        {/* Speech-To-Text Microphone Button */}
        <button
          type="button"
          onClick={toggleSpeechToText}
          className={`p-3.5 transition shrink-0 ${isListening ? 'text-red-500 animate-bounce' : 'text-gray-400 hover:text-[#76B900]'
            }`}
          title={isListening ? 'Stop recording voice' : 'Speech-to-Text Voice Input (Dictation)'}
        >
          {isListening ? <MicOff className="w-4.5 h-4.5 text-red-500" /> : <Mic className="w-4.5 h-4.5" />}
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          rows={1}
          disabled={isStreaming}
          className="w-full resize-none bg-transparent py-3.5 text-sm text-white dark:text-white light:text-[#0F172A] placeholder-gray-500 focus:outline-none max-h-48 overflow-y-auto font-sans"
        />

        <div className="p-2 shrink-0">
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30 transition flex items-center justify-center"
              title="Stop generation"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!text.trim() && attachedFiles.length === 0}
              className="p-2.5 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 hover:from-[#84cc16] hover:to-emerald-300 text-black disabled:opacity-30 transition flex items-center justify-center font-extrabold shadow-md shadow-[#76B900]/30"
              title="Send message"
            >
              <Send className="w-4 h-4 text-black stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
