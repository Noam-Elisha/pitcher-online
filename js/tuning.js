// tuning.js — Frequency calculation for 12-TET and Just Intonation

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_INDEX = Object.fromEntries(NOTE_NAMES.map((n, i) => [n, i]));

// 5-limit Just Intonation ratios (relative to root)
const JI_RATIOS = [
  1 / 1,      // Unison
  16 / 15,    // Minor 2nd
  9 / 8,      // Major 2nd
  6 / 5,      // Minor 3rd
  5 / 4,      // Major 3rd
  4 / 3,      // Perfect 4th
  45 / 32,    // Tritone
  3 / 2,      // Perfect 5th
  8 / 5,      // Minor 6th
  5 / 3,      // Major 6th
  16 / 9,     // Minor 7th
  15 / 8,     // Major 7th
];

/**
 * Get MIDI number for a note name and octave.
 * C4 = 60, A4 = 69
 */
export function getMidiNumber(noteName, octave) {
  return (octave + 1) * 12 + NOTE_INDEX[noteName];
}

/**
 * Get frequency using 12-tone equal temperament.
 */
export function getFrequency12TET(noteName, octave, a4Ref = 440) {
  const midi = getMidiNumber(noteName, octave);
  return a4Ref * Math.pow(2, (midi - 69) / 12);
}

/**
 * Get frequency using 5-limit Just Intonation relative to a root key.
 */
export function getFrequencyJI(noteName, octave, jiRoot, a4Ref = 440) {
  const rootFreqAtOctave0 = a4Ref * Math.pow(2, (getMidiNumber(jiRoot, 0) - 69) / 12);
  const targetIndex = NOTE_INDEX[noteName];
  const rootIndex = NOTE_INDEX[jiRoot];
  const interval = ((targetIndex - rootIndex) % 12 + 12) % 12;
  const jiFreqAtOctave0 = rootFreqAtOctave0 * JI_RATIOS[interval];
  return jiFreqAtOctave0 * Math.pow(2, octave);
}

/**
 * Unified frequency getter.
 */
export function getFrequency(noteName, octave, { system = '12tet', a4Ref = 440, jiRoot = 'A' } = {}) {
  if (system === 'just') {
    return getFrequencyJI(noteName, octave, jiRoot, a4Ref);
  }
  return getFrequency12TET(noteName, octave, a4Ref);
}

export { NOTE_NAMES, NOTE_INDEX };
