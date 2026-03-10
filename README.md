# Pitcher Online

A musical drone and tuning tool for musicians. Play sustained tones to tune your instrument, practice intonation, or just vibe with some drones.

**Live site:** [noamelisha.github.io/pitcher-online](https://noamelisha.github.io/pitcher-online/)

## Features

### Drone Mode
- Select any note (C through B) at any octave (C0–C8) to play a sustained tone
- Play multiple notes simultaneously
- See the exact frequency of each note

### Chord Mode
- One-tap chord playback across all 12 root notes
- 6 chord types: Major, Minor, Dominant 7th, Diminished, Half-diminished, Augmented
- Tap a chord to play it, tap another to switch, tap the same chord again to stop

### Sound Options
- **Sine (Pure)** — clean fundamental tone
- **Warm Pad** — detuned sawtooth waves with low-pass filter
- **Bright Pad** — detuned sawtooth waves, open and airy
- **Organ** — additive sine harmonics (fundamental + octave + twelfth)
- **Strings** — sawtooth waves with vibrato LFO

### Tuning Systems
- **Equal temperament (12-TET)** — standard Western tuning
- **Just Intonation** — pure 5-limit ratios relative to a selectable root key
- Adjustable A4 reference frequency (400–480 Hz)

## Usage

Open `index.html` in any browser — no server required, no install, no dependencies. Everything is a single self-contained HTML file.

Works on desktop and mobile (touch-friendly).

## Tech

- Pure HTML/CSS/JS, no frameworks or build step
- Web Audio API for all sound synthesis (OscillatorNode, GainNode, BiquadFilterNode)
- Fade in/out on all voices to prevent audio clicks
- Auto volume scaling (`1/sqrt(n)`) to prevent clipping with many simultaneous voices
- AudioContext resume on visibility change for iOS Safari compatibility
