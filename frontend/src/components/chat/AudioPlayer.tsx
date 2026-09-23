import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Download, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { useTTSStore } from '../../store/ttsStore';

interface AudioPlayerProps {
  src: string;
  messageId?: string;
  title?: string;
  onStop?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  messageId,
  title = "KirstonAI Speech Synthesis",
  onStop
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { playingMessageId, setPlayingMessageId } = useTTSStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  const isCurrentGlobalPlaying = messageId ? playingMessageId === messageId : isPlaying;

  // Sync global playing state
  useEffect(() => {
    if (messageId && playingMessageId !== messageId && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [playingMessageId, messageId, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsLoading(true);
    setError(null);

    const onLoadedMetadata = () => {
      setIsLoading(false);
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onCanPlay = () => {
      setIsLoading(false);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (messageId && playingMessageId === messageId) {
        setPlayingMessageId(null);
      }
      setCurrentTime(0);
    };

    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setError('Audio playback error occurred.');
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if (messageId && playingMessageId === messageId) {
        setPlayingMessageId(null);
      }
    } else {
      try {
        if (messageId) {
          setPlayingMessageId(messageId);
        }
        audio.playbackRate = speed;
        await audio.play();
        setIsPlaying(true);
      } catch (err: any) {
        console.error('Audio play failed:', err);
        setError('Playback rejected by browser policy or audio format.');
        setIsPlaying(false);
      }
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    if (messageId && playingMessageId === messageId) {
      setPlayingMessageId(null);
    }
    if (onStop) onStop();
  };

  const handleReplay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      audio.playbackRate = speed;
      if (messageId) {
        setPlayingMessageId(messageId);
      }
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      console.error('Replay error:', e);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
  const resolvedSrc = src.startsWith('/api/') ? `${BASE_URL}${src}` : src;

  return (
    <div className="my-3 max-w-xl w-full p-3.5 rounded-2xl bg-[#15191C] border border-[#76B900]/50 shadow-glow-nvidia font-sans space-y-2.5 text-xs text-white">
      {/* HTML5 Audio Element */}
      <audio ref={audioRef} src={resolvedSrc} preload="auto" />

      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#76B900]/20 border border-[#76B900]/40 flex items-center justify-center text-[#76B900]">
            <Volume2 className="w-3.5 h-3.5 text-[#76B900]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white truncate max-w-[220px]">
              {title}
            </h4>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#0B0D0E] border border-[#242A2E] px-1.5 py-0.5 rounded-lg text-[10px] font-mono">
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <button
              key={rate}
              onClick={() => handleSpeedChange(rate)}
              className={`px-1 rounded transition ${
                speed === rate
                  ? 'bg-[#76B900] text-black font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Seek Progress Bar */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-[#242A2E] accent-[#76B900] rounded-lg cursor-pointer transition"
        />
        <div className="flex justify-between text-[10px] font-mono text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] text-red-400 font-mono">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between pt-1 border-t border-[#242A2E]/60">
        <div className="flex items-center gap-2">
          {/* Play / Pause Button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#76B900] to-emerald-400 hover:from-[#84cc16] hover:to-emerald-300 text-black flex items-center justify-center font-bold shadow transition active:scale-95 disabled:opacity-50"
            title={isLoading ? 'Loading Audio...' : isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-black fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 text-black fill-current ml-0.5" />
            )}
          </button>

          {/* Stop Button */}
          <button
            onClick={handleStop}
            className="p-1.5 rounded-lg bg-[#0B0D0E] border border-[#242A2E] text-gray-400 hover:text-white transition"
            title="Stop playback"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Replay Button */}
          <button
            onClick={handleReplay}
            className="p-1.5 rounded-lg bg-[#0B0D0E] border border-[#242A2E] text-gray-400 hover:text-white transition"
            title="Replay from beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Download Button */}
        <a
          href={resolvedSrc}
          download="kirston_speech.mp3"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B0D0E] border border-[#242A2E] text-[10px] font-mono text-gray-300 hover:text-[#76B900] transition"
          title="Download audio file"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </a>
      </div>
    </div>
  );
};
