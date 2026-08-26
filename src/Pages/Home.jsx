import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import {
  Users, Play, LogOut, Camera, Upload, X, Heart,
  Flame, Dices, Gamepad2, Smartphone, Globe, ArrowLeft, PlusCircle, LogIn, Sparkles, Zap, Lock
} from 'lucide-react';

import girl1 from './../assets/girl1.jpg';
import girl2 from './../assets/girl2.jpg';
import girl3 from './../assets/girl3.png';
import boy1 from './../assets/boy1.jpg';
import boy2 from './../assets/boy2.jpg';
import boy3 from './../assets/boy3.png';
import lipsImg from './../assets/lips.jpg';
import LobbyFlow from '../components/lobby/LobbyFlow';
import OnlineLobby from '../components/lobby/OnlineLobby';

const CUTE_AVATARS = [
  girl1, girl2, girl3, boy1, boy2, boy3
];

const FloatingHearts = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i} className="absolute text-[#54152A]/20"
          initial={{ y: '100vh', x: `${Math.random() * 100}vw`, scale: Math.random() * 0.5 + 0.5 }}
          animate={{ y: '-10vh', rotate: 360 }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: 'linear', delay: Math.random() * 5 }}
        >
          <Heart className="w-8 h-8 fill-current" />
        </motion.div>
      ))}
    </div>
  );
};

