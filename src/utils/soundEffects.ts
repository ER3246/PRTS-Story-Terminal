// =========================================================================
// PRTS Archive Sound Effects Engine (Web Audio API Synthesizer)
// 별도의 외부 음원 파일 없이 브라우저 내장 오디오 컨텍스트를 활용하여
// 무채색 인더스트리얼 UI에 어울리는 절제된 저역대 기계식 인터랙션 사운드를 생성합니다.
// =========================================================================

let audioCtx: AudioContext | null = null;
let soundEnabled = false;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
  if (enabled && !audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
};

export const getSoundEnabled = () => soundEnabled;

const getContext = (): AudioContext | null => {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

interface VoiceSpec {
  type: OscillatorType;
  startFreq: number;
  endFreq: number;
}

const playFilteredEnvelope = (
  voices: VoiceSpec[],
  cutoffHz: number,
  durationSec: number,
  peakGain: number
) => {
  if (!soundEnabled) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoffHz, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peakGain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    filter.connect(gain);
    gain.connect(ctx.destination);

    for (const v of voices) {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.setValueAtTime(v.startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(v.endFreq, now + durationSec);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + durationSec);
    }
  } catch {
    // Audio Context block fallback
  }
};

// 1. 단정하고 묵직한 클릭/선택 사운드 (Damped Mechanical Switch Tick)
export const playClickSound = () => {
  playFilteredEnvelope(
    [{ type: 'triangle', startFreq: 185, endFreq: 82 }],
    520,
    0.024,
    0.06
  );
};

// 2. 뷰 전환 및 메인 탭 선택 사운드 (Grounded Low-Mid Mechanical Step)
export const playTabSwitchSound = () => {
  playFilteredEnvelope(
    [
      { type: 'triangle', startFreq: 145, endFreq: 110 },
      { type: 'sine', startFreq: 220, endFreq: 165 },
    ],
    640,
    0.036,
    0.055
  );
};

// 3. 드로어/라이트박스 개방 사운드 (Low-Register Engagement)
export const playOpenSound = () => {
  playFilteredEnvelope(
    [{ type: 'triangle', startFreq: 135, endFreq: 195 }],
    580,
    0.05,
    0.05
  );
};

// 4. 드로어/라이트박스 닫힘 사운드 (Muted Low-Register Release)
export const playCloseSound = () => {
  playFilteredEnvelope(
    [{ type: 'triangle', startFreq: 180, endFreq: 105 }],
    480,
    0.042,
    0.048
  );
};
