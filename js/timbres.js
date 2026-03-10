// timbres.js — Synthesized timbre factories for the Web Audio API

/**
 * Each timbre is an object with:
 *   name: display name
 *   id: unique key
 *   create(audioCtx, frequency): returns { nodes: AudioNode[], output: AudioNode }
 *     - nodes: all created nodes (for cleanup)
 *     - output: the final node to connect to the voice gain
 */

function createSine(audioCtx, frequency) {
  const osc = audioCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  return { nodes: [osc], output: osc, oscillators: [osc] };
}

function createWarmPad(audioCtx, frequency) {
  const merger = audioCtx.createGain();
  merger.gain.value = 0.4;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  filter.Q.value = 0.7;

  const detunes = [0, 7, -7];
  const oscs = detunes.map(d => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency;
    osc.detune.value = d;
    osc.connect(merger);
    return osc;
  });

  merger.connect(filter);
  return { nodes: [...oscs, merger, filter], output: filter, oscillators: oscs };
}

function createBrightPad(audioCtx, frequency) {
  const merger = audioCtx.createGain();
  merger.gain.value = 0.5;

  const detunes = [0, 5];
  const oscs = detunes.map(d => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency;
    osc.detune.value = d;
    osc.connect(merger);
    return osc;
  });

  return { nodes: [...oscs, merger], output: merger, oscillators: oscs };
}

function createOrgan(audioCtx, frequency) {
  const merger = audioCtx.createGain();
  merger.gain.value = 0.35;

  const harmonics = [
    { freq: frequency, gain: 1.0 },
    { freq: frequency * 2, gain: 0.5 },
    { freq: frequency * 3, gain: 0.25 },
  ];

  const oscs = harmonics.map(h => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = h.freq;
    const g = audioCtx.createGain();
    g.gain.value = h.gain;
    osc.connect(g);
    g.connect(merger);
    return osc;
  });

  return { nodes: [...oscs, merger], output: merger, oscillators: oscs };
}

function createStrings(audioCtx, frequency) {
  const merger = audioCtx.createGain();
  merger.gain.value = 0.4;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 4000;
  filter.Q.value = 0.5;

  const detunes = [3, -3];
  const oscs = detunes.map(d => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency;
    osc.detune.value = d;
    osc.connect(merger);
    return osc;
  });

  merger.connect(filter);

  // Vibrato LFO
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 4.5;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 3; // vibrato depth in cents
  lfo.connect(lfoGain);
  oscs.forEach(osc => lfoGain.connect(osc.detune));

  return { nodes: [...oscs, merger, filter, lfo, lfoGain], output: filter, oscillators: [...oscs, lfo] };
}

export const TIMBRES = {
  sine:      { name: 'Sine (Pure)', id: 'sine', create: createSine },
  warmPad:   { name: 'Warm Pad', id: 'warmPad', create: createWarmPad },
  brightPad: { name: 'Bright Pad', id: 'brightPad', create: createBrightPad },
  organ:     { name: 'Organ', id: 'organ', create: createOrgan },
  strings:   { name: 'Strings', id: 'strings', create: createStrings },
};
