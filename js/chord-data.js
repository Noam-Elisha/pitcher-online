// chord-data.js — Chord type definitions and note calculation

import { NOTE_NAMES, NOTE_INDEX } from './tuning.js';

export const CHORD_TYPES = [
  { id: 'major',    name: 'Maj',   intervals: [0, 4, 7] },
  { id: 'minor',    name: 'Min',   intervals: [0, 3, 7] },
  { id: 'dom7',     name: '7',     intervals: [0, 4, 7, 10] },
  { id: 'dim',      name: 'Dim',   intervals: [0, 3, 6] },
  { id: 'halfdim',  name: 'Hdim',  intervals: [0, 3, 6, 10] },
  { id: 'aug',      name: 'Aug',   intervals: [0, 4, 8] },
];

/**
 * Get the notes for a chord.
 * @param {string} rootName - e.g. 'C', 'F#'
 * @param {string} chordTypeId - e.g. 'major', 'dom7'
 * @param {number} octave - base octave
 * @returns {Array<{noteName: string, octave: number}>}
 */
export function getChordNotes(rootName, chordTypeId, octave) {
  const chordType = CHORD_TYPES.find(c => c.id === chordTypeId);
  if (!chordType) return [];

  const rootIndex = NOTE_INDEX[rootName];
  return chordType.intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const octaveOffset = Math.floor((rootIndex + interval) / 12);
    return {
      noteName: NOTE_NAMES[noteIndex],
      octave: octave + octaveOffset,
    };
  });
}
