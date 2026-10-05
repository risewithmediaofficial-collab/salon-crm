/**
 * notificationAudio.js
 * Plays a pleasant luxury chime using Web Audio API (no external MP3/audio files needed)
 *
 * Strategy: browsers block audio before user interaction. We unlock the audio context
 * on the first click/keydown, then play queued chimes.
 */

let _audioCtx = null;
let _unlocked = false;
const _pendingChimes = [];

function getAudioContext() {
  if (!_audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    _audioCtx = new AC();
  }
  return _audioCtx;
}

function unlockAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().then(() => {
      _unlocked = true;
      // Play any queued chimes now that audio is unlocked
      while (_pendingChimes.length > 0) {
        const fn = _pendingChimes.shift();
        fn();
      }
    }).catch(() => {});
  } else {
    _unlocked = true;
    while (_pendingChimes.length > 0) {
      const fn = _pendingChimes.shift();
      fn();
    }
  }
}

// Unlock audio context on any user gesture
if (typeof window !== 'undefined') {
  const unlock = () => {
    unlockAudioContext();
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('click', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
}

function _playChimeNow() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: High crisp harmonic (F#5 ~ 739.99 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(739.99, now);
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Tone 2: Warm bell resonance (C#6 ~ 1108.73 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1108.73, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.35);
    gain2.gain.setValueAtTime(0.28, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);

    // Tone 3: Deep warmth (A4 ~ 440 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(440, now + 0.35);
    gain3.gain.setValueAtTime(0.12, now + 0.35);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.35);
    osc3.stop(now + 0.9);
  } catch (err) {
    console.debug('Chime error:', err);
  }
}

export function playNotificationChime() {
  // Mobile vibration fallback
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }

  if (_unlocked) {
    _playChimeNow();
  } else {
    // Queue it — will fire once audio context is unlocked by user interaction
    _pendingChimes.push(_playChimeNow);
    // Try to unlock proactively
    unlockAudioContext();
  }
}

export function requestDesktopNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export function showDesktopNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon: '/favicon.svg',
        tag: 'salon-appointment',   // prevents stacking duplicate notifications
        renotify: true,
      });
      // Auto-close after 8 seconds
      setTimeout(() => n.close(), 8000);
    } catch (err) {
      console.debug('Desktop notification error:', err);
    }
  }
}