export default function Home({ socket }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // Clear lobby wizard if user navigates back to Home via browser Back button
  useEffect(() => {
    setSelectedGame(null);
  }, [location.key]);

  // App State
  const [userProfile, setUserProfile] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [invite, setInvite] = useState(null);
  const [diceInvite, setDiceInvite] = useState(null);

  // Online State
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [myPartners, setMyPartners] = useState([]);
  const [lobbyData, setLobbyData] = useState(null); // { isHost, roomCode, hostInfo, opponentInfo, relationship, moods, items }
  const [joinCode, setJoinCode] = useState('');

  // Navigation State
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [heatLevel, setHeatLevel] = useState('sparks');

  // Secret Stash State
  const [secretStashData, setSecretStashData] = useState(null);
  const [secretsLocked, setSecretsLocked] = useState(false);
  const [secretTruth, setSecretTruth] = useState('');
  const [secretDare, setSecretDare] = useState('');

  useEffect(() => {
    if (lobbyData || secretStashData) {
      window.scrollTo(0, 0);
    }
  }, [lobbyData, secretStashData]);

  useEffect(() => {
    const savedUser = localStorage.getItem('ignite_user');
    const token = localStorage.getItem('ignite_token');

    const checkSession = async () => {
      try {
        const session = await fetchAuthSession();
        if (session.tokens) {
          let attrs = {};
          try {
            attrs = await fetchUserAttributes();
          } catch (attrErr) {
            console.warn("Could not fetch user attributes:", attrErr);
            // Fallback if GetUser fails (common with some Google SSO setups)
            // The JWT token itself contains the email!
            const idTokenPayload = session.tokens.idToken?.payload || {};
            attrs = {
              email: idTokenPayload.email || 'google_user@example.com',
              name: idTokenPayload.name || 'Google User',
              picture: idTokenPayload.picture || CUTE_AVATARS[0]
            };
          }

          let existingHistory = [];
          if (savedUser) {
            try { existingHistory = JSON.parse(savedUser).usedQuestionIds || []; } catch(e){}
          }

          const userData = {
            name: attrs.name || 'User',
            id: attrs.email,
            relationship: attrs['custom:relationship'] || 'flirty',
            gender: attrs['custom:sex'] || 'F',
            avatar: attrs.picture || CUTE_AVATARS[0],
            usedQuestionIds: existingHistory
          };
          localStorage.setItem('ignite_user', JSON.stringify(userData));
          localStorage.setItem('ignite_token', session.tokens.accessToken.toString());
          setUserProfile(userData);
          socket.emit('register', userData);
        }
      } catch (err) {
        // No session exists
        if (!savedUser || !token) {
          // If no valid auth is found, force them to login
          // BUT don't interrupt AWS Amplify if it's currently processing a Google SSO callback!
          if (!window.location.search.includes('code=') && !window.location.search.includes('error=')) {
            navigate('/login', { replace: true });
          }
        }
      }
    };

    if (!savedUser || !token || window.location.search.includes('code=')) {
      checkSession();
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUserProfile(parsedUser);

    // Default heat level is always 'sparks'

    // 1. Initial register
    socket.emit('register', parsedUser);
    
    // Auto-join via invite link
    const urlParams = new URLSearchParams(window.location.search);
    const joinCodeFromUrl = urlParams.get('join');
    if (joinCodeFromUrl && joinCodeFromUrl.length === 4) {
      socket.emit('joinRoomCode', { code: joinCodeFromUrl.toUpperCase(), dbId: parsedUser.id });
      // Remove query param without reloading to keep URL clean
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Auto-Reconnect
    const handleReconnect = () => socket.emit('register', parsedUser);
    socket.on('connect', handleReconnect);

    // 3. Game Listeners
    socket.on('partnerListLoaded', (partners) => setMyPartners(partners));
    socket.on('historySynced', (cloudHistory) => {
      try {
        const u = JSON.parse(localStorage.getItem('ignite_user'));
        if (u) {
          u.usedQuestionIds = cloudHistory;
          localStorage.setItem('ignite_user', JSON.stringify(u));
          setUserProfile(u);
        }
      } catch (e) {}
    });
    socket.on('usersUpdated', (users) => setOnlinePlayers(users.filter(u => u.id !== socket.id)));
    socket.on('inviteReceived', (data) => setInvite(data));

    // 4. Room Listeners
    socket.on('roomCreated', (code) => {
      setLobbyData({
        isHost: true,
        roomCode: code,
        hostInfo: parsedUser,
        opponentInfo: null,
        relationship: 'flirty', // Temporary, will be populated on creation but since host creates, they know. Actually, better if server returns the config! But wait, we can just fetch it from local state. Let's just set it for now.
      });
    });
    
    socket.on('playerJoinedRoom', (joinerInfo) => {
      setLobbyData(prev => prev ? { ...prev, opponentInfo: joinerInfo } : null);
    });
    
    socket.on('joinedLobby', (data) => {
      setLobbyData({
        isHost: false,
        roomCode: data.roomCode,
        hostInfo: data.hostInfo,
        opponentInfo: parsedUser,
        relationship: data.relationship,
        moods: data.moods,
        items: data.items
      });
    });
    
    socket.on('roomError', (msg) => alert(msg));
    socket.on('gameStart', (data) => {
      setLobbyData(null);
      setSecretStashData(null);
      setSecretsLocked(false);
      navigate('/game', { replace: true, state: { roomCode: data.roomCode, turn: data.turn, players: data.players, category: data.category } });
    });

    // Secret Stash listeners
    socket.on('showSecretStash', (data) => {
      setLobbyData(null);
      setSecretStashData(data);
      setSecretsLocked(false);
      setSecretTruth('');
      setSecretDare('');
    });
    socket.on('secretsLocked', () => setSecretsLocked(true));

    // Spicy Dice listeners
    socket.on('diceInviteReceived', (data) => setDiceInvite(data));
    socket.on('diceGameStart', (data) => {
      setLobbyData(null);
      navigate('/spicy-dice', { replace: true, state: { roomCode: data.roomCode, turn: data.turn, players: data.players, board: data.board } });
    });

    return () => {
      socket.off('connect', handleReconnect);
      socket.off('partnerListLoaded');
      socket.off('usersUpdated');
      socket.off('inviteReceived');
      socket.off('roomCreated');
      socket.off('roomError');
      socket.off('gameStart');
      socket.off('showSecretStash');
      socket.off('secretsLocked');
      socket.off('diceInviteReceived');
      socket.off('diceGameStart');
      socket.off('playerJoinedRoom');
      socket.off('joinedLobby');
    };
  }, [socket, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    // navigate('/');
    window.location.reload();
  };

  const saveNewAvatar = async (newAvatarUrl) => {
    const updatedProfile = { ...userProfile, avatar: newAvatarUrl };
    setUserProfile(updatedProfile);
    localStorage.setItem('ignite_user', JSON.stringify(updatedProfile));
    await fetch('https://6obwt5tc17.execute-api.ap-south-1.amazonaws.com/Prod/api/auth/update-avatar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userProfile.email, avatar: newAvatarUrl })
    });
    setShowAvatarModal(false);
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => saveNewAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRoom = () => {
    if (selectedGame === 'dice') {
      socket.emit('createDiceRoom', { dbId: userProfile.id, category: heatLevel });
    } else {
      socket.emit('createRoom', { dbId: userProfile.id, category: heatLevel });
    }
  };

  const handleJoinRoom = () => {
    if (joinCode.trim().length === 4) {
      if (selectedGame === 'dice') {
        socket.emit('joinDiceRoom', { code: joinCode, dbId: userProfile.id });
      } else {
        socket.emit('joinRoomCode', { code: joinCode, dbId: userProfile.id });
      }
    }
  };

  const HeatSelector = () => (
    <div className="mb-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-center block text-gray-400 mb-2">Select Heat Level</span>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={() => setHeatLevel('sparks')} className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${heatLevel === 'sparks' ? 'bg-pink-950/80 border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]' : 'bg-black/40 border-neutral-800 opacity-50 hover:opacity-100'}`}>
          <Sparkles className={`w-5 h-5 mb-1 ${heatLevel === 'sparks' ? 'text-pink-400' : 'text-gray-500'}`} />
          <span className={`text-[9px] font-black uppercase ${heatLevel === 'sparks' ? 'text-pink-400' : 'text-gray-500'}`}>Sparks</span>
        </button>
        <button type="button" onClick={() => setHeatLevel('flames')} className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${heatLevel === 'flames' ? 'bg-red-950/80 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-black/40 border-neutral-800 opacity-50 hover:opacity-100'}`}>
          <Flame className={`w-5 h-5 mb-1 ${heatLevel === 'flames' ? 'text-red-500' : 'text-gray-500'}`} />
          <span className={`text-[9px] font-black uppercase ${heatLevel === 'flames' ? 'text-red-500' : 'text-gray-500'}`}>Flames</span>
        </button>
        <button type="button" onClick={() => setHeatLevel('wildfire')} className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${heatLevel === 'wildfire' ? 'bg-orange-950/80 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-black/40 border-neutral-800 opacity-50 hover:opacity-100'}`}>
          <Zap className={`w-5 h-5 mb-1 ${heatLevel === 'wildfire' ? 'text-orange-500' : 'text-gray-500'}`} />
          <span className={`text-[9px] font-black uppercase ${heatLevel === 'wildfire' ? 'text-orange-500' : 'text-gray-500'}`}>Wildfire</span>
        </button>
      </div>
    </div>
  );

  // --- FILTER OUT STRANGERS ---
  // Only show users who are in our myPartners list!
  const visiblePartners = onlinePlayers.filter(p => myPartners.includes(p.dbId));

  if (!userProfile) return null;

  return (
    <div className="w-full max-w-md min-h-screen flex flex-col pt-10 px-4 relative z-10">
      <FloatingHearts />

      {/* --- ONLINE LOBBY MODAL --- */}
      {lobbyData && (
        <OnlineLobby
          roomCode={lobbyData.roomCode}
          isHost={lobbyData.isHost}
          hostInfo={lobbyData.hostInfo}
          opponentInfo={lobbyData.opponentInfo}
          relationship={lobbyData.relationship}
          moods={lobbyData.moods}
          items={lobbyData.items}
          onStartGame={() => socket.emit('startGameFromLobby', lobbyData.roomCode)}
          onCancel={() => setLobbyData(null)}
        />
      )}

      {/* --- AVATAR MODAL --- */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-red-950/90 border border-red-500 rounded-[2rem] p-6 w-full max-w-sm shadow-[0_0_50px_rgba(220,38,38,0.4)] relative text-center">
            <button onClick={() => setShowAvatarModal(false)} className="absolute top-4 right-4 text-red-400 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-xl font-serif text-white font-bold mb-4 tracking-widest uppercase">Update Avatar</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {CUTE_AVATARS.map((av, idx) => (
                <img key={idx} src={av} onClick={() => saveNewAvatar(av)} className="w-16 h-16 rounded-full mx-auto cursor-pointer border-2 border-transparent hover:border-red-500 hover:scale-110 transition-all shadow-lg bg-white/10 object-cover" alt="Avatar" />
              ))}
            </div>
            <label className="cursor-pointer flex items-center justify-center space-x-2 w-full bg-red-600 hover:bg-red-500 text-white py-3 mt-4 rounded-xl font-bold uppercase tracking-widest transition-all">
              <Upload className="w-5 h-5" /><span>Upload Custom Photo</span>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleGalleryUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* --- INCOMING INVITE MODAL --- */}
      {invite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-red-950/90 p-8 rounded-3xl border border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.6)] animate-bounce text-center w-full max-w-sm">
            <Flame className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
            <p className="text-2xl font-serif font-bold text-white mb-2">{invite.senderName} invited you!</p>
            <p className="text-xs text-red-300 mb-6 uppercase tracking-widest font-bold">Heat Level: {invite.category}</p>
            <div className="flex space-x-3">
              <button onClick={() => { socket.emit('acceptInvite', { inviterId: invite.senderId, category: invite.category }); setInvite(null); }} className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold uppercase tracking-wider">Accept</button>
              <button onClick={() => setInvite(null)} className="flex-1 bg-black/50 text-red-400 border border-red-900 py-3 rounded-lg font-bold uppercase tracking-wider">Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* --- INCOMING DICE INVITE MODAL --- */}
      {diceInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-purple-950/90 p-8 rounded-3xl border border-purple-500 shadow-[0_0_40px_rgba(139,92,246,0.6)] animate-bounce text-center w-full max-w-sm">
            <Dices className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
            <p className="text-2xl font-serif font-bold text-white mb-2">{diceInvite.senderName} invited you!</p>
            <p className="text-xs text-purple-300 mb-6 uppercase tracking-widest font-bold">🎲 Spicy Dice</p>
            <div className="flex space-x-3">
              <button onClick={() => { socket.emit('acceptDiceInvite', { inviterId: diceInvite.senderId, category: diceInvite.category }); setDiceInvite(null); }} className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-bold uppercase tracking-wider">Accept</button>
              <button onClick={() => setDiceInvite(null)} className="flex-1 bg-black/50 text-purple-400 border border-purple-900 py-3 rounded-lg font-bold uppercase tracking-wider">Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* --- SECRET STASH MODAL --- */}
      {secretStashData && (
        <div className="fixed inset-0 z-[100] flex flex-col p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            className="my-auto mx-auto w-full max-w-sm relative overflow-hidden rounded-[2.5rem] border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/40 via-neutral-950/95 to-purple-950/30 p-8 shadow-[0_0_80px_rgba(251,191,36,0.25)] shrink-0"
          >
            {/* Decorative glow blobs */}
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/15 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-purple-600/15 blur-[80px] rounded-full pointer-events-none"></div>

            {!secretsLocked ? (
              <>
                <div className="text-center mb-6 relative z-10">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="inline-block mb-3"
                  >
                    <span className="text-5xl">🤫</span>
                  </motion.div>
                  <h2 className="text-2xl font-serif text-white font-black tracking-widest uppercase mb-1 drop-shadow-[0_0_15px_rgba(251,191,36,0.4)]">Secret Stash</h2>
                  <p className="text-amber-300/70 text-[10px] uppercase tracking-[0.2em] font-bold">Write a custom Truth & Dare for your partner</p>
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400 mb-1.5 flex items-center space-x-1.5">
                      <Heart className="w-3 h-3" />
                      <span>Your Secret Truth</span>
                    </label>
                    <textarea
                      value={secretTruth}
                      onChange={(e) => setSecretTruth(e.target.value)}
                      placeholder="e.g. What's the most romantic thing you've secretly fantasized about?"
                      maxLength={200}
                      rows={2}
                      className="w-full py-3 px-4 bg-black/60 border border-pink-500/30 rounded-xl text-white text-sm placeholder-pink-300/30 focus:border-pink-500 focus:shadow-[0_0_15px_rgba(236,72,153,0.2)] outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-1.5 flex items-center space-x-1.5">
                      <Flame className="w-3 h-3" />
                      <span>Your Secret Dare</span>
                    </label>
                    <textarea
                      value={secretDare}
                      onChange={(e) => setSecretDare(e.target.value)}
                      placeholder="e.g. Give me a 30-second massage on my neck using only your lips"
                      maxLength={200}
                      rows={2}
                      className="w-full py-3 px-4 bg-black/60 border border-red-500/30 rounded-xl text-white text-sm placeholder-red-300/30 focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (secretTruth.trim() && secretDare.trim()) {
                        socket.emit('submitSecretCards', {
                          roomCode: secretStashData.roomCode,
                          truthText: secretTruth.trim(),
                          dareText: secretDare.trim()
                        });
                      }
                    }}
                    disabled={!secretTruth.trim() || !secretDare.trim()}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-2 transition-all ${
                      secretTruth.trim() && secretDare.trim()
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:from-amber-500 hover:to-yellow-500 hover:shadow-[0_0_40px_rgba(251,191,36,0.6)]'
                        : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Lock in my Secrets</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 relative z-10">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="mb-6"
                >
                  <Lock className="w-14 h-14 text-amber-400 mx-auto" style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.6))' }} />
                </motion.div>
                <h2 className="text-xl font-serif text-white font-black tracking-widest uppercase mb-3">Secrets Locked 🔒</h2>
                <p className="text-amber-300/60 text-sm font-bold animate-pulse leading-relaxed">
                  Waiting for your partner to lock in their secrets...
                </p>
                <div className="mt-6 flex justify-center space-x-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-amber-500"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* --- TOP HEADER / PROFILE --- */}
      <div className="flex justify-between items-start mb-8 relative z-20 w-full max-w-4xl mx-auto">
        <div className="text-left">
          <h1 className="text-4xl font-serif text-[#E6C88A] font-bold tracking-[0.2em] drop-shadow-[0_0_20px_rgba(230,200,138,0.2)]">IGNITE</h1>
          <p className="text-white/60 text-[10px] mt-1 uppercase tracking-[0.3em] font-light">The Premium Collection</p>
        </div>

        <div className="flex items-center space-x-3 bg-[#241018]/60 backdrop-blur-md pl-4 pr-2 py-2 rounded-full border border-[#54152A]">
          <div className="text-right hidden sm:block">
            <p className="text-white text-sm font-serif leading-tight">{userProfile.name}</p>
            <button onClick={handleLogout} className="text-[#E6C88A]/60 text-[10px] uppercase font-bold hover:text-[#E6C88A] transition-colors">Logout</button>
          </div>
          <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
            <img src={userProfile.avatar || CUTE_AVATARS[0]} alt="Profile" className="w-10 h-10 rounded-full border border-[#E6C88A] object-cover shadow-[0_0_10px_rgba(230,200,138,0.2)] bg-[#10050A]" />
            <div className="absolute inset-0 bg-[#241018]/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-4 h-4 text-[#E6C88A]" /></div>
          </div>
        </div>
      </div>

      {/* --- DYNAMIC CONTENT AREA --- */}
      <div className="w-full flex-1 flex flex-col max-w-4xl mx-auto">
        <AnimatePresence mode="wait">

          {/* CHOOSE GAME (Poison) */}
          {!selectedGame && (
            <motion.div key="games" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="relative z-20 pt-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-[#E6C88A] mb-2 tracking-wider">Select Your Collection</h2>
                <p className="text-white/60 text-xs uppercase tracking-[0.2em] font-light">Set the perfect mood for tonight</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 px-4">
                <button onClick={() => setSelectedGame('cards')} className="bg-[#241018]/80 backdrop-blur-md border border-[#54152A] p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-[#E6C88A]/50 hover:shadow-[0_0_30px_rgba(230,200,138,0.15)] transition-all group duration-500">
                  <div className="w-20 h-20 rounded-full bg-[#54152A]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-2">
                    <Heart className="w-10 h-10 text-[#E6C88A]" />
                  </div>
                  <div>
                    <h3 className="text-white font-serif text-lg tracking-wider mb-2">Naughty Deck</h3>
                    <p className="text-[#E6C88A]/60 text-[10px] uppercase tracking-widest leading-relaxed">Reveal secrets & intimate tasks</p>
                  </div>
                </button>

                <button onClick={() => setSelectedGame('dice')} className="bg-[#241018]/80 backdrop-blur-md border border-[#54152A] p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-[#E6C88A]/50 hover:shadow-[0_0_30px_rgba(230,200,138,0.15)] transition-all group duration-500">
                  <div className="w-20 h-20 rounded-full bg-[#54152A]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-2">
                    <Dices className="w-10 h-10 text-[#E6C88A]" />
                  </div>
                  <div>
                    <h3 className="text-white font-serif text-lg tracking-wider mb-2">Spicy Dice</h3>
                    <p className="text-[#E6C88A]/60 text-[10px] uppercase tracking-widest leading-relaxed">Roll to see who does what</p>
                  </div>
                </button>

                <button onClick={() => setSelectedGame('ludo')} className="bg-[#241018]/80 backdrop-blur-md border border-[#54152A] p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:border-[#E6C88A]/50 hover:shadow-[0_0_30px_rgba(230,200,138,0.15)] transition-all group duration-500">
                  <div className="w-20 h-20 rounded-full bg-[#54152A]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 mb-2">
                    <Gamepad2 className="w-10 h-10 text-[#E6C88A]" />
                  </div>
                  <div>
                    <h3 className="text-white font-serif text-lg tracking-wider mb-2">Naughty Ludo</h3>
                    <p className="text-[#E6C88A]/60 text-[10px] uppercase tracking-widest leading-relaxed">Board game with extreme penalties</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* LOBBY FLOW */}
          {selectedGame && (
            <motion.div key="lobbyFlow" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="h-full w-full">
              <LobbyFlow 
                userProfile={userProfile}
                socket={socket}
                onlinePlayers={onlinePlayers}
                myPartners={myPartners}
                selectedGame={selectedGame}
                onBack={() => setSelectedGame(null)}
                onLaunchGame={async (mode, players, categories, items, finalSettings) => {
                    // Map items to match DynamoDB exactly
                    const formattedItems = items.map(i => i === 'none' ? 'GENERAL' : i.charAt(0).toUpperCase() + i.slice(1));
                    
                    // Fetch progressive stages from API for BOTH modes
                    let progressiveStages = { sparks: [], flames: [], wildfire: [] };
                    
                    try {
                      const apiUrl = 'https://6obwt5tc17.execute-api.ap-south-1.amazonaws.com/Prod/api/deck';
                      
                      const localUserStr = localStorage.getItem('ignite_user');
                      let usedQuestionIds = [];
                      if (localUserStr) {
                        try {
                          const parsedUser = JSON.parse(localUserStr);
                          usedQuestionIds = parsedUser.usedQuestionIds || [];
                        } catch(e) {}
                      }

                      const res = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          relationship: finalSettings.relationship,
                          moods: categories.length > 0 ? categories : [],
                          items: formattedItems,
                          categories: finalSettings.startingIntimacy,
                          usedQuestionIds: usedQuestionIds
                        })
                      });
                      const data = await res.json();
                      if (data.success && data.stages) {
                        progressiveStages = data.stages;
                        console.log(`[LOBBY] Preloaded Progressive Deck from API!`);
                      }
                    } catch (err) {
                      console.error("[LOBBY] Failed to fetch progressive deck:", err);
                    }

                  if (mode === 'local') {
                    const targetRoute = selectedGame === 'dice' ? '/local-spicy-dice' : selectedGame === 'ludo' ? '/local-naughty-ludo' : '/local-game';
                    navigate(targetRoute, {
                      replace: true,
                      state: {
                        moods: categories,
                        items: items,
                        relationship: finalSettings.relationship,
                        timer: finalSettings.timerDuration,
                        turnOrder: finalSettings.turnOrder,
                        allowSkip: finalSettings.skipAllowed,
                        player1: { name: players[0].name, avatar: players[0].avatar, gender: userProfile.gender || userProfile.sex || 'F' },
                        player2: { name: players[1].name, avatar: players[1].avatar, gender: 'M' },
                        startingIntimacy: finalSettings.startingIntimacy.includes('sparks') ? 'sparks' 
                                        : finalSettings.startingIntimacy.includes('flames') ? 'flames' 
                                        : 'wildfire',
                        preloadedQuestions: progressiveStages // Passed securely locally!
                      }
                    });
                  } else {
                     // They clicked "Create Room" at the end of the online wizard!
                     setLobbyData({
                       isHost: true,
                       roomCode: '...', // Will update on response
                       hostInfo: userProfile,
                       opponentInfo: null,
                       relationship: finalSettings.relationship,
                       moods: categories,
                       items: formattedItems
                     });

                     socket.emit(selectedGame === 'dice' ? 'createDiceRoom' : 'createRoom', {
                       dbId: userProfile.id,
                       category: finalSettings.startingIntimacy.includes('sparks') ? 'sparks' 
                               : finalSettings.startingIntimacy.includes('flames') ? 'flames' 
                               : 'wildfire',
                       relationship: finalSettings.relationship,
                       moods: categories,
                       items: formattedItems,
                       progressiveDeck: progressiveStages
                     });
                  }
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}