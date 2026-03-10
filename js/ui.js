// ui.js — DOM manipulation helpers and rendering

import { NOTE_NAMES } from './tuning.js';
import { CHORD_TYPES } from './chord-data.js';

const SHARPS = new Set(['C#', 'D#', 'F#', 'G#', 'A#']);

/**
 * Build the note grid buttons for drone mode.
 */
export function buildNoteGrid(container, onNoteClick) {
  container.innerHTML = '';
  NOTE_NAMES.forEach(name => {
    const btn = document.createElement('button');
    btn.className = 'note-btn' + (SHARPS.has(name) ? ' sharp' : '');
    btn.dataset.note = name;
    btn.innerHTML = `<span class="note-name">${name}</span><span class="note-freq"></span>`;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onNoteClick(name);
    });
    container.appendChild(btn);
  });
}

/**
 * Build the chord grid for chord mode.
 */
export function buildChordGrid(container, onChordClick) {
  container.innerHTML = '';
  NOTE_NAMES.forEach(rootName => {
    const row = document.createElement('div');
    row.className = 'chord-row';

    const label = document.createElement('div');
    label.className = 'chord-root-label';
    label.textContent = rootName;
    row.appendChild(label);

    const types = document.createElement('div');
    types.className = 'chord-types';

    CHORD_TYPES.forEach(ct => {
      const btn = document.createElement('button');
      btn.className = 'chord-btn';
      btn.dataset.root = rootName;
      btn.dataset.chord = ct.id;
      btn.textContent = ct.name;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        onChordClick(rootName, ct.id);
      });
      types.appendChild(btn);
    });

    row.appendChild(types);
    container.appendChild(row);
  });
}

/**
 * Update note button active states and frequency labels.
 */
export function renderNoteGrid(container, activeNotes, getFreqForNote) {
  const buttons = container.querySelectorAll('.note-btn');
  buttons.forEach(btn => {
    const name = btn.dataset.note;
    const isActive = activeNotes.has(name);
    btn.classList.toggle('active', isActive);
    const freqEl = btn.querySelector('.note-freq');
    if (freqEl) {
      const freq = getFreqForNote(name);
      freqEl.textContent = freq.toFixed(1) + ' Hz';
    }
  });
}

/**
 * Update the active notes display bar.
 */
export function renderActiveNotesDisplay(container, activeNoteIds) {
  if (activeNoteIds.size === 0) {
    container.innerHTML = '<span style="opacity:0.5">No active drones</span>';
    return;
  }
  container.innerHTML = '';
  // Sort by MIDI-ish order for display
  const sorted = [...activeNoteIds].sort((a, b) => {
    const parseNote = (id) => {
      const match = id.match(/^([A-G]#?)(\d+)$/);
      if (!match) return 0;
      const noteIdx = NOTE_NAMES.indexOf(match[1]);
      const oct = parseInt(match[2]);
      return oct * 12 + noteIdx;
    };
    return parseNote(a) - parseNote(b);
  });
  sorted.forEach(noteId => {
    const tag = document.createElement('span');
    tag.className = 'active-note-tag';
    tag.textContent = noteId;
    container.appendChild(tag);
  });
}

/**
 * Update chord button active states.
 */
export function renderChordGrid(container, activeRoot, activeChordType) {
  const buttons = container.querySelectorAll('.chord-btn');
  buttons.forEach(btn => {
    const isActive = btn.dataset.root === activeRoot && btn.dataset.chord === activeChordType;
    btn.classList.toggle('active', isActive);
  });
}
