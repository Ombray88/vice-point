export function createAudio() {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  let engineOsc = null;
  let engineGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let sirenState = false;
  let sirenTimer = 0;
  let musicTime = 0;
  let drivingVal = 0;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.25;
      masterGain.connect(ctx.destination);

      // Engine hum setup
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 60;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(engineGain);
      engineGain.connect(masterGain);
      engineOsc.start();

      // Siren setup
      sirenOsc = ctx.createOscillator();
      sirenOsc.type = 'square';
      sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain();
      sirenGain.gain.value = 0;
      sirenOsc.connect(sirenGain);
      sirenGain.connect(masterGain);
      sirenOsc.start();
    } catch (e) {
      console.warn('Audio init failed:', e);
    }
  }

  function setMuted(m) {
    muted = m;
    if (masterGain && ctx) {
      masterGain.gain.setValueAtTime(muted ? 0 : 0.25, ctx.currentTime);
    }
  }

  function setDriving(v) {
    drivingVal = Math.max(0, Math.min(1, v));
    if (!ctx || muted || !engineGain || !engineOsc) return;
    const now = ctx.currentTime;
    engineGain.gain.setValueAtTime(drivingVal * 0.15, now);
    engineOsc.frequency.setValueAtTime(60 + drivingVal * 140, now);
  }

  function siren(on) {
    if (!ctx || muted || !sirenGain || !sirenOsc) return;
    const now = ctx.currentTime;
    if (!on) {
      sirenGain.gain.setValueAtTime(0, now);
      sirenState = false;
      return;
    }
    sirenGain.gain.setValueAtTime(0.1, now);
  }

  function tick(dt) {
    if (!ctx || muted) return;
    const now = ctx.currentTime;

    // Siren oscillation
    if (sirenGain && sirenGain.gain.value > 0) {
      sirenTimer += dt;
      if (sirenTimer >= 0.4) {
        sirenTimer = 0;
        sirenState = !sirenState;
        sirenOsc.frequency.setValueAtTime(sirenState ? 950 : 700, now);
      }
    }

    // Simple procedural bassline loop (~100 BPM -> beat = 0.6s)
    musicTime += dt;
    if (musicTime >= 0.6) {
      musicTime = 0;
      playBassNote();
    }
  }

  function playBassNote() {
    if (!ctx || muted || !masterGain) return;
    const now = ctx.currentTime;
    const notes = [110, 130.81, 146.83, 164.81]; // A minor pentatonic-ish bass
    const note = notes[Math.floor(Math.random() * notes.length)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  function blip() {
    if (!ctx || muted || !masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  function crash() {
    if (!ctx || muted || !masterGain) return;
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(now);
  }

  function mission() {
    if (!ctx || muted || !masterGain) return;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((f, i) => {
      const time = now + i * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time);
      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(time);
      osc.stop(time + 0.15);
    });
  }

  return { ensure, setMuted, setDriving, siren, tick, blip, crash, mission };
}
