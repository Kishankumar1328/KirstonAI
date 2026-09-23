import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RotateCcw } from 'lucide-react';

interface ScoreItem {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [playerName, setPlayerName] = useState('Player1');
  const [currentScore, setCurrentScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const loadScores = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/scores');
      if (res.ok) {
        const data = await res.json();
        setScores(data.items || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadScores();
  }, []);

  const saveScore = async (finalScore: number) => {
    try {
      await fetch('http://localhost:8000/api/v1/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: playerName || 'Anonymous', score: finalScore }),
      });
      loadScores();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 1;
    let dy = 0;
    let score = 0;
    let gameLoop: number;
    let speed = 100;

    setCurrentScore(0);
    setGameOver(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -1; e.preventDefault(); }
      if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 1; e.preventDefault(); }
      if (e.key === 'ArrowLeft' && dx === 0) { dx = -1; dy = 0; e.preventDefault(); }
      if (e.key === 'ArrowRight' && dx === 0) { dx = 1; dy = 0; e.preventDefault(); }
    };
    window.addEventListener('keydown', handleKeyDown);

    const draw = () => {
      ctx.fillStyle = '#0B0D0E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const head = {x: snake[0].x + dx, y: snake[0].y + dy};

      if (head.x < 0 || head.x >= 30 || head.y < 0 || head.y >= 30 || snake.some(s => s.x === head.x && s.y === head.y)) {
        setIsPlaying(false);
        setGameOver(true);
        saveScore(score);
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        setCurrentScore(score);
        food = {
          x: Math.floor(Math.random() * 30),
          y: Math.floor(Math.random() * 30)
        };
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(food.x * 20, food.y * 20, 18, 18);

      ctx.fillStyle = '#76B900';
      snake.forEach(segment => {
        ctx.fillRect(segment.x * 20, segment.y * 20, 18, 18);
      });

      gameLoop = window.setTimeout(draw, speed);
    };

    draw();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gameLoop);
    };
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-[#0B0D0E] text-white p-6 font-sans flex justify-center">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#15191C] border border-[#242A2E] rounded-2xl p-6 flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-4 text-[#76B900]">Classic Snake</h1>
          <div className="relative">
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={600} 
              className="bg-black rounded-xl border-2 border-[#242A2E] shadow-2xl"
            />
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl">
                {gameOver && <p className="text-red-500 font-bold text-2xl mb-2">GAME OVER</p>}
                <p className="text-white mb-6 font-mono text-xl">Score: {currentScore}</p>
                <div className="flex flex-col gap-3 items-center">
                  <input 
                    type="text" 
                    value={playerName} 
                    onChange={e => setPlayerName(e.target.value)} 
                    className="p-2 rounded-xl bg-[#0B0D0E] border border-[#242A2E] text-center outline-none focus:border-[#76B900]"
                    placeholder="Enter Player Name"
                  />
                  <button 
                    onClick={() => setIsPlaying(true)} 
                    className="flex items-center gap-2 bg-[#76B900] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#85d000] transition-colors"
                  >
                    {gameOver ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {gameOver ? 'Play Again' : 'Start Game'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-4 text-gray-500 text-sm">Use Arrow Keys to move</p>
        </div>

        <div className="bg-[#15191C] border border-[#242A2E] rounded-2xl p-6">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-[#76B900]">
            <Trophy className="w-5 h-5" /> Leaderboard
          </h2>
          <div className="space-y-3">
            {scores.map((s, idx) => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-[#0B0D0E] rounded-xl border border-[#242A2E]">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-mono">#{idx + 1}</span>
                  <span className="font-bold text-sm">{s.player_name}</span>
                </div>
                <span className="text-[#76B900] font-mono font-bold">{s.score}</span>
              </div>
            ))}
            {scores.length === 0 && <p className="text-gray-500 text-sm text-center py-10">No scores yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
