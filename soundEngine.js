/**
 * Motor de Audio Sintético Nativo (Web Audio API) y Reproductor de Bandas Sonoras para GeekVS
 * Cero dependencias externas - Generación procedural de audio táctico + Theme Player con Fade-in/Fade-out
 */

const STORAGE_SOUND_KEY = 'geekvs_sound_enabled';

/**
 * Reproductor dedicado para pistas de música/temas de personajes (CharacterThemePlayer).
 * Reutiliza una única instancia de HTML5 Audio con fundidos suaves para evitar colisiones.
 */
class CharacterThemePlayer {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.loop = true;
    this.audio.volume = 0.0;
    this.currentUrl = '';
    this.fadeInterval = null;
    this.targetVolume = 0.35;
    this.isPlaying = false;
  }

  /**
   * Inicia la reproducción con fundido de entrada suave (Fade-in: 0.0 a 0.35 en 250ms).
   * @param {string} audioUrl - URL del archivo de audio MP3/OGG.
   * @param {boolean} isEnabled - Estado global de audio del motor.
   */
  playCharacterTheme(audioUrl, isEnabled = true) {
    if (!isEnabled || !audioUrl) {
      this.stopCharacterTheme();
      return;
    }

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Si ya se está reproduciendo exactamente este clip, solo aseguramos el fade in
    if (this.isPlaying && this.currentUrl === audioUrl && !this.audio.paused) {
      this.fadeIn();
      return;
    }

    this.currentUrl = audioUrl;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = audioUrl;
    this.audio.volume = 0.0;

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          this.isPlaying = true;
          this.fadeIn();
        })
        .catch((e) => {
          // Manejo silencioso ante políticas de autoplay o errores de red
          this.isPlaying = false;
        });
    }
  }

  fadeIn() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    const stepDuration = 25; // 10 pasos = 250ms
    const volumeStep = this.targetVolume / 10;

    this.fadeInterval = setInterval(() => {
      if (this.audio.volume + volumeStep < this.targetVolume) {
        this.audio.volume = Math.min(this.audio.volume + volumeStep, 1);
      } else {
        this.audio.volume = this.targetVolume;
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, stepDuration);
  }

  /**
   * Ejecuta un fundido de salida suave (Fade-out: 0.35 a 0.0 en 200ms) y pausa el audio.
   */
  stopCharacterTheme() {
    if (!this.isPlaying && this.audio.paused) return;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    const stepDuration = 20; // 10 pasos = 200ms
    const currentVol = this.audio.volume || this.targetVolume;
    const volumeStep = currentVol / 10;

    this.fadeInterval = setInterval(() => {
      if (this.audio.volume - volumeStep > 0.01) {
        this.audio.volume = Math.max(this.audio.volume - volumeStep, 0);
      } else {
        this.audio.volume = 0.0;
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
        this.currentUrl = '';
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, stepDuration);
  }
}

// Estado interno del motor de audio sintético
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isEnabled = localStorage.getItem(STORAGE_SOUND_KEY) !== 'false'; // Por defecto ON
    this.themePlayer = new CharacterThemePlayer();
  }

  /**
   * Inicializa o reanuda el AudioContext en respuesta a una interacción del usuario.
   */
  initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Alterna el estado de audio (ON/OFF) y persiste en localStorage.
   * @returns {boolean} Nuevo estado de activación.
   */
  toggleAudio() {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem(STORAGE_SOUND_KEY, this.isEnabled.toString());
    if (this.isEnabled) {
      this.initContext();
      this.playClick();
    } else {
      this.stopCharacterTheme();
    }
    return this.isEnabled;
  }

  /**
   * Retorna si el audio está activo.
   */
  isAudioActive() {
    return this.isEnabled;
  }

  /**
   * Reproduce el tema musical contextual de un personaje con Fade-in.
   * @param {string} audioUrl - URL del clip MP3.
   */
  playCharacterTheme(audioUrl) {
    this.themePlayer.playCharacterTheme(audioUrl, this.isEnabled);
  }

  /**
   * Detiene el tema musical con Fade-out.
   */
  stopCharacterTheme() {
    this.themePlayer.stopCharacterTheme();
  }

  /**
   * 1. playClick: Bip táctico ultra-rápido y futurista para UI y botones.
   */
  playClick() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.04);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // Manejo silencioso
    }
  }

  /**
   * 2. playPowerCount: Tono scouter de frecuencia incremental para el conteo de poder.
   * @param {number} progressRatio - Valor entre 0 y 1 representando el progreso de la animación.
   */
  playPowerCount(progressRatio = 0.5) {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 350 + (progressRatio * 1050);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq + 40, now + 0.035);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {}
  }

  /**
   * 3. playCorrect: Acorde armónico ascendente de victoria / acierto.
   */
  playCorrect() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notas = [523.25, 659.25, 783.99, 1046.50];

      notas.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + (index * 0.06);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.02, startTime + 0.25);

        gain.gain.setValueAtTime(0.18, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } catch (e) {}
  }

  /**
   * 4. playGameOver: Tono descendente dramático con distorsión y bajo cyber.
   */
  playGameOver() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(260, now);
      osc1.frequency.exponentialRampToValueAtTime(55, now + 0.55);

      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(150, now + 0.55);

      osc1.connect(filter);
      filter.connect(gain1);
      gain1.connect(this.masterGain || this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.65);

      const oscSub = this.ctx.createOscillator();
      const gainSub = this.ctx.createGain();

      oscSub.type = 'sine';
      oscSub.frequency.setValueAtTime(90, now);
      oscSub.frequency.exponentialRampToValueAtTime(35, now + 0.4);

      gainSub.gain.setValueAtTime(0.25, now);
      gainSub.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      oscSub.connect(gainSub);
      gainSub.connect(this.masterGain || this.ctx.destination);

      oscSub.start(now);
      oscSub.stop(now + 0.5);
    } catch (e) {}
  }

  /**
   * 5. playNewRecord: Fanfarria electrónica corta y enérgica para nuevo récord.
   */
  playNewRecord() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const secuencia = [
        { f: 587.33, t: 0 },    // D5
        { f: 739.99, t: 0.07 }, // F#5
        { f: 880.00, t: 0.14 }, // A5
        { f: 1174.66, t: 0.22 },// D6
        { f: 1479.98, t: 0.32 } // F#6
      ];

      secuencia.forEach((item) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + item.t;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch (e) {}
  }

  /**
   * 6. playBattleSim: Efecto de colisión de energía y cálculo de duelo 1v1.
   */
  playBattleSim() {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.45);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch (e) {}
  }
}

// Exportamos instancia singleton
export const soundEngine = new SoundEngine();
