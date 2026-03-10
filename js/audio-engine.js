// audio-engine.js — Web Audio API graph management, voice creation/destruction

import { TIMBRES } from './timbres.js';

let audioCtx = null;
let masterGain = null;
let masterVolume = 0.7;
const voices = new Map(); // noteId -> Voice

const FADE_IN_MS = 30;
const FADE_OUT_MS = 50;

/**
 * Initialize the AudioContext (must be called from a user gesture).
 * Returns true if newly created, false if already existed.
 */
export function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return false;
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(audioCtx.destination);

  // Resume on visibility change (iOS Safari suspends context when backgrounded)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });

  return true;
}

export function isAudioReady() {
  return audioCtx !== null;
}

/**
 * Update the master volume (0 to 1).
 */
export function setMasterVolume(vol) {
  masterVolume = vol;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.02);
  }
}

/**
 * Scale master gain based on the number of active voices.
 */
function updateVolumeScaling() {
  if (!masterGain) return;
  const count = voices.size;
  const scaled = count > 0 ? masterVolume / Math.sqrt(count) : masterVolume;
  masterGain.gain.setTargetAtTime(scaled, audioCtx.currentTime, 0.05);
}

/**
 * Start a drone voice.
 * @param {string} noteId - unique id like "C4"
 * @param {number} frequency - Hz
 * @param {string} timbreId - key from TIMBRES
 */
export function startVoice(noteId, frequency, timbreId) {
  if (!audioCtx) return;
  if (voices.has(noteId)) return; // already playing

  const timbre = TIMBRES[timbreId];
  if (!timbre) return;

  const { nodes, output, oscillators } = timbre.create(audioCtx, frequency);

  // Per-voice gain for fade in/out
  const voiceGain = audioCtx.createGain();
  voiceGain.gain.setValueAtTime(0, audioCtx.currentTime);
  voiceGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + FADE_IN_MS / 1000);

  output.connect(voiceGain);
  voiceGain.connect(masterGain);

  // Start all oscillators
  oscillators.forEach(osc => osc.start());

  voices.set(noteId, {
    nodes,
    oscillators,
    voiceGain,
    frequency,
    timbreId,
  });

  updateVolumeScaling();
}

/**
 * Stop a specific voice with fade-out.
 * @param {string} noteId
 * @returns {Promise} resolves when cleanup is done
 */
export function stopVoice(noteId) {
  const voice = voices.get(noteId);
  if (!voice) return Promise.resolve();

  voices.delete(noteId);
  updateVolumeScaling();

  const { oscillators, voiceGain, nodes } = voice;
  const now = audioCtx.currentTime;

  voiceGain.gain.cancelScheduledValues(now);
  voiceGain.gain.setValueAtTime(voiceGain.gain.value, now);
  voiceGain.gain.linearRampToValueAtTime(0, now + FADE_OUT_MS / 1000);

  return new Promise(resolve => {
    setTimeout(() => {
      oscillators.forEach(osc => {
        try { osc.stop(); } catch (e) { /* already stopped */ }
      });
      nodes.forEach(node => {
        try { node.disconnect(); } catch (e) { /* ok */ }
      });
      try { voiceGain.disconnect(); } catch (e) { /* ok */ }
      resolve();
    }, FADE_OUT_MS + 10);
  });
}

/**
 * Stop all voices.
 */
export function clearAllVoices() {
  const promises = [];
  for (const noteId of voices.keys()) {
    promises.push(stopVoice(noteId));
  }
  return Promise.all(promises);
}

/**
 * Get all currently active note IDs.
 */
export function getActiveNoteIds() {
  return new Set(voices.keys());
}

/**
 * Rebuild all active voices with a new timbre (live timbre switching).
 */
export function rebuildAllVoices(timbreId, frequencyMap) {
  const active = [...voices.entries()];
  const promises = active.map(([noteId]) => stopVoice(noteId));
  return Promise.all(promises).then(() => {
    active.forEach(([noteId, voice]) => {
      const freq = frequencyMap.get(noteId) || voice.frequency;
      startVoice(noteId, freq, timbreId);
    });
  });
}

/**
 * Update frequencies for all active voices (live tuning change).
 */
export function updateFrequencies(frequencyMap, timbreId) {
  // Rebuild voices with new frequencies — simpler and avoids oscillator count mismatch
  const active = [...voices.entries()];
  const promises = active.map(([noteId]) => stopVoice(noteId));
  return Promise.all(promises).then(() => {
    active.forEach(([noteId, voice]) => {
      const freq = frequencyMap.get(noteId) || voice.frequency;
      startVoice(noteId, freq, timbreId);
    });
  });
}
