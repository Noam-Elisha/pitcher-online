// app.js — Entry point: state management, event wiring, mode switching

import { NOTE_NAMES, getFrequency } from './tuning.js';
import { initAudio, startVoice, stopVoice, clearAllVoices, getActiveNoteIds, rebuildAllVoices, updateFrequencies, setMasterVolume, isAudioReady } from './audio-engine.js';
import { getChordNotes } from './chord-data.js';
import { buildNoteGrid, buildChordGrid, renderNoteGrid, renderActiveNotesDisplay, renderChordGrid } from './ui.js';

// ===== State =====
const state = {
  mode: 'drone',        // 'drone' | 'chord'
  timbre: 'sine',
  tuningSystem: '12tet', // '12tet' | 'just'
  a4Ref: 440,
  jiRoot: 'A',
  octave: 4,
  volume: 0.7,
  // Drone mode: which note names are active at which octave
  activeDrones: new Map(), // noteId ("C4") -> { noteName, octave }
  // Chord mode
  activeChordRoot: null,
  activeChordType: null,
};

// ===== DOM References =====
const overlay = document.getElementById('audio-init-overlay');
const noteGrid = document.getElementById('note-grid');
const chordGrid = document.getElementById('chord-grid');
const activeNotesDisplay = document.getElementById('active-notes-display');
const dronePanel = document.getElementById('drone-panel');
const chordPanel = document.getElementById('chord-panel');
const timbreSelect = document.getElementById('timbre-select');
const tuningSystem = document.getElementById('tuning-system');
const a4RefInput = document.getElementById('a4-ref');
const jiRootGroup = document.getElementById('ji-root-group');
const jiRootSelect = document.getElementById('ji-root');
const octaveSelect = document.getElementById('octave-select');
const volumeSlider = document.getElementById('volume-slider');
const clearAllBtn = document.getElementById('clear-all');
const modeTabs = document.querySelectorAll('.tab');

// ===== Helpers =====
function tuningOptions() {
  return { system: state.tuningSystem, a4Ref: state.a4Ref, jiRoot: state.jiRoot };
}

function noteId(noteName, octave) {
  return `${noteName}${octave}`;
}

function getFreqForCurrentNote(noteName) {
  return getFrequency(noteName, state.octave, tuningOptions());
}

function buildFrequencyMap() {
  const map = new Map();
  for (const [id, info] of state.activeDrones) {
    map.set(id, getFrequency(info.noteName, info.octave, tuningOptions()));
  }
  return map;
}

// ===== Audio Init =====
function ensureAudio() {
  if (!isAudioReady()) {
    initAudio();
    setMasterVolume(state.volume);
    overlay.classList.add('hidden');
  }
}

// Dismiss overlay on any interaction
function handleFirstInteraction() {
  ensureAudio();
  document.removeEventListener('pointerdown', handleFirstInteraction);
  document.removeEventListener('keydown', handleFirstInteraction);
}
document.addEventListener('pointerdown', handleFirstInteraction);
document.addEventListener('keydown', handleFirstInteraction);

// ===== Rendering =====
function render() {
  // Note grid
  const activeNoteNames = new Set();
  for (const [, info] of state.activeDrones) {
    if (info.octave === state.octave) {
      activeNoteNames.add(info.noteName);
    }
  }
  renderNoteGrid(noteGrid, activeNoteNames, getFreqForCurrentNote);
  renderActiveNotesDisplay(activeNotesDisplay, new Set(state.activeDrones.keys()));

  // Chord grid
  renderChordGrid(chordGrid, state.activeChordRoot, state.activeChordType);

  // JI root visibility
  jiRootGroup.classList.toggle('visible', state.tuningSystem === 'just');

  // Panels
  dronePanel.classList.toggle('active', state.mode === 'drone');
  chordPanel.classList.toggle('active', state.mode === 'chord');

  // Mode tabs
  modeTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.mode === state.mode);
  });
}

