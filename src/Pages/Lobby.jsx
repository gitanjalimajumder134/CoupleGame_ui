import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Copy, Check } from 'lucide-react';

export default function Lobby({ socket }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state?.action === 'create') socket.emit('createRoom');
    socket.on('roomCreated', (code) => setRoomCode(code));
    socket.on('gameStart', (data) => navigate('/game', { state: { roomCode: data.roomCode, turn: data.turn } }));
    return () => { socket.off('roomCreated'); socket.off('gameStart'); };
  }, [socket, state, navigate]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-black/60 p-10 rounded-2xl border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)] text-center max-w-md w-full">
      {state?.action === 'create' ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-red-400">Share this Code</h2>
          <div className="flex items-center justify-center space-x-4 bg-red-950/50 p-4 rounded-xl border border-red-500/50">
            <span className="text-5xl font-bold tracking-widest text-white">{roomCode}</span>
            <button onClick={copyCode} className="p-2 bg-red-600 rounded-lg hover:bg-red-500 transition-all">
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>
          <div className="flex items-center justify-center space-x-2 text-red-300/70 mt-6">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>Waiting for partner to join...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-red-400">Enter Room Code</h2>
          <input 
            type="text" maxLength={4}
            className="w-full text-center text-3xl py-4 bg-black/50 border border-red-500/50 rounded-xl focus:outline-none focus:border-red-400 uppercase tracking-widest text-white"
            value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
          />
          <button 
            onClick={() => socket.emit('joinRoom', joinCode.toUpperCase())}
            className="w-full py-4 bg-red-600 rounded-xl font-bold uppercase tracking-widest hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          >
            Enter Game
          </button>
        </div>
      )}
    </div>
  );
}