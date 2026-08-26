import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import PlayerSetup from './PlayerSetup';
import OnlineSetup from './OnlineSetup';
import RelationshipSelector from './RelationshipSelector';
import CategorySelector from './CategorySelector';
import ItemSelector from './ItemSelector';
import IntimacySelector from './IntimacySelector';
import GameSettings from './GameSettings';
import GameSummary from './GameSummary';

import girl1 from '../../assets/girl1.jpg';
import boy1 from '../../assets/boy1.jpg';

export default function LobbyFlow({
  userProfile,
  socket,
  onlinePlayers,
  myPartners,
  onLaunchGame,
  selectedGame,
  onBack
}) {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState('local');
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, or 3
  const [onlineAction, setOnlineAction] = useState(null);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const [players, setPlayers] = useState(() => {
    const hostAvatar = userProfile?.avatar || '';
    let partnerAvatar = '';
    
    // Auto-select opposite gender default avatar
    if (hostAvatar) {
      if (hostAvatar.includes('boy') || hostAvatar === boy1) {
        partnerAvatar = girl1;
      } else {
        partnerAvatar = boy1;
      }
    }
    
    return [
      { name: userProfile?.name || 'Player 1', avatar: hostAvatar, relationship: null },
      { name: 'Player 2', avatar: partnerAvatar, relationship: 'crush' }
    ];
  });
  const [joinCode, setJoinCode] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState('couple');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedIntimacyCategories, setSelectedIntimacyCategories] = useState(['sparks', 'flames', 'wildfire']);
  const [settings, setSettings] = useState({
    timerDuration: 0,
    skipAllowed: true,
    turnOrder: 'alternate'
  });

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => {
    if (currentStep === 1) {
      if (gameMode === 'online' && onlineAction === 'create') {
        setOnlineAction(null);
      } else {
        if (onBack) onBack(); // Go back to Game Selection without popping history
        else navigate(-1); 
      }
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };
  
  const toggleItem = (id) => {
    setSelectedItems(prev => {
      if (id === 'none') {
        return prev.includes('none') ? [] : ['none'];
      } else {
        const withoutNone = prev.filter(i => i !== 'none');
        return withoutNone.includes(id)
          ? withoutNone.filter(i => i !== id)
          : [...withoutNone, id];
      }
    });
  };

  const toggleCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleIntimacyCategory = (id) => {
    setSelectedIntimacyCategories(prev => {
      // Prevent unselecting the last category
      if (prev.length === 1 && prev.includes(id)) return prev;
      return prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
    });
  };

  // Removed handleCreateRoom as creation now happens in Home.jsx via onLaunchGame

  const handleJoinRoom = () => {
    if (joinCode.trim().length === 4) {
      socket.emit(selectedGame === 'dice' ? 'joinDiceRoom' : 'joinRoomCode', {
        code: joinCode,
        dbId: userProfile.id
      });
    }
  };

  const handleInvite = (targetId) => {
    socket.emit(selectedGame === 'dice' ? 'sendDiceInvite' : 'sendInvite', {
      targetId,
      category: 'flames'
    });
  };

  const handleStartGame = () => {
    const finalSettings = {
      ...settings,
      relationship: selectedRelationship,
      startingIntimacy: selectedIntimacyCategories,
      numberOfRounds: 20 // Default rounds
    };
    
    const finalPlayers = [...players];
    if (finalPlayers[1]) {
      finalPlayers[1] = { ...finalPlayers[1], relationship: selectedRelationship };
    }
    
    onLaunchGame(gameMode, finalPlayers, selectedCategories, selectedItems, finalSettings);
  };

  const steps = gameMode === 'online'
    ? selectedGame === 'dice'
      ? [
          { num: 1, label: 'Game Setup' }
        ]
      : [
          { num: 1, label: 'Players' },
          { num: 2, label: 'Game Setup' }
        ]
    : selectedGame === 'dice' 
      ? [
          { num: 1, label: 'Game Setup' },
          { num: 2, label: 'Your Game' }
        ]
      : [
          { num: 1, label: 'Players' },
          { num: 2, label: 'Mood & Items' },
          { num: 3, label: 'Your Game' }
        ];

  return (
    <div className="w-full max-w-lg mx-auto pb-8 min-h-[80vh] flex flex-col">

      {/* ══════════════ HEADER ══════════════ */}
      <div className="mb-6 flex flex-col items-center">
        {/* Toggle */}
        <div className="flex bg-[#1a0c14]/80 border border-[#54152A]/60 rounded-full p-1 backdrop-blur-md mb-5">
          <button
            onClick={() => setGameMode('local')}
            className={`px-7 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
              gameMode === 'local'
                ? 'bg-[#E6C88A] text-black shadow-[0_0_15px_rgba(230,200,138,0.4)]'
                : 'text-[#E6C88A]/50 hover:text-[#E6C88A]/80'
            }`}
          >
            Offline
          </button>
          <button
            onClick={() => setGameMode('online')}
            className={`px-7 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
              gameMode === 'online'
                ? 'bg-[#E6C88A] text-black shadow-[0_0_15px_rgba(230,200,138,0.4)]'
                : 'text-[#E6C88A]/50 hover:text-[#E6C88A]/80'
            }`}
          >
            Online
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest w-full">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center transition-colors duration-300 ${currentStep === s.num ? 'text-[#E6C88A]' : 'text-white/30'}`}>
                <span className="mr-1">{`0${s.num}`}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══════════════ MULTI-SCREEN WIZARD ══════════════ */}
      <div className="flex-1 w-full relative px-2 sm:px-0">
        <AnimatePresence mode="wait">
          
          {/* ────── STEP 1 ────── */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif text-white tracking-wide">Who's Playing?</h2>
                <p className="text-white/40 text-[10px] mt-1.5 leading-relaxed uppercase tracking-widest">Add your players and tell us who you're playing with.</p>
              </div>
              
              <div>
                {gameMode === 'local' ? (
                  <PlayerSetup players={players} setPlayers={setPlayers} />
                ) : !onlineAction ? (
                  <OnlineSetup
                    onHostClick={() => setOnlineAction('create')}
                    onJoinRoom={handleJoinRoom}
                    joinCode={joinCode}
                    setJoinCode={setJoinCode}
                    visiblePartners={onlinePlayers.filter(p => myPartners.includes(p.dbId))}
                    onInvite={handleInvite}
                  />
                ) : null}
              </div>
              
              {(gameMode === 'local' || onlineAction === 'create') && selectedGame !== 'dice' && (
                <div>
                  <div className="mb-3">
                    <h3 className="text-sm font-serif text-white tracking-wide">Who are you playing with?</h3>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 leading-relaxed">Choose your connection.</p>
                  </div>
                  <RelationshipSelector
                    selected={selectedRelationship}
                    onSelect={setSelectedRelationship}
                  />
                </div>
              )}
              
              {selectedGame === 'dice' && (gameMode === 'local' || onlineAction === 'create') && (
                <div className="mt-8 pt-6 border-t border-[#54152A]/30">
                  <div className="mb-3">
                    <h3 className="text-sm font-serif text-white tracking-wide">Set Up Your Game</h3>
                  </div>
                  <GameSettings
                    settings={settings}
                    onUpdateSettings={setSettings}
                  />
                </div>
              )}
              
              {/* Bottom Nav */}
              <div className="flex items-center gap-3 pt-6">
                <button 
                  onClick={prevStep}
                  className="bg-[#1a0c14]/80 border border-[#54152A]/60 text-white/60 hover:text-white hover:bg-[#54152A]/40 px-4 py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span className="text-[10px]">Back</span>
                </button>
                {(gameMode === 'local' || onlineAction === 'create') && (
                  <button 
                    onClick={() => {
                      if (selectedGame === 'dice' && gameMode === 'online') {
                        handleStartGame();
                      } else {
                        nextStep();
                      }
                    }}
                    className="flex-1 relative overflow-hidden bg-gradient-to-r from-[#54152A] to-[#7A1F3D] border border-[#E6C88A]/50 text-[#E6C88A] hover:shadow-[0_0_20px_rgba(230,200,138,0.2)] hover:border-[#E6C88A] py-4 rounded-xl font-bold uppercase tracking-widest transition-all text-sm group shadow-lg"
                  >
                    <div className="absolute inset-0 bg-[#E6C88A] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out z-0"></div>
                    <span className="relative z-10 flex items-center justify-center group-hover:text-black transition-colors duration-300">
                      {selectedGame === 'dice' && gameMode === 'online' ? 'Create Room' : 'Continue \u2192'}
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ────── STEP 2 (NON-DICE) ────── */}
          {currentStep === 2 && selectedGame !== 'dice' && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif text-white tracking-wide">Set The Mood</h2>
                <p className="text-white/40 text-[10px] mt-1.5 leading-relaxed uppercase tracking-widest">Choose your mood, available items, and how you want to play.</p>
              </div>

              {selectedGame !== 'dice' && (
                <>
                  <div>
                    <div className="mb-3">
                      <h3 className="text-sm font-serif text-white tracking-wide">Choose Your Mood</h3>
                    </div>
                    <CategorySelector
                      selectedCategories={selectedCategories}
                      toggleCategory={toggleCategory}
                    />
                  </div>

                  <div>
                    <div className="mb-3">
                      <h3 className="text-sm font-serif text-white tracking-wide">Select Intimacy Levels</h3>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 leading-relaxed">Which levels do you want to include?</p>
                    </div>
                    <IntimacySelector
                      selectedCategories={selectedIntimacyCategories}
                      toggleCategory={toggleIntimacyCategory}
                    />
                  </div>

                  <div>
                    <div className="mb-3">
                      <h3 className="text-sm font-serif text-white tracking-wide">What do you have available?</h3>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1 leading-relaxed">Select the items you have available for this game.</p>
                    </div>
                    <ItemSelector
                      selectedItems={selectedItems}
                      toggleItem={toggleItem}
                    />
                  </div>
                </>
              )}

              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-serif text-white tracking-wide">Set Up Your Game</h3>
                </div>
                <GameSettings
                  settings={settings}
                  onUpdateSettings={setSettings}
                />
              </div>

              {/* Bottom Nav */}
              <div className="flex items-center gap-3 pt-2">
                <button 
                  onClick={prevStep}
                  className="bg-[#1a0c14]/80 border border-[#54152A]/60 text-white/60 hover:text-white hover:bg-[#54152A]/40 px-4 py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span className="text-[10px]">Back</span>
                </button>
                <button 
                  onClick={gameMode === 'online' ? handleStartGame : nextStep}
                  className="flex-1 relative overflow-hidden bg-gradient-to-r from-[#54152A] to-[#7A1F3D] border border-[#E6C88A]/50 text-[#E6C88A] hover:shadow-[0_0_20px_rgba(230,200,138,0.2)] hover:border-[#E6C88A] py-4 rounded-xl font-bold uppercase tracking-widest transition-all text-sm group shadow-lg"
                >
                  <div className="absolute inset-0 bg-[#E6C88A] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out z-0"></div>
                  <span className="relative z-10 flex items-center justify-center group-hover:text-black transition-colors duration-300">
                    {gameMode === 'online' ? 'Create Room' : 'Continue \u2192'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ────── FINAL STEP (SUMMARY) ────── */}
          {(currentStep === 3 || (currentStep === 2 && selectedGame === 'dice')) && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <GameSummary
                gameMode={gameMode}
                selectedGame={selectedGame}
                players={players}
                relationship={selectedRelationship}
                categories={selectedCategories}
                items={selectedItems}
                settings={{ ...settings, numberOfRounds: 20 }}
                onStart={handleStartGame}
                onEditStep={setCurrentStep}
                onBack={prevStep}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
