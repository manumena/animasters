/* global HTMLElement, matchMedia, performance, AudioContext, AbortController,
  fetch, Worker, URL, DOMException, document, requestAnimationFrame,
  cancelAnimationFrame, customElements */

import {
  BAR_COUNT,
  FFT_SIZE,
  bandDecibels,
  frequencyBands,
  normalizedLevel,
  rmsDecibels,
  storedLevels,
} from './audio-analysis.mjs';

const AUDIO_BASE = 'https://dszqiegiplfnrnovpqvn.supabase.co/storage/v1/object/public/animasters/';
const SONGS = [
  { title: 'Kick Back', anime: 'Chainsawman', path: 'Chainsawman/kick_back.mp3' },
  {
    title: 'Boku-tachi wa Tenshi datta',
    anime: 'Dragon Ball Z',
    path: 'Dragon%20Ball%20Z/Dragon%20Ball%20Z%20-%20Boku-tachi%20wa%20Tenshi%20datta.mp3',
  },
];

const MODES = [
  { id: 'live', title: 'Live spectrum', label: 'Bass → midrange → treble', note: 'Each bar follows a frequency band in the playing song.' },
  { id: 'loudness', title: 'Live loudness', label: 'Overall song energy', note: 'One measured loudness value moves a fixed bar profile.' },
  { id: 'stored', title: 'Precomputed spectrum', label: 'Recorded frequency frames · 20 fps', note: 'Reads analysis prepared before playback. It should resemble the live spectrum.' },
];

const style = `
  :host { display: block; color: #edf6f1; font: 15px/1.5 system-ui, sans-serif; }
  * { box-sizing: border-box; }
  main { max-width: 1080px; margin: auto; padding: 36px 28px; }
  h1, h2, p { margin: 0; }
  h1 { font-size: clamp(26px, 4vw, 36px); font-weight: 600; letter-spacing: -.035em; }
  h2 { font-size: 17px; font-weight: 600; }
  .eyebrow { color: #a7ecdb; font-size: 11px; font-weight: 600; letter-spacing: .17em; margin-bottom: 8px; }
  .intro { color: #b6cbc2; margin: 8px 0 24px; max-width: 700px; }
  .transport { padding: 22px; border: 1px solid #365048; border-radius: 16px; background: #192c26; }
  .top-controls { display: flex; flex-wrap: wrap; align-items: end; gap: 14px; }
  label { display: grid; gap: 6px; color: #c7d9d0; font-size: 13px; }
  .song-field { flex: 1; min-width: min(100%, 280px); }
  button, select, input { font: inherit; }
  button, select { border: 1px solid #50695e; border-radius: 9px; padding: 10px 14px; color: #edf6f1; background: #243d32; min-height: 44px; }
  select { max-width: 100%; width: 100%; }
  button { cursor: pointer; }
  button.primary { color: #122b22; background: #a7ecdb; border-color: #a7ecdb; min-width: 140px; font-weight: 600; }
  button:disabled { opacity: .5; cursor: wait; }
  input[type=range] { width: 100%; min-width: 0; accent-color: #a7ecdb; cursor: pointer; }
  input[type=checkbox] { accent-color: #a7ecdb; }
  .timeline { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; margin-top: 20px; }
  .time { min-width: 92px; text-align: right; font-variant-numeric: tabular-nums; color: #d6e5dd; font-size: 13px; }
  .adjustments { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 18px; }
  .label-row { display: flex; justify-content: space-between; gap: 12px; }
  output { font-variant-numeric: tabular-nums; color: #edf6f1; }
  .status { margin-top: 12px; color: #b6cbc2; font-size: 13px; min-height: 20px; }
  .status.error { color: #ffb5a5; }
  .view-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin: 22px 0 16px; }
  .view-controls label { display: flex; align-items: center; gap: 10px; }
  .view-controls select { width: auto; }
  .modes { display: grid; gap: 14px; }
  .mode { background: #192c26; border: 1px solid #365048; border-radius: 16px; padding: 18px 22px; }
  .mode[hidden] { display: none; }
  .mode-heading { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 5px 16px; }
  .mode-label, .mode-note { color: #b6cbc2; font-size: 12px; }
  .spectrum { height: 114px; display: flex; gap: 5px; align-items: center; justify-content: center; overflow: hidden; }
  .spectrum span { flex: 1; max-width: 15px; height: 92px; background: #a7ecdb; border-radius: 7px; transform: scaleY(.035); }
  .footer { color: #a7bfb3; font-size: 12px; margin-top: 18px; }
  @media (max-width: 560px) {
    main { padding: 24px 14px; }
    .transport, .mode { padding: 16px; }
    .adjustments { grid-template-columns: 1fr; gap: 14px; }
    .song-field { flex-basis: 100%; }
    .spectrum { gap: 3px; }
    .view-controls { align-items: start; }
    .view-controls label { flex-wrap: wrap; }
    .timeline { gap: 8px; }
  }
`;

