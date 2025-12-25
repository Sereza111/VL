import React, { useState, useEffect, useRef } from 'react';
import { FaMusic, FaVolumeUp, FaVolumeDown, FaVolumeMute } from 'react-icons/fa';
import GothicMusicGenerator from './GothicMusicGenerator';
import './MusicControl.css';

/**
 * MusicControl - Компонент для управления готической музыкой
 * Интегрируется с существующей системой звука в приложении
 */
const MusicControl = ({ 
  soundEnabled = true, 
  onSoundToggle, 
  className = '',
  position = 'fixed' // 'fixed' | 'inline'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [musicStyle, setMusicStyle] = useState('ambient');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e6));
  const [presets, setPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('music_presets');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showControls, setShowControls] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const controlRef = useRef(null);

  // Обработка кликов вне компонента для закрытия панели
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlRef.current && !controlRef.current.contains(event.target)) {
        setShowControls(false);
      }
    };

    if (showControls) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showControls]);

  const handleMusicToggle = () => {
    if (!soundEnabled) {
      // Если звук отключен глобально, сначала включаем его
      if (onSoundToggle) {
        onSoundToggle(true);
      }
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (newVolume === 0 && isPlaying) {
      setIsPlaying(false);
    } else if (newVolume > 0 && !isPlaying && soundEnabled) {
      setIsPlaying(true);
    }
  };

  const handleGlobalSoundToggle = () => {
    if (onSoundToggle) {
      onSoundToggle(!soundEnabled);
    }
    if (!soundEnabled) {
      setIsPlaying(false);
    }
  };

  const savePreset = () => {
    const name = prompt('Название пресета:');
    if (!name) return;
    const preset = { name, style: musicStyle, volume, seed };
    const next = [...presets, preset];
    setPresets(next);
    try { localStorage.setItem('music_presets', JSON.stringify(next)); } catch {}
  };

  const loadPreset = (preset) => {
    setMusicStyle(preset.style);
    setVolume(preset.volume);
    setSeed(preset.seed);
    if (soundEnabled) setIsPlaying(true);
  };

  const getVolumeIcon = () => {
    if (!soundEnabled || volume === 0) return FaVolumeMute;
    if (volume < 0.5) return FaVolumeDown;
    return FaVolumeUp;
  };

  const VolumeIcon = getVolumeIcon();

  const controlClasses = `
    music-control 
    ${className} 
    ${position} 
    ${isPlaying ? 'playing' : ''} 
    ${showControls ? 'expanded' : ''}
    ${isHovered ? 'hovered' : ''}
  `.trim();

  return (
    <div 
      ref={controlRef}
      className={controlClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Главная кнопка музыки */}
      <button
        className="main-music-button"
        onClick={() => setShowControls(!showControls)}
        title={isPlaying ? 'Остановить музыку' : 'Включить готическую музыку'}
      >
        <FaMusic className={`music-icon ${isPlaying ? 'rotating' : ''}`} />
        {isPlaying && <div className="pulse-ring"></div>}
      </button>

      {/* Расширенная панель управления */}
      {showControls && (
        <div className="music-panel">
          <div className="panel-header">
            <h3>🎵 Готическая Атмосфера</h3>
            <button 
              className="close-panel"
              onClick={() => setShowControls(false)}
            >
              ×
            </button>
          </div>

          {/* Управление воспроизведением */}
          <div className="playback-controls">
            <button
              className={`play-button ${isPlaying ? 'active' : ''}`}
              onClick={handleMusicToggle}
              disabled={!soundEnabled}
            >
              {isPlaying ? '⏸️ Пауза' : '▶️ Играть'}
            </button>

            <button
              className={`sound-toggle ${soundEnabled ? 'enabled' : 'disabled'}`}
              onClick={handleGlobalSoundToggle}
              title={soundEnabled ? 'Отключить звук' : 'Включить звук'}
            >
              <VolumeIcon />
            </button>
          </div>

          {/* Контроль громкости */}
          <div className="volume-control">
            <label>Громкость:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
              disabled={!soundEnabled}
            />
            <span className="volume-value">{Math.round(volume * 100)}%</span>
          </div>

          {/* Seed и пресеты */}
          <div className="preset-controls">
            <label>Seed:</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value || '0', 10))}
              className="seed-input"
            />
            <button className="save-preset-btn" onClick={savePreset}>Сохранить пресет</button>
            {presets.length > 0 && (
              <div className="preset-list">
                {presets.map((p, i) => (
                  <button key={i} className="preset-item" onClick={() => loadPreset(p)}>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Выбор стиля музыки */}
          <div className="style-selector">
            <label>Стиль:</label>
            <div className="style-buttons">
              <button
                className={`style-btn ${musicStyle === 'ambient' ? 'active' : ''}`}
                onClick={() => setMusicStyle('ambient')}
                disabled={!soundEnabled}
              >
                🌙 Ambient
              </button>
              <button
                className={`style-btn ${musicStyle === 'rhythmic' ? 'active' : ''}`}
                onClick={() => setMusicStyle('rhythmic')}
                disabled={!soundEnabled}
              >
                ⚡ Gothic
              </button>
              <button
                className={`style-btn ${musicStyle === 'dark' ? 'active' : ''}`}
                onClick={() => setMusicStyle('dark')}
                disabled={!soundEnabled}
              >
                💀 Dark
              </button>
              <button
                className={`style-btn ${musicStyle === 'cathedral' ? 'active' : ''}`}
                onClick={() => setMusicStyle('cathedral')}
                disabled={!soundEnabled}
              >
                🏰 Cathedral
              </button>
              <button
                className={`style-btn ${musicStyle === 'ritual' ? 'active' : ''}`}
                onClick={() => setMusicStyle('ritual')}
                disabled={!soundEnabled}
              >
                🔮 Ritual
              </button>
            </div>
          </div>

          {/* Описание текущего стиля */}
          <div className="style-description">
            {musicStyle === 'ambient' && 
              <p>🌙 Спокойная атмосферная музыка с медленными аккордами и мистическими мелодиями</p>
            }
            {musicStyle === 'rhythmic' && 
              <p>⚡ Ритмичная готическая композиция с басом и драматическими мелодиями</p>
            }
            {musicStyle === 'dark' && 
              <p>💀 Мрачная атмосфера с глубокими тонами и жуткими звуковыми эффектами</p>
            }
            {musicStyle === 'cathedral' && 
              <p>🏰 Торжественная органная музыка в стиле готического собора с колокольным звоном</p>
            }
            {musicStyle === 'ritual' && 
              <p>🔮 Ритуальные ударные и вокальные песнопения в древнем оккультном стиле</p>
            }
          </div>
        </div>
      )}

      {/* Генератор готической музыки */}
      {soundEnabled && isPlaying && (
        <GothicMusicGenerator
          isPlaying={isPlaying}
          volume={volume}
          style={musicStyle}
          seed={seed}
        />
      )}

      {/* Индикатор статуса */}
      {isPlaying && (
        <div className="status-indicator">
          <div className="wave-animation">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicControl;