import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { PerformanceUtils } from './PerformanceMonitor';

/**
 * GothicMusicGenerator - Компонент для создания готической музыки кодом
 * Создает атмосферную готическую музыку с использованием Tone.js
 */

// Error boundary component to catch audio errors
class AudioErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Audio system error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="audio-error" style={{ padding: '10px', color: '#E8D5B7' }}>
          <p>🎵 Audio temporarily unavailable</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

class GothicMusicSystem {
  constructor() {
    this.isPlaying = false;
    this.currentComposition = null;
    this.currentStyle = null;
    this.instruments = {};
    this.effects = {};
    this.isInitialized = false;
    this.initError = null;
    this.activePatterns = [];
    this.audioContext = null;
    this.isLowPerformanceMode = this.detectLowPerformance();
    
    try {
      this.masterVolume = new Tone.Volume(-12).toDestination();
      
      // Готические тональности (минорные гаммы)
      this.gothicScales = {
        darkMinor: ['C3', 'D3', 'Eb3', 'F3', 'G3', 'Ab3', 'Bb3', 'C4'],
        harmonic: ['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G#3', 'A3'],
        dorian: ['D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4'],
        phrygian: ['E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4']
      };
      
      this.initializeInstruments();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Gothic Music System:', error);
      this.initError = error;
      this.isInitialized = false;
    }
  }
  
  detectLowPerformance() {
    // Simple performance detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return true; // No WebGL = low performance
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    
    // Check for mobile or low-end devices
    if (/mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      return true;
    }
    
    // Check available memory (if supported)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      return true;
    }
    