// ===== Drone Mode Logic =====
function handleNoteClick(noteName) {
  ensureAudio();

  const id = noteId(noteName, state.octave);
  if (state.activeDrones.has(id)) {
    // Stop this drone
    stopVoice(id);
    state.activeDrones.delete(id);
  } else {
    // Start this drone
    const freq = getFrequency(noteName, state.octave, tuningOptions());
    startVoice(id, freq, state.timbre);
    state.activeDrones.set(id, { noteName, octave: state.octave });
  }
  render();
}

// ===== Chord Mode Logic =====
function handleChordClick(rootName, chordTypeId) {
  ensureAudio();

  // If tapping the already-active chord, clear it
  if (state.activeChordRoot === rootName && state.activeChordType === chordTypeId) {
    clearAllVoices();
    state.activeDrones.clear();
    state.activeChordRoot = null;
    state.activeChordType = null;
    render();
    return;
  }

  // Clear existing voices
  clearAllVoices();
  state.activeDrones.clear();

  // Start chord notes
  const notes = getChordNotes(rootName, chordTypeId, state.octave);
  notes.forEach(n => {
    const id = noteId(n.noteName, n.octave);
    const freq = getFrequency(n.noteName, n.octave, tuningOptions());
    startVoice(id, freq, state.timbre);
    state.activeDrones.set(id, { noteName: n.noteName, octave: n.octave });
  });

  state.activeChordRoot = rootName;
  state.activeChordType = chordTypeId;
  render();
}

// ===== Settings Handlers =====
timbreSelect.addEventListener('change', () => {
  state.timbre = timbreSelect.value;
  if (state.activeDrones.size > 0) {
    ensureAudio();
    rebuildAllVoices(state.timbre, buildFrequencyMap());
  }
});

tuningSystem.addEventListener('change', () => {
  state.tuningSystem = tuningSystem.value;
  if (state.activeDrones.size > 0) {
    ensureAudio();
    updateFrequencies(buildFrequencyMap(), state.timbre);
  }
  render();
});

a4RefInput.addEventListener('change', () => {
  state.a4Ref = parseFloat(a4RefInput.value) || 440;
  if (state.a4Ref < 400) state.a4Ref = 400;
  if (state.a4Ref > 480) state.a4Ref = 480;
  a4RefInput.value = state.a4Ref;
  if (state.activeDrones.size > 0) {
    ensureAudio();
    updateFrequencies(buildFrequencyMap(), state.timbre);
  }
  render();
});

jiRootSelect.addEventListener('change', () => {
  state.jiRoot = jiRootSelect.value;
  if (state.tuningSystem === 'just' && state.activeDrones.size > 0) {
    ensureAudio();
    updateFrequencies(buildFrequencyMap(), state.timbre);
  }
  render();
});

octaveSelect.addEventListener('change', () => {
  state.octave = parseInt(octaveSelect.value);
  render();
});

volumeSlider.addEventListener('input', () => {
  state.volume = parseInt(volumeSlider.value) / 100;
  setMasterVolume(state.volume);
});

clearAllBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  clearAllVoices();
  state.activeDrones.clear();
  state.activeChordRoot = null;
  state.activeChordType = null;
  render();
});

// ===== Mode Switching =====
modeTabs.forEach(tab => {
  tab.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const mode = tab.dataset.mode;
    if (mode === state.mode) return;

    // Clear everything when switching modes
    clearAllVoices();
    state.activeDrones.clear();
    state.activeChordRoot = null;
    state.activeChordType = null;
    state.mode = mode;

    // Default chord octave to 3 for better sound
    if (mode === 'chord' && state.octave > 5) {
      state.octave = 3;
      octaveSelect.value = '3';
    }

    render();
  });
});

// ===== Initialize =====
buildNoteGrid(noteGrid, handleNoteClick);
buildChordGrid(chordGrid, handleChordClick);
render();
