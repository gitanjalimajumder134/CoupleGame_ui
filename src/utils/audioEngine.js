let audioCtx = null;

// Initialize AudioContext on first interaction or demand
const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Generates a short burst of filtered white noise
const createNoiseBuffer = (ctx) => {
  const bufferSize = ctx.sampleRate * 0.1; // 0.1 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // White noise from -1 to 1
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const playCardSnapSound = () => {
  try {
    const ctx = getAudioContext();
    const time = ctx.currentTime;

    // 1. The Low-Frequency Transient "Thump"
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    // Quick, low punch
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.05);

    // Tight amplitude envelope
    oscGain.gain.setValueAtTime(0, time);
    oscGain.gain.linearRampToValueAtTime(0.5, time + 0.01);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.05);

    // 2. The High-Frequency "Snap" (Filtered Noise)
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx);
    
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000; // Let high friction sounds through

    const noiseGain = ctx.createGain();
    
    // Sharp snap envelope
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(0.3, time + 0.01);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noiseSource.start(time);
    noiseSource.stop(time + 0.05);

  } catch (error) {
    console.warn("AudioContext failed to play card snap:", error);
  }
};