    return false;
  }

  initializeInstruments() {
    try {
      // Reduce polyphony for low-performance devices
      const maxPolyphony = this.isLowPerformanceMode ? 4 : 8;
      const effectsWet = this.isLowPerformanceMode ? 0.2 : 0.6;
      
      // Главный синтезатор для мелодии (орган-стайл)
      this.instruments.lead = new Tone.PolySynth({
        maxPolyphony: maxPolyphony,
        voice: Tone.Synth,
        options: {
          oscillator: {
            type: 'sawtooth'
          },
          envelope: {
            attack: 0.3,
            decay: 0.1,
            sustain: 0.8,
            release: 2.0
          },
          filter: {
            frequency: 800,
            type: 'lowpass'
          }
        }
      });

      // Басовый синтезатор
      this.instruments.bass = new Tone.MonoSynth({
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.1,
          decay: 0.3,
          sustain: 0.5,
          release: 1.5
        },
        filter: {
          frequency: 300,
          type: 'lowpass'
        }
      });

      // Атмосферные пады (reduced polyphony)
      this.instruments.pad = new Tone.PolySynth({
        maxPolyphony: Math.max(2, maxPolyphony / 2),
        voice: Tone.Synth,
        options: {
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 2.0,
            decay: 1.0,
            sustain: 0.9,
            release: 4.0
          }
        }
      });

      // Ударные (готический стиль)
      this.instruments.drums = new Tone.MembraneSynth({
        envelope: {
          attack: 0.02,
          decay: 0.3,
          sustain: 0.1,
          release: 1.2
        }
      });

      // Эффекты (reduced for performance)
      if (!this.isLowPerformanceMode) {
        this.effects.reverb = new Tone.Reverb({
          decay: 4,
          wet: effectsWet
        });

        this.effects.delay = new Tone.PingPongDelay({
          delayTime: '8n',
          feedback: 0.3,
          wet: 0.3
        });

        this.effects.chorus = new Tone.Chorus({
          frequency: 0.5,
          delayTime: 8,
          depth: 0.4,
          wet: 0.3
        });

        this.effects.distortion = new Tone.Distortion({
          distortion: 0.1,
          wet: 0.2
        });

        // Подключение эффектов
        this.instruments.lead.connect(this.effects.reverb);
        this.effects.reverb.connect(this.effects.delay);
        this.effects.delay.connect(this.masterVolume);

        this.instruments.bass.connect(this.effects.distortion);
        this.effects.distortion.connect(this.masterVolume);

        this.instruments.pad.connect(this.effects.chorus);
        this.effects.chorus.connect(this.effects.reverb);
      } else {
        // Low performance mode - direct connections
        this.instruments.lead.connect(this.masterVolume);
        this.instruments.bass.connect(this.masterVolume);
        this.instruments.pad.connect(this.masterVolume);
      }

      this.instruments.drums.connect(this.masterVolume);
    } catch (error) {
      console.error('Failed to initialize instruments:', error);
      throw error;
    }
  }

  // Генерация готической мелодии (optimized)
  generateGothicMelody(scale = 'darkMinor', length = 16) {
    // Reduce length for low performance devices
    const actualLength = this.isLowPerformanceMode ? Math.min(length, 8) : length;
    const scaleNotes = this.gothicScales[scale];
    const melody = [];
    
    // Готические интервалы (предпочитаем минорные терции, кварты, квинты)
    const gothicIntervals = [-7, -5, -3, -2, 0, 2, 3, 5, 7];
    
    let currentNoteIndex = 0;
    
    for (let i = 0; i < actualLength; i++) {
      // Higher chance of pauses in low performance mode
      const noteChance = this.isLowPerformanceMode ? 0.6 : 0.8;
      
      if (Math.random() < noteChance) {
        const interval = gothicIntervals[Math.floor(Math.random() * gothicIntervals.length)];
        currentNoteIndex = Math.max(0, Math.min(scaleNotes.length - 1, currentNoteIndex + interval));
        
        melody.push({
          note: scaleNotes[currentNoteIndex],
          duration: this.getGothicNoteDuration(),
          velocity: Math.random() * 0.3 + 0.4 // 0.4 - 0.7
        });
      } else {
        melody.push({ note: null, duration: '8n' }); // Пауза
      }
    }
    
    return melody;
  }

  getGothicNoteDuration() {
    const durations = ['4n', '4n', '8n', '8n', '2n', '8n.'];
    return durations[Math.floor(Math.random() * durations.length)];
  }

  // Генерация басовой линии
  generateBassLine(scale = 'darkMinor', length = 8) {
    const scaleNotes = this.gothicScales[scale].map(note => 
      note.replace(/\d/, (num) => String(parseInt(num) - 1))
    );
    
    const bassLine = [];
    const bassPattern = [0, 0, 4, 4, 2, 2, 6, 0]; // Готический басовый паттерн
    
    for (let i = 0; i < length; i++) {
      const noteIndex = bassPattern[i % bassPattern.length];
      bassLine.push({
        note: scaleNotes[noteIndex],
        duration: '4n',
        velocity: 0.8
      });
    }
    
    return bassLine;
  }

  // Создание атмосферных падов
  generateAtmosphericPads(scale = 'darkMinor') {
    const scaleNotes = this.gothicScales[scale];
    const chords = [
      [scaleNotes[0], scaleNotes[2], scaleNotes[4]], // i
      [scaleNotes[1], scaleNotes[3], scaleNotes[5]], // ii°
      [scaleNotes[2], scaleNotes[4], scaleNotes[6]], // III
      [scaleNotes[3], scaleNotes[5], scaleNotes[0]], // iv
      [scaleNotes[4], scaleNotes[6], scaleNotes[1]], // v
      [scaleNotes[5], scaleNotes[0], scaleNotes[2]], // VI
      [scaleNotes[6], scaleNotes[1], scaleNotes[3]]  // VII
    ];
    
    return chords;
  }

  // Готический ритм-паттерн
  generateDrumPattern() {
    return [
      { time: '0:0:0', note: 'C2', velocity: 0.9 },
      { time: '0:1:0', note: 'C2', velocity: 0.3 },
      { time: '0:2:0', note: 'C2', velocity: 0.7 },
      { time: '0:3:2', note: 'C2', velocity: 0.4 },
    ];
  }

  async startComposition(type = 'ambient') {
    if (this.isPlaying) return;
    
    // Check if system is properly initialized
    if (!this.isInitialized || this.initError) {
      console.error('Cannot start composition: system not initialized', this.initError);
      return false;
    }
    
    try {
      await Tone.start();
      this.isPlaying = true;
      this.activePatterns = [];
      this.currentStyle = type;
      
      if (type === 'ambient') {
        this.playAmbientGothic();
      } else if (type === 'rhythmic') {
        this.playRhythmicGothic();
      } else if (type === 'dark') {
        this.playDarkAtmosphere();
      } else if (type === 'cathedral') {
        this.playCathedralOrgan();
      } else if (type === 'ritual') {
        this.playRitualPercussion();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to start composition:', error);
      this.isPlaying = false;
      return false;
    }
  }

  playAmbientGothic() {
    const scale = 'harmonic';
    const melodyLength = this.isLowPerformanceMode ? 16 : 32;
    const melody = this.generateGothicMelody(scale, melodyLength);
    const chords = this.generateAtmosphericPads(scale);
    
    // Store active patterns for transitions
    this.activePatterns = [];
    
    // Играем мелодию
    let melodyTime = 0;
    melody.forEach((note, index) => {
      if (note.note) {
        Tone.Transport.schedule((time) => {
          this.instruments.lead.triggerAttackRelease(
            note.note, 
            note.duration, 
            time, 
            note.velocity
          );
        }, melodyTime);
      }
      melodyTime += Tone.Time(note.duration).toSeconds();
    });

    // Играем атмосферные аккорды (less frequent on low-end devices)
    const chordInterval = this.isLowPerformanceMode ? 8 : 4;
    chords.forEach((chord, index) => {
      const time = index * chordInterval;
      Tone.Transport.schedule((scheduleTime) => {
        this.instruments.pad.triggerAttackRelease(
          chord, 
          '1m', 
          scheduleTime, 
          0.3
        );
      }, time);
    });

    // Add background ambience (only on high-performance devices)
    if (!this.isLowPerformanceMode) {
      const ambienceLoop = new Tone.Loop((time) => {
        if (Math.random() < 0.3) {
          const note = this.gothicScales[scale][Math.floor(Math.random() * this.gothicScales[scale].length)];
          this.instruments.pad.triggerAttackRelease(
            Tone.Frequency(note).transpose(12), 
            '4n', 
            time, 
            0.1
          );
        }
      }, '2m').start(0);
      
      this.activePatterns.push(ambienceLoop);
    }

    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }

  playRhythmicGothic() {
    const scale = 'dorian';
    const melody = this.generateGothicMelody(scale, 16);
    const bassLine = this.generateBassLine(scale, 16);
    const drumPattern = this.generateDrumPattern();
    
    // Store active patterns for transitions
    this.activePatterns = [];
    
    // Настройка лупов
    const melodyLoop = new Tone.Sequence((time, note) => {
      if (note && note.note) {
        this.instruments.lead.triggerAttackRelease(
          note.note, 
          note.duration, 
          time, 
          note.velocity
        );
      }
    }, melody, '8n').start(0);

    const bassLoop = new Tone.Sequence((time, note) => {
      this.instruments.bass.triggerAttackRelease(
        note.note, 
        note.duration, 
        time, 
        note.velocity
      );
    }, bassLine, '4n').start(0);

    const drumLoop = new Tone.Sequence((time, drum) => {
      this.instruments.drums.triggerAttackRelease(
        drum.note, 
        '8n', 
        time, 
        drum.velocity
      );
    }, drumPattern, '4n').start(0);
    
    this.activePatterns.push(melodyLoop, bassLoop, drumLoop);

    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }

  playDarkAtmosphere() {
    const scale = 'phrygian';
    const lowNotes = this.gothicScales[scale].map(note => 
      note.replace(/\d/, '1')
    );
    
    // Store active patterns for transitions
    this.activePatterns = [];
    
    // Очень медленная, жуткая атмосфера
    lowNotes.forEach((note, index) => {
      Tone.Transport.schedule((time) => {
        this.instruments.pad.triggerAttackRelease(
          [note, Tone.Frequency(note).transpose(3), Tone.Frequency(note).transpose(7)], 
          '2m', 
          time, 
          0.2
        );
        
        // Добавляем случайные высокие ноты для жуткости
        if (Math.random() < 0.3) {
          this.instruments.lead.triggerAttackRelease(
            Tone.Frequency(note).transpose(24), 
            '1n', 
            time + Math.random() * 4, 
            0.1
          );
        }
      }, index * 8);
    });
    
    // Add creepy background noises
    const creepyLoop = new Tone.Loop((time) => {
      if (Math.random() < 0.15) {
        const noteIndex = Math.floor(Math.random() * lowNotes.length);
        const note = lowNotes[noteIndex];
        const transpose = Math.random() < 0.5 ? 36 : 24;
        
        this.instruments.lead.triggerAttackRelease(
          Tone.Frequency(note).transpose(transpose), 
          '16n', 
          time, 
          0.05
        );
      }
    }, '4m').start(0);
    
    this.activePatterns.push(creepyLoop);

    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }

  playCathedralOrgan() {
    const scale = 'harmonic';
    const chords = this.generateAtmosphericPads(scale);
    
    // Store active patterns for transitions
    this.activePatterns = [];
    
    // Create a cathedral organ pattern
    const organLoop = new Tone.Loop((time) => {
      // Choose a random chord
      const chord = chords[Math.floor(Math.random() * chords.length)];
      
      // Play deep organ sound
      this.instruments.pad.set({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.1, release: 4.0 }
      });
      
      // Play a cathedral-style progression
      this.instruments.pad.triggerAttackRelease(chord, '2n', time, 0.2);
      
      // Add high register for pipe organ effect
      const highNote = chord[Math.floor(Math.random() * chord.length)];
      setTimeout(() => {
        this.instruments.lead.triggerAttackRelease(
          Tone.Frequency(highNote).transpose(12),
          '2n',
          time + 0.1,
          0.1
        );
      }, 50);
      
      // Add bass note
      const bassNote = chord[0].replace(/\d/, (num) => String(parseInt(num) - 1));
      this.instruments.bass.triggerAttackRelease(
        bassNote,
        '1n',
        time,
        0.3
      );
      
    }, '2m').start(0);
    
    // Add cathedral bell sounds occasionally
    const bellLoop = new Tone.Loop((time) => {
      if (Math.random() < 0.3) {
        const scaleNotes = this.gothicScales[scale];
        const note = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
        
        // Create bell sound
        this.instruments.lead.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 3.0, sustain: 0, release: 5.0 }
        });
        
        // Play bell
        this.instruments.lead.triggerAttackRelease(
          Tone.Frequency(note).transpose(24),
          '8n',
          time,
          0.2
        );
      }
    }, '4m').start(0);
    
    this.activePatterns.push(organLoop, bellLoop);
    
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }
  
  playRitualPercussion() {
    const scale = 'phrygian';
    
    // Store active patterns for transitions
    this.activePatterns = [];
    
    // Create ritual drum pattern
    const drumPattern = [
      { time: '0:0:0', note: 'C2', velocity: 0.9 },
      { time: '0:0:3', note: 'C2', velocity: 0.5 },
      { time: '0:1:0', note: 'G1', velocity: 0.7 },
      { time: '0:2:0', note: 'C2', velocity: 0.9 },
      { time: '0:3:0', note: 'G1', velocity: 0.7 },
      { time: '0:3:3', note: 'C2', velocity: 0.5 },
    ];
    
    // Create ritual chant pattern
    const chantNotes = this.gothicScales[scale].slice(0, 3); // Use first 3 notes
    
    // Slow tribal drums
    const drumLoop = new Tone.Sequence((time, drum) => {
      this.instruments.drums.triggerAttackRelease(
        drum.note,
        '8n',
        time,
        drum.velocity
      );
    }, drumPattern, '4n').start(0);
    
    // Ritual chanting
    const chantLoop = new Tone.Loop((time) => {
      // Set pad to vocal-like sound
      this.instruments.pad.set({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.3, release: 2.0 }
      });
      
      // Play chant chord
      const chordNotes = [
        chantNotes[Math.floor(Math.random() * chantNotes.length)],
        chantNotes[Math.floor(Math.random() * chantNotes.length)]
      ];
      
      this.instruments.pad.triggerAttackRelease(
        chordNotes,
        '2n',
        time,
        0.15
      );
    }, '2m').start(0);
    
    // Occasional ritual sounds
    const ritualLoop = new Tone.Loop((time) => {
      if (Math.random() < 0.2) {
        // Create shaker/rattle sound
        const note = 'A5';
        this.instruments.lead.triggerAttackRelease(
          note,
          '16n',
          time,
          0.1
        );
      }
    }, '8n').start(0);
    
    this.activePatterns.push(drumLoop, chantLoop, ritualLoop);
    
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
    }
  }

  stop() {
    this.isPlaying = false;
    
    // Stop all active patterns
    if (this.activePatterns && this.activePatterns.length > 0) {
      this.activePatterns.forEach(pattern => {
        if (pattern && typeof pattern.stop === 'function') {
          pattern.stop();
        }
      });
      this.activePatterns = [];
    }
    
    // Release all notes that might be playing
    Object.values(this.instruments).forEach(instrument => {
      if (instrument && typeof instrument.releaseAll === 'function') {
        instrument.releaseAll();
      }
    });
    
    // Stop and cancel all scheduled events
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    // Clear Tone.js internal state
    Tone.context.rawContext.resume();
  }

  setVolume(volume) {
    this.masterVolume.volume.value = Tone.gainToDb(volume);
  }

  async transitionToStyle(newStyle) {
    // If not currently playing, just update the style
    if (!this.isPlaying) return;
    
    // If already playing this style, do nothing
    if (this.currentStyle === newStyle) return;
    
    // Prepare crossfade
    const currentVolume = Tone.gainToDb(this.masterVolume.volume.value);
    
    // Gradually lower the volume
    await Tone.Destination.volume.rampTo(currentVolume - 20, 0.5);
    
    // Stop the current patterns but don't reset Transport
    if (this.activePatterns) {
      this.activePatterns.forEach(pattern => pattern.stop());
    }
    
    // Clear scheduled events without stopping transport
    Tone.Transport.cancel();
    
    // Update current style
    this.currentStyle = newStyle;
    
    // Start the new style
    if (newStyle === 'ambient') {
      this.playAmbientGothic();
    } else if (newStyle === 'rhythmic') {
      this.playRhythmicGothic();
    } else if (newStyle === 'dark') {
      this.playDarkAtmosphere();
    } else if (newStyle === 'cathedral') {
      this.playCathedralOrgan();
    } else if (newStyle === 'ritual') {
      this.playRitualPercussion();
    }
    
    // Gradually restore volume
    await Tone.Destination.volume.rampTo(currentVolume, 0.8);
  }
  
  dispose() {
    this.stop();
    Object.values(this.instruments).forEach(instrument => instrument.dispose());
    Object.values(this.effects).forEach(effect => effect.dispose());
    this.masterVolume.dispose();
  }
}

