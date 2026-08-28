import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { socket } from './socket';

// Make sure these 4 imports are here!
import Auth from './Pages/Auth'; 
import Home from './Pages/Home';
import Lobby from './Pages/Lobby';
import GameBoard from './Pages/GameBoard';
import LocalGame from './Pages/LocalGame';
import SpicyDiceBoard from './Pages/SpicyDiceBoard';
import LocalSpicyDice from './Pages/LocalSpicyDice';

import LocalNaughtyLudo from './Pages/LocalNaughtyLudo';

import './index.css';

export default function App() {
  return (
    <div className="min-h-screen min-h-[100dvh] relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(75, 0, 130, 0.25) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(139, 26, 74, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, #0D0515 0%, #0A0412 100%)
        `
      }}
    >
      {/* Subtle ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, rgba(255,45,123,0.6) 0%, transparent 70%)' }}
        />
      </div>
      
      {/* The App Content */}
      <div className="relative z-10 w-full min-h-screen min-h-[100dvh]">
        <Router>
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/login" element={
              <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4">
                <Auth />
              </div>
            } />
            <Route path="/home" element={<Home socket={socket} />} />
            <Route path="/lobby" element={<Lobby socket={socket} />} />
            <Route path="/game" element={<GameBoard socket={socket} />} />
            <Route path="/local-game" element={<LocalGame socket={socket} />} />
            <Route path="/spicy-dice" element={<SpicyDiceBoard socket={socket} />} />
            <Route path="/local-spicy-dice" element={<LocalSpicyDice socket={socket} />} />
            <Route path="/local-naughty-ludo" element={<LocalNaughtyLudo socket={socket} />} />
          </Routes>
        </Router>
      </div>

    </div>
  );
}