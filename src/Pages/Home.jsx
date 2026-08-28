import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import {
  Users, Play, LogOut, Camera, Upload, X, Heart,
  Flame, Dices, Gamepad2, Smartphone, Globe, ArrowLeft,
  PlusCircle, LogIn, Sparkles, Zap, Lock, Gift,
  Home as HomeIcon, Trophy, User, Star, ChevronRight, Plus,
  Crown, Coins, Bell, Settings
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

import { fetchUserBalance, updateUserBalance } from '../utils/api';

// ═══════════════════════════════════════════════════
// COIN SYSTEM
// ═══════════════════════════════════════════════════
const GAME_COSTS = {
  cards: 50,
  dice: 30,
  ludo: 100,
};

const DEFAULT_COINS = 500;

function canClaimDaily() {
  const lastClaim = localStorage.getItem('ignite_daily_claim');
  if (!lastClaim) return true;
  const today = new Date().toDateString();
  return lastClaim !== today;
}

function markDailyClaimed() {
  localStorage.setItem('ignite_daily_claim', new Date().toDateString());
}

// ═══════════════════════════════════════════════════
// SVG COIN ICON
// ═══════════════════════════════════════════════════
const CoinIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className} style={{ filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.4))' }}>
    <defs>
      <linearGradient id="coinGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFE566" />
        <stop offset="30%" stopColor="#FFD700" />
        <stop offset="70%" stopColor="#F5A623" />
        <stop offset="100%" stopColor="#E8941A" />
      </linearGradient>
      <linearGradient id="coinShine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#coinGrad)" stroke="#C8960C" strokeWidth="2" />
    <circle cx="24" cy="24" r="18" fill="none" stroke="#C8960C" strokeWidth="1.5" opacity="0.5" />
    <ellipse cx="24" cy="14" rx="14" ry="8" fill="url(#coinShine)" opacity="0.4" />
    <text x="24" y="30" textAnchor="middle" fill="#8B6914" fontSize="18" fontWeight="900" fontFamily="Outfit, sans-serif">$</text>
  </svg>
);

