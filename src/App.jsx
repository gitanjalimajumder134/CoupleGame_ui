import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';

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

// Your background image import
import coupleBg from './assets/couple.jpg';

const socket = io('http://localhost:3001');

export default function App() {
  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-4 relative overflow-hidden bg-black">
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${coupleBg})`, filter: 'sepia(30%) hue-rotate(-20deg) contrast(120%)' }}
      />
      
      {/* The Luxury Romance Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#10050A]/95 via-[#241018]/80 to-[#10050A]"></div>
      
      {/* The App Content */}
      <div className="relative z-10 w-full flex justify-center">
        <Router>
          <Routes>
            <Route path="/" element={<Home socket={socket} />} />
            <Route path="/login" element={<Auth />} />
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