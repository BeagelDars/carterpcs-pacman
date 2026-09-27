// Authentic 1980 Pac-Man Audio Engine
// Non-overlapping, crystal-clear arcade audio playback

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.buffers = {};
    this.loaded = false;
    this.isChomping = false;
    this.chompEndTime = 0;
    this.chompSource = null;
    this.currentVoice = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.loadAudioFiles();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  async loadAudioFiles() {
    if (this.loaded) return;
    const files = {
      beginning: './sounds/pacman_beginning.wav',
      chomp: './sounds/pacman_chomp.wav',
      death: './sounds/pacman_death.wav',
      eatghost: './sounds/pacman_eatghost.wav',
      eatfruit: './sounds/pacman_eatfruit.wav',
      intermission: './sounds/pacman_intermission.wav'
    };

    for (const [key, path] of Object.entries(files)) {
      try {
        const res = await fetch(path);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          this.buffers[key] = await this.ctx.decodeAudioData(ab);
        }
      } catch (e) {
        console.warn('Could not load sound:', path, e);
      }
    }
    this.loaded = true;
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.5, this.ctx.currentTime);
    }
  }

  playBuffer(key, volume = 0.5) {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.buffers[key]) return;

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers[key];

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
    return source;
  }

  playStartJingle() {
    this.stopChomp();
    return this.playBuffer('beginning', 0.6);
  }

  playChomp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx || !this.buffers['chomp']) return;

    const now = this.ctx.currentTime;

    // PREVENT OVERLAP: If a chomp is currently playing, do NOT stack another sound!
    if (this.isChomping && now < this.chompEndTime) {
      return;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.buffers['chomp'];

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);

    source.connect(gain);
    gain.connect(this.masterGain);

    source.start(now);
    this.chompSource = source;
    this.isChomping = true;
    // Allow next chomp when current one completes
    this.chompEndTime = now + source.buffer.duration * 0.9;

    source.onended = () => {
      this.isChomping = false;
    };
  }

  stopChomp() {
    if (this.chompSource) {
      try {
        this.chompSource.stop();
      } catch (e) {}
      this.chompSource = null;
    }
    this.isChomping = false;
    this.chompEndTime = 0;
  }

  playDeath() {
    this.stopChomp();
    return this.playBuffer('death', 0.6);
  }

  playEatGhost() {
    this.stopChomp();
    return this.playBuffer('eatghost', 0.7);
  }

  playEatFruit() {
    return this.playBuffer('eatfruit', 0.6);
  }

  playWinJingle() {
    this.stopChomp();
    return this.playBuffer('intermission', 0.6);
  }
}

export const soundEngine = new SoundEngine();