// ═══════════════════════════════════════════════════
// FLOATING HEARTS BACKGROUND
// ═══════════════════════════════════════════════════
const FloatingHearts = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(8)].map((_, i) => {
      const s = (Math.random() * 0.5 + 0.5).toFixed(2);
      const dur = (Math.random() * 15 + 15).toFixed(1);
      const del = (Math.random() * 10).toFixed(1);
      const left = (Math.random() * 100).toFixed(0);
      return (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${left}%`,
            '--s': s,
            animation: `heartFloat ${dur}s linear ${del}s infinite`,
          }}
        >
          <Heart
            className="fill-current"
            style={{
              width: `${14 + Math.random() * 14}px`,
              height: `${14 + Math.random() * 14}px`,
              color: i % 2 === 0 ? 'rgba(168, 85, 247, 0.08)' : 'rgba(255, 45, 123, 0.06)',
            }}
          />
        </div>
      );
    })}
  </div>
);

// ═══════════════════════════════════════════════════
// CONFETTI + CELEBRATION SYSTEM
// ═══════════════════════════════════════════════════
const CelebrationOverlay = ({ active, onDone }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) { setParticles([]); return; }

    const colors = ['#FFD700', '#FF2D7B', '#C840E9', '#FFB088', '#FF6B8A', '#A855F7', '#FFF8DC'];
    const newParticles = [];

    // Confetti pieces
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 200;
      newParticles.push({
        id: `conf-${i}`,
        type: 'confetti',
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 100,
        r: Math.random() * 720 - 360,
        dur: 0.8 + Math.random() * 0.8,
        delay: Math.random() * 0.3,
        size: 6 + Math.random() * 6,
      });
    }

    // Coin bursts
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
      const burstDist = 60 + Math.random() * 80;
      newParticles.push({
        id: `coin-${i}`,
        type: 'coin',
        bx: Math.cos(angle) * burstDist,
        by: Math.sin(angle) * burstDist,
        fx: Math.cos(angle) * burstDist * 0.5,
        fy: -300 - Math.random() * 100,
        dur: 1.2 + Math.random() * 0.5,
        delay: Math.random() * 0.2,
      });
    }

    setParticles(newParticles);
    const timer = setTimeout(() => { setParticles([]); if (onDone) onDone(); }, 2500);
    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {particles.map(p => {
        if (p.type === 'confetti') {
          return (
            <div
              key={p.id}
              className="confetti-particle"
              style={{
                left: '50%',
                top: '45%',
                backgroundColor: p.color,
                width: `${p.size}px`,
                height: `${p.size * 0.6}px`,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                '--x': `${p.x}px`,
                '--y': `${p.y}px`,
                '--r': `${p.r}deg`,
                '--dur': `${p.dur}s`,
                '--delay': `${p.delay}s`,
              }}
            />
          );
        }
        return (
          <div
            key={p.id}
            className="coin-burst-particle"
            style={{
              left: '50%',
              top: '45%',
              '--bx': `${p.bx}px`,
              '--by': `${p.by}px`,
              '--fx': `${p.fx}px`,
              '--fy': `${p.fy}px`,
              '--dur': `${p.dur}s`,
              '--delay': `${p.delay}s`,
            }}
          >
            🪙
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════
// DAILY REWARD MODAL
// ═══════════════════════════════════════════════════
const DailyRewardModal = ({ show, onClose, onClaim }) => {
  const [collected, setCollected] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleCollect = () => {
    setCollected(true);
    setShowCelebration(true);
    onClaim();
    setTimeout(() => {
      setShowCelebration(false);
      setTimeout(() => onClose(), 800);
    }, 2200);
  };

  // Reset state when modal opens
  useEffect(() => {
    if (show) {
      setCollected(false);
      setShowCelebration(false);
    }
  }, [show]);

  if (!show) return null;

  return (
    <>
      <CelebrationOverlay active={showCelebration} />
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={!collected ? onClose : undefined}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-sm z-10"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(255,215,0,0.3)]"
            style={{
              background: 'linear-gradient(160deg, rgba(45,20,80,0.95) 0%, rgba(13,5,21,0.98) 50%, rgba(74,14,43,0.9) 100%)',
              boxShadow: '0 0 80px rgba(255,215,0,0.15), 0 20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.4), transparent)' }} />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgba(200,64,233,0.4), transparent)' }} />

            {/* Close button */}
            {!collected && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <div className="relative z-10 px-8 py-10 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 mb-6">
                <Star className="w-3 h-3 text-[var(--gold)]" fill="currentColor" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">Daily Reward</span>
              </div>

              {/* Coin visual */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className={`w-full h-full flex items-center justify-center ${collected ? '' : 'animate-float'}`}>
                  <div className="relative">
                    {/* Glow ring */}
                    <div className="absolute inset-[-12px] rounded-full animate-pulse-glow" />
                    <CoinIcon size={96} />
                  </div>
                </div>
                {/* Sparkles around coin */}
                {!collected && [0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="absolute w-3 h-3"
                    style={{
                      top: ['10%', '5%', '75%', '80%'][i],
                      left: ['5%', '85%', '0%', '90%'][i],
                      animation: `sparkle 2s ease-in-out ${i * 0.5}s infinite`,
                    }}
                  >
                    <Sparkles className="w-full h-full text-[var(--gold)]" />
                  </div>
                ))}
              </div>

              {/* Amount */}
              <div className="mb-2">
                <motion.span
                  className="text-6xl font-black text-transparent bg-clip-text"
                  style={{
                    backgroundImage: 'linear-gradient(180deg, #FFE566 0%, #FFD700 40%, #F5A623 100%)',
                  }}
                  animate={collected ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  300
                </motion.span>
              </div>
              <p className="text-[var(--gold-dim)] text-sm font-bold uppercase tracking-[0.3em] mb-8">Coins</p>

              {/* CTA */}
              {!collected ? (
                <button
                  onClick={handleCollect}
                  className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm text-black relative overflow-hidden cta-shimmer transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #FFE566 0%, #FFD700 40%, #F5A623 100%)',
                    boxShadow: '0 0 30px rgba(255,215,0,0.3), 0 4px 15px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5" />
                    Collect 300 Coins
                  </span>
                </button>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-sm text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Collected!
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════
// GAME CARD COMPONENT
// ═══════════════════════════════════════════════════
const GameCard = ({ game, cost, title, description, gradient, icon: Icon, iconColor, glowColor, featured, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-[1.5rem] text-left w-full transition-all duration-300 group ${featured ? '' : ''}`}
      style={{
        background: gradient,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 0 0 ${glowColor}`,
      }}
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.5rem]"
        style={{ boxShadow: `inset 0 0 40px ${glowColor}, 0 0 40px ${glowColor}` }}
      />

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[60%] h-full opacity-[0.06] pointer-events-none">
        <Icon style={{ width: '100%', height: '100%', color: 'white' }} />
      </div>

      <div className={`relative z-10 ${featured ? 'p-7' : 'p-5'}`}>
        {/* Icon badge */}
        <div
          className={`${featured ? 'w-14 h-14 mb-4' : 'w-11 h-11 mb-3'} rounded-2xl flex items-center justify-center`}
          style={{
            background: `linear-gradient(135deg, ${iconColor}22, ${iconColor}44)`,
            border: `1px solid ${iconColor}33`,
            boxShadow: `0 0 20px ${iconColor}20`,
          }}
        >
          <Icon className={`${featured ? 'w-7 h-7' : 'w-5 h-5'}`} style={{ color: iconColor }} />
        </div>

        {/* Title */}
        <h3 className={`font-serif text-white ${featured ? 'text-2xl mb-1.5' : 'text-base mb-1'} tracking-wide`}>
          {title}
        </h3>

        {/* Description */}
        <p className={`text-white/50 ${featured ? 'text-xs mb-5' : 'text-[11px] mb-4'} leading-relaxed`}>
          {description}
        </p>

        {/* Bottom row: cost + play button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 border border-[var(--gold)]/20">
            <CoinIcon size={16} />
            <span className="text-[var(--gold)] text-xs font-bold">{cost}</span>
          </div>

          <div
            className={`${featured ? 'px-6 py-2.5' : 'px-4 py-2'} rounded-xl font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 transition-all group-hover:scale-105 cta-shimmer`}
            style={{
              background: `linear-gradient(135deg, ${iconColor}cc, ${iconColor})`,
              color: featured ? '#000' : '#fff',
              boxShadow: `0 0 15px ${iconColor}33`,
            }}
          >
            <Play className="w-3.5 h-3.5" fill="currentColor" />
            {featured ? 'Play Now' : 'Play'}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════
// INSUFFICIENT COINS TOAST
// ═══════════════════════════════════════════════════
const InsufficientCoinsToast = ({ show, needed }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl glass-panel-heavy border border-red-500/30 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <Coins className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Not enough coins!</p>
          <p className="text-white/50 text-[11px]">You need {needed} coins to play</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ═══════════════════════════════════════════════════
// BOTTOM NAVIGATION
// ═══════════════════════════════════════════════════
const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

// ═══════════════════════════════════════════════════
// ANIMATED COIN COUNTER
// ═══════════════════════════════════════════════════
const AnimatedCoinBalance = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (prev === value) return;

    setIsAnimating(true);
    const diff = value - prev;
    const steps = 20;
    const stepDuration = 50;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(prev + diff * eased));
      if (step >= steps) {
        clearInterval(interval);
        setDisplayValue(value);
        setIsAnimating(false);
      }
    }, stepDuration);

    prevValueRef.current = value;
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span className={`transition-all duration-200 ${isAnimating ? 'text-green-400 scale-110' : 'text-[var(--gold)]'}`}
      style={{ display: 'inline-block', transform: isAnimating ? 'scale(1.1)' : 'scale(1)' }}
    >
      {displayValue.toLocaleString()}
    </span>
  );
};


// ═══════════════════════════════════════════════════
// MAIN HOME COMPONENT
// ═══════════════════════════════════════════════════
export default function Home({ socket }) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const gamesRef = useRef(null);

  // Clear lobby wizard if user navigates back to Home via browser Back button
  useEffect(() => {
    setSelectedGame(null);
  }, [location.key]);

  // ── App State ──
  const [userProfile, setUserProfile] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [invite, setInvite] = useState(null);
  const [diceInvite, setDiceInvite] = useState(null);

  // ── Online State ──
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [myPartners, setMyPartners] = useState([]);
  const [lobbyData, setLobbyData] = useState(null);
  const [joinCode, setJoinCode] = useState('');

  // ── Navigation State ──
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [heatLevel, setHeatLevel] = useState('sparks');

  // ── Secret Stash State ──
  const [secretStashData, setSecretStashData] = useState(null);
  const [secretsLocked, setSecretsLocked] = useState(false);
  const [secretTruth, setSecretTruth] = useState('');
  const [secretDare, setSecretDare] = useState('');

  // ── NEW: Coin & Rewards State ──
  const [coinBalance, setCoinBalance] = useState(DEFAULT_COINS);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(canClaimDaily);
  const [showInsufficientCoins, setShowInsufficientCoins] = useState(false);
  const [insufficientAmount, setInsufficientAmount] = useState(0);
  const [activeNav, setActiveNav] = useState('home');

  // ── Scroll to top on lobby/secret stash ──
  useEffect(() => {
    if (lobbyData || secretStashData) {
      window.scrollTo(0, 0);
    }
  }, [lobbyData, secretStashData]);

  // ═══════════════════════════════════════════════════
  // AUTH + SOCKET LOGIC (PRESERVED FROM ORIGINAL)
  // ═══════════════════════════════════════════════════
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
          
          // Fetch persistent balance from DynamoDB
          const balance = await fetchUserBalance(userData.id);
          setCoinBalance(balance);
          
          socket.emit('register', userData);
        }
      } catch (err) {
        if (!savedUser || !token) {
          // If no valid auth is found, we allow the user to view the home page as a guest.
          // They will be prompted to login when they try to play a game.
        }
      }
    };

    if (!savedUser || !token || window.location.search.includes('code=')) {
      checkSession();
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUserProfile(parsedUser);

    // 1. Initial register
    socket.emit('register', parsedUser);
    
    // Auto-join via invite link
    const urlParams = new URLSearchParams(window.location.search);
    const joinCodeFromUrl = urlParams.get('join');
    if (joinCodeFromUrl && joinCodeFromUrl.length === 4) {
      socket.emit('joinRoomCode', { code: joinCodeFromUrl.toUpperCase(), dbId: parsedUser.id });
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
        relationship: 'flirty',
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

  // ═══════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════

  const requireAuth = (callback) => {
    if (!userProfile) {
      navigate('/login');
      return;
    }
    callback();
  };

  const handleLogout = () => {
    localStorage.clear();
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

  // ── Coin handlers ──
  const spendCoins = async (amount) => {
    if (coinBalance < amount) return false;
    const newBalance = coinBalance - amount;
    setCoinBalance(newBalance);
    // Persist to DynamoDB async
    if (userProfile?.id) {
      updateUserBalance(userProfile.id, -amount).catch(err => console.error(err));
    }
    return true;
  };

  const claimDailyReward = async () => {
    const newBalance = coinBalance + 300;
    setCoinBalance(newBalance);
    markDailyClaimed();
    setDailyRewardAvailable(false);
    // Persist to DynamoDB async
    if (userProfile?.id) {
      updateUserBalance(userProfile.id, 300).catch(err => console.error(err));
    }
  };

  const handleGameCardClick = (gameName) => {
    requireAuth(async () => {
      const cost = GAME_COSTS[gameName];
      const success = await spendCoins(cost);
      if (!success) {
        setInsufficientAmount(cost);
        setShowInsufficientCoins(true);
        setTimeout(() => setShowInsufficientCoins(false), 2500);
        return;
      }
      setSelectedGame(gameName);
    });
  };

  const handleNavTabChange = (tab) => {
    setActiveNav(tab);
    if (tab === 'home') {
      setSelectedGame(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'games') {
      setSelectedGame(null);
      if (gamesRef.current) {
        gamesRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (tab === 'rewards') {
      setShowDailyReward(true);
    } else if (tab === 'profile') {
      requireAuth(() => setShowAvatarModal(true));
    }
  };

  // ── Filter partners ──
  const visiblePartners = onlinePlayers.filter(p => myPartners.includes(p.dbId));

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <div className="w-full min-h-screen min-h-[100dvh] flex flex-col relative pb-20">
      <FloatingHearts />

      {/* ═══════════ MODALS (Preserved) ═══════════ */}

      {/* Online Lobby Modal */}
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

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-[2rem] p-6 text-center"
            style={{
              background: 'linear-gradient(160deg, rgba(45,20,80,0.95), rgba(13,5,21,0.98))',
              border: '1px solid rgba(168,85,247,0.3)',
              boxShadow: '0 0 50px rgba(168,85,247,0.2)',
            }}
          >
            <button onClick={() => setShowAvatarModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>

            {userProfile && (
              <>
                {/* Current avatar */}
                <div className="mb-4">
                  <img src={userProfile.avatar || CUTE_AVATARS[0]} alt="Current" className="w-20 h-20 rounded-full mx-auto border-2 border-[var(--magenta-soft)] object-cover shadow-lg" />
                  <p className="text-white font-serif text-lg mt-3">{userProfile.name}</p>
                  <p className="text-white/40 text-xs">{userProfile.id}</p>
                </div>

                {/* Coin balance in profile */}
                <div className="flex items-center justify-center gap-2 mb-5 px-4 py-2 rounded-full bg-black/30 border border-[var(--gold)]/20 mx-auto w-fit">
                  <CoinIcon size={18} />
                  <span className="text-[var(--gold)] font-bold text-sm">{coinBalance.toLocaleString()} coins</span>
                </div>

                <h2 className="text-base font-serif text-white/80 mb-4 tracking-widest uppercase">Choose Avatar</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {CUTE_AVATARS.map((av, idx) => (
                    <img key={idx} src={av} onClick={() => saveNewAvatar(av)}
                      className="w-16 h-16 rounded-full mx-auto cursor-pointer border-2 border-transparent hover:border-[var(--magenta-soft)] hover:scale-110 transition-all shadow-lg bg-white/10 object-cover"
                      alt="Avatar" />
                  ))}
                </div>
                <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--magenta-soft), var(--magenta))',
                    color: 'white',
                  }}
                >
                  <Upload className="w-5 h-5" /><span>Upload Photo</span>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleGalleryUpload} className="hidden" />
                </label>

                <button
                  onClick={handleLogout}
                  className="mt-4 w-full py-2.5 rounded-xl text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Incoming Invite Modal */}
      {invite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-8 rounded-3xl text-center w-full max-w-sm"
            style={{
              background: 'linear-gradient(160deg, rgba(74,14,43,0.95), rgba(13,5,21,0.98))',
              border: '1px solid rgba(255,45,123,0.3)',
              boxShadow: '0 0 40px rgba(255,45,123,0.3)',
            }}
          >
            <Flame className="w-12 h-12 text-[var(--hot-pink)] mx-auto mb-4 animate-pulse" />
            <p className="text-2xl font-serif font-bold text-white mb-2">{invite.senderName} invited you!</p>
            <p className="text-xs text-[var(--coral)] mb-6 uppercase tracking-widest font-bold">Heat Level: {invite.category}</p>
            <div className="flex gap-3">
              <button onClick={() => { socket.emit('acceptInvite', { inviterId: invite.senderId, category: invite.category }); setInvite(null); }}
                className="flex-1 bg-[var(--hot-pink)] text-white py-3 rounded-xl font-bold uppercase tracking-wider">Accept</button>
              <button onClick={() => setInvite(null)}
                className="flex-1 bg-black/50 text-[var(--coral)] border border-[var(--burgundy)] py-3 rounded-xl font-bold uppercase tracking-wider">Decline</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Incoming Dice Invite Modal */}
      {diceInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-8 rounded-3xl text-center w-full max-w-sm"
            style={{
              background: 'linear-gradient(160deg, rgba(45,20,80,0.95), rgba(13,5,21,0.98))',
              border: '1px solid rgba(168,85,247,0.3)',
              boxShadow: '0 0 40px rgba(168,85,247,0.3)',
            }}
          >
            <Dices className="w-12 h-12 text-[var(--magenta-soft)] mx-auto mb-4 animate-pulse" />
            <p className="text-2xl font-serif font-bold text-white mb-2">{diceInvite.senderName} invited you!</p>
            <p className="text-xs text-[var(--magenta)] mb-6 uppercase tracking-widest font-bold">🎲 Spicy Dice</p>
            <div className="flex gap-3">
              <button onClick={() => { socket.emit('acceptDiceInvite', { inviterId: diceInvite.senderId, category: diceInvite.category }); setDiceInvite(null); }}
                className="flex-1 bg-[var(--magenta-soft)] text-white py-3 rounded-xl font-bold uppercase tracking-wider">Accept</button>
              <button onClick={() => setDiceInvite(null)}
                className="flex-1 bg-black/50 text-[var(--magenta)] border border-[var(--plum-mid)] py-3 rounded-xl font-bold uppercase tracking-wider">Decline</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Secret Stash Modal */}
      {secretStashData && (
        <div className="fixed inset-0 z-[100] flex flex-col p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            className="my-auto mx-auto w-full max-w-sm relative overflow-hidden rounded-[2.5rem] p-8 shrink-0"
            style={{
              background: 'linear-gradient(160deg, rgba(45,20,80,0.9), rgba(13,5,21,0.98), rgba(74,14,43,0.6))',
              border: '2px solid rgba(255,215,0,0.3)',
              boxShadow: '0 0 80px rgba(255,215,0,0.15)',
            }}
          >
            <div className="absolute -top-24 -right-24 w-56 h-56 bg-[var(--gold)]/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-[var(--magenta)]/10 blur-[80px] rounded-full pointer-events-none" />

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
                  <h2 className="text-2xl font-serif text-white font-black tracking-widest uppercase mb-1">Secret Stash</h2>
                  <p className="text-[var(--gold-dim)] text-[10px] uppercase tracking-[0.2em] font-bold">Write a custom Truth & Dare for your partner</p>
                </div>

                <div className="space-y-4 relative z-10">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--hot-pink)] mb-1.5 flex items-center gap-1.5">
                      <Heart className="w-3 h-3" /><span>Your Secret Truth</span>
                    </label>
                    <textarea
                      value={secretTruth}
                      onChange={(e) => setSecretTruth(e.target.value)}
                      placeholder="e.g. What's the most romantic thing you've secretly fantasized about?"
                      maxLength={200} rows={2}
                      className="w-full py-3 px-4 bg-black/60 border border-[var(--hot-pink)]/30 rounded-xl text-white text-sm placeholder-[var(--hot-pink)]/20 focus:border-[var(--hot-pink)] outline-none transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--coral)] mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-3 h-3" /><span>Your Secret Dare</span>
                    </label>
                    <textarea
                      value={secretDare}
                      onChange={(e) => setSecretDare(e.target.value)}
                      placeholder="e.g. Give me a 30-second massage on my neck using only your lips"
                      maxLength={200} rows={2}
                      className="w-full py-3 px-4 bg-black/60 border border-[var(--coral)]/30 rounded-xl text-white text-sm placeholder-[var(--coral)]/20 focus:border-[var(--coral)] outline-none transition-all resize-none"
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
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                      secretTruth.trim() && secretDare.trim()
                        ? 'text-black cta-shimmer'
                        : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                    }`}
                    style={secretTruth.trim() && secretDare.trim() ? {
                      background: 'linear-gradient(135deg, #FFE566, #FFD700, #F5A623)',
                      boxShadow: '0 0 30px rgba(255,215,0,0.3)',
                    } : {}}
                  >
                    <Lock className="w-4 h-4" /><span>Lock in my Secrets</span>
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
                  <Lock className="w-14 h-14 text-[var(--gold)] mx-auto" style={{ filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.4))' }} />
                </motion.div>
                <h2 className="text-xl font-serif text-white font-black tracking-widest uppercase mb-3">Secrets Locked 🔒</h2>
                <p className="text-[var(--gold-dim)] text-sm font-bold animate-pulse leading-relaxed">
                  Waiting for your partner to lock in their secrets...
                </p>
                <div className="mt-6 flex justify-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[var(--gold)]"
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

      {/* Daily Reward Modal */}
      <DailyRewardModal
        show={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        onClaim={claimDailyReward}
      />

      {/* Insufficient Coins Toast */}
      <InsufficientCoinsToast show={showInsufficientCoins} needed={insufficientAmount} />

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div
            key="homeScreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg mx-auto px-4 flex flex-col"
          >
            {/* ═══════════ PREMIUM HUD HEADER ═══════════ */}
            <header className="pt-4 pb-2 relative z-20">
              <div className="flex items-center justify-between">
                {/* Left: Logo */}
                <div>
                  <h1 className="text-2xl font-serif font-bold tracking-[0.15em] shimmer-text">IGNITE</h1>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.25em] font-light mt-0.5">Premium Collection</p>
                </div>

                {/* Right: Coins + Avatar */}
                <div className="flex items-center gap-3">
                  {/* Coin Balance */}
                  {userProfile && (
                    <div className="flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-full glass-panel">
                      <CoinIcon size={20} />
                      <span className="text-sm font-bold min-w-[32px] text-right">
                        <AnimatedCoinBalance value={coinBalance} />
                      </span>
                      <button
                        onClick={() => setShowDailyReward(true)}
                        className="w-6 h-6 rounded-full bg-[var(--gold)]/15 border border-[var(--gold)]/25 flex items-center justify-center hover:bg-[var(--gold)]/25 transition-all ml-0.5"
                      >
                        <Plus className="w-3 h-3 text-[var(--gold)]" />
                      </button>
                    </div>
                  )}

                  {/* Profile Avatar */}
                  <button
                    onClick={() => userProfile ? setShowAvatarModal(true) : navigate('/login')}
                    className="relative"
                  >
                    <img
                      src={userProfile?.avatar || CUTE_AVATARS[0]}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-[var(--magenta-soft)]/40 shadow-lg"
                      style={{ boxShadow: '0 0 15px rgba(168,85,247,0.2)' }}
                    />
                    {userProfile && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[var(--plum-deep)]" />
                    )}
                    {!userProfile && (
                      <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                        <LogIn className="w-4 h-4 text-white/70" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Welcome text for logged-in users */}
              {userProfile && (
                <p className="text-white/40 text-xs mt-3 font-light">
                  Welcome back, <span className="text-white/70 font-medium">{userProfile.name}</span> 💕
                </p>
              )}
            </header>

            {/* ═══════════ DAILY REWARD BANNER ═══════════ */}
            <motion.button
              onClick={() => setShowDailyReward(true)}
              whileTap={{ scale: 0.98 }}
              className={`mt-4 w-full rounded-2xl overflow-hidden relative ${dailyRewardAvailable ? 'animate-card-breathe' : ''}`}
              style={{
                background: dailyRewardAvailable
                  ? 'linear-gradient(135deg, rgba(45,20,80,0.8), rgba(74,14,43,0.6))'
                  : 'linear-gradient(135deg, rgba(20,10,30,0.6), rgba(30,15,40,0.4))',
                border: dailyRewardAvailable
                  ? '1px solid rgba(255,215,0,0.25)'
                  : '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Shimmer overlay for available state */}
              {dailyRewardAvailable && (
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <div className="absolute inset-0 opacity-20"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 3s linear infinite',
                    }}
                  />
                </div>
              )}

              <div className="relative z-10 flex items-center gap-4 px-5 py-4">
                {/* Gift icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${dailyRewardAvailable ? 'animate-pulse-glow' : ''}`}
                  style={{
                    background: dailyRewardAvailable
                      ? 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))'
                      : 'rgba(255,255,255,0.03)',
                    border: dailyRewardAvailable
                      ? '1px solid rgba(255,215,0,0.2)'
                      : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <Gift className={`w-6 h-6 ${dailyRewardAvailable ? 'text-[var(--gold)]' : 'text-white/20'}`} />
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${dailyRewardAvailable ? 'text-white' : 'text-white/30'}`}>
                    {dailyRewardAvailable ? 'Daily Reward Available!' : 'Daily Reward Claimed ✓'}
                  </p>
                  <p className={`text-[11px] ${dailyRewardAvailable ? 'text-[var(--gold-dim)]' : 'text-white/15'}`}>
                    {dailyRewardAvailable ? 'Claim 300 free coins today' : 'Come back tomorrow'}
                  </p>
                </div>

                {/* CTA / Check */}
                {dailyRewardAvailable ? (
                  <div className="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider text-black cta-shimmer"
                    style={{
                      background: 'linear-gradient(135deg, #FFE566, #FFD700)',
                      boxShadow: '0 0 15px rgba(255,215,0,0.2)',
                    }}
                  >
                    Claim
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                )}
              </div>
            </motion.button>

            {/* ═══════════ GAME CARDS SECTION ═══════════ */}
            <div ref={gamesRef} className="mt-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-serif text-white tracking-wide">Choose Your Game</h2>
                  <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] mt-1">Set the perfect mood for tonight</p>
                </div>
                <Crown className="w-5 h-5 text-[var(--gold-dim)]" />
              </div>

              <div className="space-y-4">
                {/* Featured: Naughty Deck */}
                <GameCard
                  game="cards"
                  cost={GAME_COSTS.cards}
                  title="Naughty Deck"
                  description="Reveal secrets & intimate tasks with your partner"
                  gradient="linear-gradient(135deg, rgba(74,14,43,0.9) 0%, rgba(45,20,80,0.8) 50%, rgba(74,14,43,0.7) 100%)"
                  icon={Heart}
                  iconColor="#FF2D7B"
                  glowColor="rgba(255,45,123,0.15)"
                  featured={true}
                  onClick={() => handleGameCardClick('cards')}
                />

                {/* Secondary row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Spicy Dice */}
                  <GameCard
                    game="dice"
                    cost={GAME_COSTS.dice}
                    title="Spicy Dice"
                    description="Roll to see who does what"
                    gradient="linear-gradient(160deg, rgba(100,20,10,0.9) 0%, rgba(80,30,15,0.8) 50%, rgba(60,15,30,0.7) 100%)"
                    icon={Dices}
                    iconColor="#FF8A50"
                    glowColor="rgba(255,138,80,0.15)"
                    featured={false}
                    onClick={() => handleGameCardClick('dice')}
                  />

                  {/* Naughty Ludo */}
                  <GameCard
                    game="ludo"
                    cost={GAME_COSTS.ludo}
                    title="Naughty Ludo"
                    description="Board game with spicy penalties"
                    gradient="linear-gradient(160deg, rgba(15,40,50,0.9) 0%, rgba(20,30,60,0.8) 50%, rgba(30,15,50,0.7) 100%)"
                    icon={Gamepad2}
                    iconColor="#50E3C2"
                    glowColor="rgba(80,227,194,0.15)"
                    featured={false}
                    onClick={() => handleGameCardClick('ludo')}
                  />
                </div>
              </div>
            </div>

            {/* ═══════════ HOW IT WORKS HINT ═══════════ */}
            <div className="mt-2 mb-6 px-1">
              <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="w-8 h-8 rounded-lg bg-[var(--magenta-soft)]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[var(--magenta-soft)]" />
                </div>
                <p className="text-white/25 text-[11px] leading-relaxed">
                  Each game costs coins to play. Earn <span className="text-[var(--gold-dim)]">300 coins daily</span> for free!
                </p>
              </div>
            </div>

          </motion.div>
        ) : (
          /* ═══════════ LOBBY FLOW (PRESERVED) ═══════════ */
          <motion.div
            key="lobbyFlow"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg mx-auto px-4 pt-4"
          >
            <LobbyFlow 
              userProfile={userProfile}
              socket={socket}
              onlinePlayers={onlinePlayers}
              myPartners={myPartners}
              selectedGame={selectedGame}
              onBack={() => {
                // Refund coins when user backs out without playing
                const cost = GAME_COSTS[selectedGame];
                const current = getCoins();
                saveCoins(current + cost);
                setCoinBalance(current + cost);
                setSelectedGame(null);
              }}
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
                      preloadedQuestions: progressiveStages
                    }
                  });
                } else {
                   setLobbyData({
                     isHost: true,
                     roomCode: '...',
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

      {/* ═══════════ BOTTOM NAVIGATION ═══════════ */}
      <BottomNav activeTab={activeNav} onTabChange={handleNavTabChange} />
    </div>
  );
}