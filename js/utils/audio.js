// ==========================================================================
// js/utils/audio.js — Sokin Fon Musiqasi (Calm Ambient Acoustic Music Player)
// ==========================================================================

let audioPlayer = null;
let isMusicPlaying = false;
let audioContext = null;
let webAudioInterval = null;

// Sokin akustik trek (Wikimedia Commons OGG / MP3)
const AUDIO_TRACK_URL = 'https://upload.wikimedia.org/wikipedia/commons/5/50/02_-_Breezy_May_Acoustic.ogg';

/**
 * Web Audio API orqali sokin, meditatsion orkestr/arfa ohangini generatsiya qilish (zaxira varianti)
 */
function startWebAudioAmbient() {
  if (webAudioInterval) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    if (!audioContext) {
      audioContext = new AudioCtx();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Pentatonik sokin notalar (C D E G A)
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

    function playCalmNote() {
      if (!isMusicPlaying || !audioContext) return;
      try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        const freq = notes[Math.floor(Math.random() * notes.length)];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime);

        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.06, audioContext.currentTime + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 3.2);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start();
        osc.stop(audioContext.currentTime + 3.3);
      } catch (_) {}
    }

    playCalmNote();
    webAudioInterval = setInterval(playCalmNote, 1600);
  } catch (_) {}
}

function stopWebAudioAmbient() {
  if (webAudioInterval) {
    clearInterval(webAudioInterval);
    webAudioInterval = null;
  }
}

/**
 * Sokin musiqani ishga tushirish yoki to'xtatish
 * @param {(playing: boolean) => void} onStateChange
 */
export async function toggleBackgroundMusic(onStateChange) {
  if (isMusicPlaying) {
    pauseBackgroundMusic();
    if (typeof onStateChange === 'function') onStateChange(false);
    return false;
  } else {
    const success = await playBackgroundMusic();
    if (typeof onStateChange === 'function') onStateChange(success);
    return success;
  }
}

/**
 * Musiqani boshlash
 */
export async function playBackgroundMusic() {
  try {
    if (!audioPlayer) {
      audioPlayer = new Audio();
      audioPlayer.src = AUDIO_TRACK_URL;
      audioPlayer.loop = true;
      audioPlayer.volume = 0.35;
      audioPlayer.preload = 'auto';

      audioPlayer.addEventListener('error', () => {
        // Agar tashqi fayl ochilmasa, avtomatik Web Audio sokin ohangini yoqamiz
        startWebAudioAmbient();
      });
    }

    const promise = audioPlayer.play();
    if (promise !== undefined) {
      await promise;
    }
    isMusicPlaying = true;
    return true;
  } catch (err) {
    // Mobil brauzerlarda to'g'ridan-to'g'ri Web Audio fallback
    isMusicPlaying = true;
    startWebAudioAmbient();
    return true;
  }
}

/**
 * Musiqani to'xtatish
 */
export function pauseBackgroundMusic() {
  isMusicPlaying = false;
  if (audioPlayer) {
    try {
      audioPlayer.pause();
    } catch (_) {}
  }
  stopWebAudioAmbient();
}

/**
 * Hozirgi musiqa holati
 */
export function isMusicActive() {
  return isMusicPlaying;
}