function formatTime(seconds) {
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}

/** A standalone comparison fixture. It shares one audio source across every view
 * and never creates a room or alters the production playback controller. */
class SongBarComparison extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <main>
        <p class="eyebrow">ANIMASTERS · PLAYBACK STUDY</p>
        <h1>One song. Three ways to see it.</h1>
        <p class="intro">Play a song and compare the same moment across all three approaches, or focus on one.</p>
        <section class="transport" aria-label="Shared playback controls">
          <div class="top-controls">
            <label class="song-field">Song
              <select data-control="song">${SONGS.map((song, index) => `<option value="${index}">${song.title} · ${song.anime}</option>`).join('')}</select>
            </label>
            <button type="button" class="primary" data-control="play">Load & play</button>
            <button type="button" data-control="restart" disabled>Restart</button>
          </div>
          <div class="timeline">
            <input type="range" data-control="seek" aria-label="Song position" min="0" max="1" step="0.05" value="0" disabled />
            <span class="time" data-view="time">0:00 / 0:00</span>
          </div>
          <div class="adjustments">
            <label><span class="label-row">Listening volume <output data-view="volume">40%</output></span>
              <input type="range" data-control="volume" min="0" max="100" step="1" value="40" />
            </label>
            <label><span class="label-row">Falling time <output data-view="fall">280 ms</output></span>
              <input type="range" data-control="fall" min="60" max="650" step="10" value="280" />
            </label>
            <label><span class="label-row">Visual sensitivity <output data-view="sensitivity">0 dB</output></span>
              <input type="range" data-control="sensitivity" min="-15" max="15" step="1" value="0" />
            </label>
          </div>
          <p class="status" role="status" aria-live="polite">Ready. Audio starts only when you press play.</p>
        </section>
        <div class="view-controls">
          <label>Compare <select data-control="view"><option value="all">All three</option>${MODES.map(mode => `<option value="${mode.id}">${mode.title}</option>`).join('')}</select></label>
          <label><input data-control="motion" type="checkbox" /> Animate bars</label>
        </div>
        <div class="modes">
          ${MODES.map(mode => `
            <section class="mode" data-mode="${mode.id}" aria-label="${mode.title}">
              <div class="mode-heading"><h2>${mode.title}</h2><span class="mode-label">${mode.label}</span></div>
              <div class="spectrum" role="img" aria-label="${mode.title} audio visualization">${'<span></span>'.repeat(BAR_COUNT)}</div>
              <p class="mode-note">${mode.note}</p>
            </section>
          `).join('')}
        </div>
        <p class="footer">Real catalog recordings · bar heights follow the song, independently of listening volume · no random movement</p>
      </main>
    `;

    this.cache = new Map();
    this.context = undefined;
    this.source = undefined;
    this.track = undefined;
    this.generation = (this.generation || 0) + 1;
    this.offset = 0;
    this.playing = false;
    this.loading = false;
    this.motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.control('motion').checked = !this.motionQuery.matches;
    this.onMotionPreference = event => {
      this.control('motion').checked = !event.matches;
      this.resetBars();
    };
    this.motionQuery.addEventListener('change', this.onMotionPreference);

    this.bars = MODES.map(mode => [...this.shadowRoot.querySelectorAll(`[data-mode="${mode.id}"] .spectrum span`)]);
    this.resetBars();
    this.bindControls();
    this.lastPaint = performance.now();
    this.animate(this.lastPaint);
  }

  control(name) { return this.shadowRoot.querySelector(`[data-control="${name}"]`); }
  view(name) { return this.shadowRoot.querySelector(`[data-view="${name}"]`); }

  status(message, error = false) {
    const status = this.shadowRoot.querySelector('.status');
    status.textContent = message;
    status.classList.toggle('error', error);
    status.setAttribute('role', error ? 'alert' : 'status');
  }

  bindControls() {
    this.control('play').addEventListener('click', () => { void this.togglePlayback(); });
    this.control('restart').addEventListener('click', () => this.seek(0));
    this.control('seek').addEventListener('input', event => this.seek(Number(event.target.value)));
    this.control('song').addEventListener('change', () => {
      this.cancelLoad();
      this.pause();
      this.track = undefined;
      this.offset = 0;
      this.updateTransport();
      this.status('Ready. Press play to load this song.');
      this.resetBars();
    });
    this.control('volume').addEventListener('input', event => {
      const volume = Number(event.target.value);
      this.view('volume').textContent = `${volume}%`;
      if (this.gain) this.gain.gain.setTargetAtTime(volume / 100, this.context.currentTime, 0.015);
    });
    this.control('fall').addEventListener('input', event => {
      this.view('fall').textContent = `${event.target.value} ms`;
    });
    this.control('sensitivity').addEventListener('input', event => {
      const value = Number(event.target.value);
      this.view('sensitivity').textContent = `${value > 0 ? '+' : ''}${value} dB`;
    });
    this.control('view').addEventListener('change', event => {
      for (const section of this.shadowRoot.querySelectorAll('[data-mode]')) {
        section.hidden = event.target.value !== 'all' && section.dataset.mode !== event.target.value;
      }
    });
    this.control('motion').addEventListener('change', () => this.resetBars());
  }

  audioContext() {
    if (this.context) return this.context;
    this.context = new AudioContext();
    this.gain = this.context.createGain();
    this.gain.gain.value = Number(this.control('volume').value) / 100;
    this.gain.connect(this.context.destination);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = FFT_SIZE;
    this.analyser.smoothingTimeConstant = 0;
    this.frequencies = new Float32Array(this.analyser.frequencyBinCount);
    this.waveform = new Float32Array(FFT_SIZE);
    this.bands = frequencyBands(this.context.sampleRate);
    return this.context;
  }

  async togglePlayback() {
    if (this.playing) {
      this.pause();
      return;
    }

    try {
      // Resume in the click, before download and analysis, to satisfy autoplay rules.
      const context = this.audioContext();
      await context.resume();
      if (context.state !== 'running') throw new Error('Audio is blocked. Press play to try again.');
      if (this.loading) return;
      const track = this.track || await this.loadSong();
      if (track && track === this.track && this.isConnected) this.play();
    } catch (error) {
      if (error.name !== 'AbortError' && this.isConnected) this.status(error.message, true);
    }
  }

  async loadSong() {
    const songIndex = Number(this.control('song').value);
    if (this.cache.has(songIndex)) {
      this.track = this.cache.get(songIndex);
      return this.track;
    }

    const generation = ++this.generation;
    this.loading = true;
    this.request = new AbortController();
    this.updateTransport();
    this.status('Loading song…');

    try {
      const response = await fetch(AUDIO_BASE + SONGS[songIndex].path, { signal: this.request.signal });
      if (!response.ok) throw new Error('The song could not be loaded. Press play to retry.');
      const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
      if (generation !== this.generation) return;

      this.status('Preparing recorded frequency frames…');
      const frames = await this.prepareFrames(buffer, generation);
      if (generation !== this.generation) return;

      this.track = { buffer, frames };
      this.cache.set(songIndex, this.track);
      this.status(`Ready · ${frames.byteLength.toLocaleString()} bytes of precomputed frequency data`);
      return this.track;
    } finally {
      if (generation === this.generation) {
        this.loading = false;
        this.updateTransport();
      }
    }
  }

  async prepareFrames(buffer, generation) {
    const mono = new Float32Array(buffer.length);
    // Web Audio's analyser downmixes stereo to mono; the stored path does the same.
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const samples = buffer.getChannelData(channel);
      for (let index = 0; index < samples.length; index++) {
        mono[index] += samples[index] / buffer.numberOfChannels;
      }
    }

    const workerUrl = new URL('./analysis-worker.mjs', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });
    this.worker = worker;
    try {
      return await new Promise((resolve, reject) => {
        this.rejectAnalysis = reject;
        worker.onmessage = event => {
          if (event.data.progress !== undefined) {
            if (generation === this.generation) this.status(`Preparing recorded frequency frames… ${Math.round(event.data.progress * 100)}%`);
            return;
          }
          if (event.data.error) reject(new Error(event.data.error));
          else resolve(event.data.frames);
        };
        worker.onerror = () => reject(new Error('Song analysis failed. Press play to retry.'));
        worker.postMessage({ samples: mono, sampleRate: buffer.sampleRate }, [mono.buffer]);
      });
    } finally {
      worker.terminate();
      URL.revokeObjectURL(String(workerUrl));
      if (this.worker === worker) {
        this.worker = undefined;
        this.rejectAnalysis = undefined;
      }
    }
  }

  cancelLoad() {
    this.generation++;
    this.request?.abort();
    this.worker?.terminate();
    this.rejectAnalysis?.(new DOMException('Song changed', 'AbortError'));
    this.loading = false;
  }

  position() {
    if (!this.track) return 0;
    const elapsed = this.playing ? this.context.currentTime - this.startedAt : 0;
    return Math.min(this.track.buffer.duration, this.offset + elapsed);
  }

  play() {
    if (!this.track) return;
    if (this.offset >= this.track.buffer.duration) this.offset = 0;
    const source = this.context.createBufferSource();
    source.buffer = this.track.buffer;
    source.connect(this.gain);
    // A separate analysis branch avoids a duplicate route to the speakers.
    source.connect(this.analyser);
    source.start(0, this.offset);
    this.startedAt = this.context.currentTime;
    this.source = source;
    this.playing = true;
    source.onended = () => {
      source.disconnect();
      if (this.source !== source) return;
      this.source = undefined;
      this.playing = false;
      this.offset = this.track.buffer.duration;
      this.status('Song ended. Press play or restart to listen again.');
      this.updateTransport();
    };
    this.status(`Playing · ${SONGS[Number(this.control('song').value)].title}`);
    this.updateTransport();
  }

  pause() {
    this.offset = this.position();
    this.playing = false;
    const source = this.source;
    this.source = undefined;
    source?.stop();
    source?.disconnect();
    this.status('Paused.');
    this.updateTransport();
  }

  seek(seconds) {
    if (!this.track) return;
    const wasPlaying = this.playing;
    this.pause();
    this.offset = Math.max(0, Math.min(seconds, this.track.buffer.duration));
    this.resetBars();
    if (wasPlaying && this.offset < this.track.buffer.duration) this.play();
    this.updateTransport();
  }

  updateTransport() {
    this.control('play').disabled = this.loading;
    this.control('play').textContent = this.loading ? 'Preparing…' : this.playing ? 'Pause' : this.track ? 'Play' : 'Load & play';
    this.control('seek').disabled = !this.track;
    this.control('restart').disabled = !this.track;
    this.control('seek').max = this.track?.buffer.duration || 1;
    this.paintPosition();
  }

  paintPosition() {
    const position = this.position();
    this.control('seek').value = position;
    this.view('time').textContent = `${formatTime(position)} / ${formatTime(this.track?.buffer.duration || 0)}`;
  }

  resetBars() {
    this.levels = MODES.map(() => Array(BAR_COUNT).fill(0));
    for (const bars of this.bars || []) {
      for (const bar of bars) bar.style.transform = 'scaleY(.035)';
    }
  }

  targets() {
    if (!this.playing || this.context.state !== 'running') return MODES.map(() => Array(BAR_COUNT).fill(0));
    const sensitivity = Number(this.control('sensitivity').value);
    this.analyser.getFloatFrequencyData(this.frequencies);
    this.analyser.getFloatTimeDomainData(this.waveform);
    const live = bandDecibels(this.frequencies, this.bands).map(value => normalizedLevel(value, sensitivity));
    const loudness = normalizedLevel(rmsDecibels(this.waveform), sensitivity, -55, -8);
    const envelope = Array.from({ length: BAR_COUNT }, (_, index) => {
      return loudness * (0.35 + 0.65 * Math.sin((index + 1) / (BAR_COUNT + 1) * Math.PI));
    });
    const stored = storedLevels(this.track.frames, this.position(), sensitivity);
    return [live, envelope, stored];
  }

  animate(now) {
    const elapsed = Math.min(100, now - this.lastPaint);
    this.lastPaint = now;
    if (!document.hidden) {
      this.paintPosition();
      if (this.control('motion').checked) {
        const targets = this.targets();
        const fall = Number(this.control('fall').value);
        for (let mode = 0; mode < MODES.length; mode++) {
          for (let index = 0; index < BAR_COUNT; index++) {
            const current = this.levels[mode][index];
            const target = targets[mode][index];
            const response = target > current ? 22 : fall;
            const next = current + (target - current) * (1 - Math.exp(-elapsed / response));
            this.levels[mode][index] = next;
            this.bars[mode][index].style.transform = `scaleY(${0.035 + next * 0.965})`;
          }
        }
      }
    }
    this.animation = requestAnimationFrame(time => this.animate(time));
  }

  disconnectedCallback() {
    this.cancelLoad();
    this.pause();
    cancelAnimationFrame(this.animation);
    this.motionQuery.removeEventListener('change', this.onMotionPreference);
    void this.context?.close();
    this.cache.clear();
  }
}

customElements.define('song-bar-comparison', SongBarComparison);
