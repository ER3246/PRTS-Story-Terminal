// =========================================================================
// PRTS Terminal Sound Effects Engine (Web Audio API Synthesizer)
// 별도의 외부 음원 파일 없이 브라우저 내장 오디오 컨텍스트를 활용하여
// 명일방주 PRTS 특유의 다크 테크웨어 신디사이저 사운드를 0ms 지연으로 생성합니다.
// =========================================================================

let audioCtx: AudioContext | null = null;
let soundEnabled = false;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  if (enabled && !audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
};

export const getSoundEnabled = () => soundEnabled;

const getContext = (): AudioContext | null => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// 1. 가벼운 클릭/선택 사운드 (Quick High-tech Blip)
export const playClickSound = () => {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {
    // Audio Context block fallback
  }
};

// 2. 뷰 전환 및 메인 탭 선택 사운드 (Two-tone Chime)
export const playTabSwitchSound = () => {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.setValueAtTime(720, now + 0.03);
    osc.frequency.setValueAtTime(1080, now + 0.06);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.12);
  } catch {
    // Fallback
  }
};

// 3. 드로어/라이트박스 개방 사운드 (Ascending Terminal Slide)
export const playOpenSound = () => {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.08);
  } catch {
    // Fallback
  }
};

// 4. 드로어/라이트박스 닫힘 사운드 (Descending Slide)
export const playCloseSound = () => {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.06);
  } catch {
    // Fallback
  }
};