const GothicMusicGenerator = React.memo(({ isPlaying, volume = 0.3, style = 'ambient', seed = null }) => {
  const musicSystemRef = useRef(null);
  const [currentStyle, setCurrentStyle] = useState(style);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLagging, setIsLagging] = useState(false);
  
  // Detect performance issues
  const performanceTier = PerformanceUtils.getDevicePerformanceTier();
  const prefersReducedMotion = PerformanceUtils.prefersReducedMotion();
  
  // Simple FPS monitoring for this component
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  useEffect(() => {
    const checkPerformance = () => {
      const currentTime = performance.now();
      const delta = currentTime - lastTimeRef.current;
      
      if (delta >= 2000) { // Check every 2 seconds
        const fps = (frameCountRef.current * 1000) / delta;
        setIsLagging(fps < 20); // Consider lagging if below 20 FPS
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      frameCountRef.current++;
    };
    
    const interval = setInterval(checkPerformance, 100);
    return () => clearInterval(interval);
  }, []);

  // Initialize the music system with better cleanup
  useEffect(() => {
    let isMounted = true;
    
    // Optimized initialization
    const initSystem = async () => {
      try {
        if (!musicSystemRef.current && isMounted) {
          // Check if audio context is available
          if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') {
            console.warn('Web Audio API not supported');
            setHasError(true);
            return;
          }
          
          // Wait for audio context to fully initialize
          await Tone.start();
          
          if (isMounted) {
            musicSystemRef.current = new GothicMusicSystem();
            
            // Check if initialization was successful
            if (!musicSystemRef.current.isInitialized) {
              throw new Error('Failed to initialize music system');
            }
            
            setHasError(false);
          }
        }
      } catch (error) {
        console.error('Error initializing audio system:', error);
        setHasError(true);
        if (musicSystemRef.current) {
          try {
            musicSystemRef.current.dispose();
          } catch (e) {
            console.error('Error disposing failed music system:', e);
          }
          musicSystemRef.current = null;
        }
      }
    };
    
    initSystem();
    
    // Thorough cleanup
    return () => {
      isMounted = false;
      if (musicSystemRef.current) {
        try {
          // Make sure all audio is properly stopped
          musicSystemRef.current.dispose();
          musicSystemRef.current = null;
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }
    };
  }, []);

  // Volume control with debouncing (increased debounce time for performance)
  useEffect(() => {
    if (musicSystemRef.current && musicSystemRef.current.isInitialized) {
      const volumeTimeout = setTimeout(() => {
        try {
          musicSystemRef.current.setVolume(volume);
        } catch (error) {
          console.error('Error setting volume:', error);
        }
      }, 100); // Increased debounce time
      
      return () => clearTimeout(volumeTimeout);
    }
  }, [volume]);

  useEffect(() => {
    // Optimized playback handler with error handling
    const handlePlayback = async () => {
      if (!musicSystemRef.current || hasError) return;
      
      try {
        if (isPlaying) {
          setIsLoading(true);
          
          // Check if system is properly initialized
          if (!musicSystemRef.current.isInitialized) {
            console.warn('Music system not initialized, skipping playback');
            setIsLoading(false);
            return;
          }
          
          // Throttle resource-intensive operations
          await new Promise(resolve => setTimeout(resolve, 10));
          
          if (musicSystemRef.current.isPlaying && 
              currentStyle !== musicSystemRef.current.currentStyle) {
            // Transition between styles when already playing
            await musicSystemRef.current.transitionToStyle(currentStyle);
          } else if (!musicSystemRef.current.isPlaying) {
            // Start from scratch
            // Apply seed by nudging Math.random via a simple PRNG if provided
            if (seed !== null && typeof seed === 'number') {
              let s = seed >>> 0;
              const rand = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
              const origRandom = Math.random;
              Math.random = rand;
              const success = await musicSystemRef.current.startComposition(currentStyle);
              Math.random = origRandom;
              if (!success) {
                console.warn('Failed to start music composition');
                setHasError(true);
              }
            } else {
              const success = await musicSystemRef.current.startComposition(currentStyle);
              if (!success) {
                console.warn('Failed to start music composition');
                setHasError(true);
              }
            }
          }
        } else if (musicSystemRef.current && musicSystemRef.current.isPlaying) {
          // Stop when toggled off
          musicSystemRef.current.stop();
        }
      } catch (error) {
        console.error('Music playback error:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce to prevent excessive audio context changes (increased time for performance)
    const timeoutId = setTimeout(handlePlayback, isLagging ? 200 : 100);
    return () => clearTimeout(timeoutId);
  }, [isPlaying, currentStyle, hasError, seed]);

  // Memoized style change handler to prevent recreating on every render
  const handleStyleChange = useCallback(async (newStyle) => {
    if (musicSystemRef.current) {
      // Instead of stopping completely, we'll transition to the new style
      try {
        await musicSystemRef.current.transitionToStyle(newStyle);
        setCurrentStyle(newStyle);
      } catch (error) {
        console.error('Error transitioning to new style:', error);
        // Fallback to old behavior if transition fails
        musicSystemRef.current.stop();
        setCurrentStyle(newStyle);
        if (isPlaying) {
          setTimeout(() => {
            musicSystemRef.current.startComposition(newStyle);
          }, 100);
        }
      }
    } else {
      setCurrentStyle(newStyle);
    }
  }, [isPlaying]);

  return (
    <AudioErrorBoundary>
      <div className={`gothic-music-generator ${isPlaying ? 'playing' : ''}`}>
        {hasError && (
          <div className="music-error" style={{ 
            padding: '10px', 
            color: '#E8D5B7', 
            background: 'rgba(139, 69, 19, 0.2)',
            borderRadius: '8px',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            <p>🎵 Музыкальная система недоступна</p>
            <button 
              onClick={() => {
                setHasError(false);
                window.location.reload();
              }}
              style={{
                background: 'none',
                border: '1px solid #E8D5B7',
                color: '#E8D5B7',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Попробовать снова
            </button>
          </div>
        )}
        
        {isLoading && (
          <div className="music-loading">
            <span>🎵 Создание готической композиции...</span>
          </div>
        )}
        
        {!hasError && (
          <div className="music-controls">
        <button 
          className={`style-btn ${currentStyle === 'ambient' ? 'active' : ''}`}
          onClick={() => handleStyleChange('ambient')}
        >
          🌙 Ambient
        </button>
        <button 
          className={`style-btn ${currentStyle === 'rhythmic' ? 'active' : ''}`}
          onClick={() => handleStyleChange('rhythmic')}
        >
          ⚡ Gothic
        </button>
        <button 
          className={`style-btn ${currentStyle === 'dark' ? 'active' : ''}`}
          onClick={() => handleStyleChange('dark')}
        >
          💀 Dark
        </button>
        <button 
          className={`style-btn ${currentStyle === 'cathedral' ? 'active' : ''}`}
          onClick={() => handleStyleChange('cathedral')}
        >
          🏰 Cathedral
        </button>
        <button 
          className={`style-btn ${currentStyle === 'ritual' ? 'active' : ''}`}
          onClick={() => handleStyleChange('ritual')}
        >
          🔮 Ritual
        </button>
          </div>
        )}
      </div>
    </AudioErrorBoundary>
  );
});

export default GothicMusicGenerator;