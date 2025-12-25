import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  EffectComposer, 
  Bloom, 
  Vignette, 
  ChromaticAberration 
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import * as p5 from 'p5';
import anime from 'animejs/lib/anime.js';
import 'css-doodle';
import { Howl, Howler } from 'howler';
import * as dat from 'dat.gui';
import MysticalForest from './MysticalForest';
import FloatingTarotCards from './FloatingTarotCards';
import OccultPatterns from './OccultPatterns';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

// Расширенные константы для визуальных тем
const MAGICAL_THEMES = {
  mystical: {
    backgroundColors: [COLOR_PALETTE.darkPurple, '#512b58', '#7a4069', '#9d4edd'],
    particleColor: COLOR_PALETTE.moonBlue,
    glowColor: COLOR_PALETTE.darkTurquoise,
    ambientSoundVolume: 0.3,
    particleDensity: 7000,
    particleOpacity: 0.7,
    fogDensity: 0.04,
    fogColor: COLOR_PALETTE.darkPurple
  },
  cosmic: {
    backgroundColors: [COLOR_PALETTE.inkyBlue, '#161b22', '#30363d', '#21262d'],
    particleColor: COLOR_PALETTE.moonBlue,
    glowColor: COLOR_PALETTE.darkTurquoise,
    ambientSoundVolume: 0.2,
    particleDensity: 5000,
    particleOpacity: 0.5,
    fogDensity: 0.03,
    fogColor: COLOR_PALETTE.inkyBlue
  },
  ethereal: {
    backgroundColors: [COLOR_PALETTE.darkTurquoise, COLOR_PALETTE.inkyBlue, COLOR_PALETTE.darkPurple],
    particleColor: COLOR_PALETTE.beigeParchment,
    glowColor: COLOR_PALETTE.moonBlue,
    ambientSoundVolume: 0.4,
    particleDensity: 9000,
    particleOpacity: 0.9,
    fogDensity: 0.05,
    fogColor: COLOR_PALETTE.darkTurquoise
  }
};

// Компонент для создания фона с эффектом градиента
const GradientBackground = ({ theme = 'mystical', paused = false }) => {
  const canvasRef = useRef(null);
  const themeConfig = MAGICAL_THEMES[theme];
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const noise = createNoise3D();
    
    let animationFrameId;
    let time = 0;
    
    // Функция для создания градиента
    const drawGradient = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Очищаем холст
      ctx.clearRect(0, 0, width, height);
      
      // Создаем градиент
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      
      // Добавляем цвета из темы с небольшим смещением на основе шума
      themeConfig.backgroundColors.forEach((color, index) => {
        const position = index / (themeConfig.backgroundColors.length - 1);
        const noiseValue = noise(position, time * 0.05, 0) * 0.1;
        gradient.addColorStop(Math.max(0, Math.min(1, position + noiseValue)), color);
      });
      
      // Заполняем фон градиентом
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Убираем дорогую постобработку по пикселям для повышения FPS
      
      // Увеличиваем время
      time += 0.01;
      
      // Запускаем следующий кадр только если не на паузе
      if (!paused) {
        animationFrameId = requestAnimationFrame(drawGradient);
      }
    };
    
    // Устанавливаем размер холста
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // При ресайзе перерисуем один кадр
      drawGradient();
    };
    
    // Добавляем обработчик изменения размера окна
    window.addEventListener('resize', resize);
    resize();
    
    // Если не пауза, запускаем анимацию, иначе рисуем статический кадр
    if (!paused) {
      animationFrameId = requestAnimationFrame(drawGradient);
    } else {
      drawGradient();
    }
    
    // Очистка при размонтировании
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, paused]);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -10
      }}
    />
  );
};

// Компонент для 3D-сцены (optimized)
const MysticalScene = ({ 
  theme = 'mystical', 
  performanceMode = 'auto', 
  isLagging = false,
  optimizationSettings = {}
}) => {
  const themeConfig = MAGICAL_THEMES[theme];
  
  // Adjust quality based on performance
  const shouldUseEffects = !isLagging && optimizationSettings.effectsEnabled;
  const particleCount = isLagging ? 
    Math.min(optimizationSettings.maxParticles || 10, 10) : 
    optimizationSettings.maxParticles || 50;
  
  return (
    <Canvas 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: -5,
        pointerEvents: 'none'
      }}
      gl={{ 
        antialias: !isLagging,
        alpha: true,
        powerPreference: isLagging ? "low-power" : "high-performance",
        stencil: false,
        depth: true
      }}
      camera={{ position: [0, 5, 15], fov: 60 }}
      frameloop={isLagging ? 'demand' : 'always'}
    >
      {!isLagging && (
        <fog 
          attach="fog" 
          args={[themeConfig.fogColor, 5, 30]} 
        />
      )}
      
      <ambientLight intensity={isLagging ? 0.1 : 0.2} />
      {!isLagging && (
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={0.3} 
          color={COLOR_PALETTE.moonBlue} 
        />
      )}
      
      <Suspense fallback={null}>
        {!isLagging && <MysticalForest />}
      </Suspense>
      
      {shouldUseEffects && (
        <EffectComposer>
          <Bloom 
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            intensity={0.5}
          />
          <Vignette 
            darkness={0.7} 
            offset={0.1} 
            eskil={false} 
            blendFunction={BlendFunction.NORMAL}
          />
          <ChromaticAberration 
            offset={[0.002, 0.002]} 
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      )}
      
      {!isLagging && (
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          enableRotate={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />
      )}
    </Canvas>
  );
};

// Основной компонент MagicalBackground
const MagicalBackground = ({ 
  theme = 'mystical', 
  soundEnabled = false,
  debugMode = false,
  currentScreen = 'home',
  onCardClick = null,
  paused = false
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const soundRef = useRef({});
  const guiRef = useRef(null);
  
  // Инициализация звуков
  useEffect(() => {
    if (!soundEnabled) return;
    
    const themeConfig = MAGICAL_THEMES[theme];
    
    // Создаем звуки (заглушки, так как файлов со звуком пока нет)
    soundRef.current = {
      ambience: new Howl({
        src: ['/sounds/placeholder-ambience.mp3'], // Заглушка
        loop: true,
        volume: themeConfig.ambientSoundVolume,
        autoplay: false,
        onloaderror: () => {
          console.log('Звуковой файл не найден, используем заглушку');
        }
      }),
      guitar: new Howl({
        src: ['/sounds/placeholder-guitar.mp3'], // Заглушка
        loop: true,
        volume: 0.5,
        autoplay: false,
        onloaderror: () => {
          console.log('Звуковой файл не найден, используем заглушку');
        }
      })
    };
    
    // Очистка при размонтировании
    return () => {
      Object.values(soundRef.current).forEach(sound => {
        if (sound && sound.stop) {
          sound.stop();
        }
      });
    };
  }, [soundEnabled, theme]);
  
  // Настройка отладочного интерфейса
  useEffect(() => {
    if (!debugMode) return;
    
    guiRef.current = new dat.GUI();
    const themeFolder = guiRef.current.addFolder('Theme');
    
    const settings = {
      theme: theme,
      soundEnabled: soundEnabled,
      fogDensity: MAGICAL_THEMES[theme].fogDensity
    };
    
    themeFolder.add(settings, 'theme', Object.keys(MAGICAL_THEMES)).onChange(value => {
      // В реальном приложении здесь был бы код для изменения темы
      console.log('Изменена тема на:', value);
    });
    
    themeFolder.add(settings, 'soundEnabled').onChange(value => {
      // В реальном приложении здесь был бы код для включения/выключения звука
      console.log('Звук:', value ? 'включен' : 'выключен');
    });
    
    themeFolder.add(settings, 'fogDensity', 0, 0.1).onChange(value => {
      // В реальном приложении здесь был бы код для изменения плотности тумана
      console.log('Плотность тумана изменена на:', value);
    });
    
    themeFolder.open();
    
    // Очистка при размонтировании
    return () => {
      if (guiRef.current) {
        guiRef.current.destroy();
      }
    };
  }, [debugMode, theme, soundEnabled]);
  
  // Эффект для отслеживания инициализации
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  return (
    <div 
      className="magical-background" 
      style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: -1, 
        overflow: 'hidden',
        pointerEvents: 'none',
        background: COLOR_PALETTE.darkPurple
      }}
    >
      {/* Градиентный фон */}
      <GradientBackground theme={theme} paused={paused} />
      
      {/* Оккультные узоры */}
      <OccultPatterns patternCount={15} position="bottom" />
      
      {/* Парящие карты Таро */}
      {!paused && (
        <FloatingTarotCards 
          onCardClick={onCardClick} 
          currentScreen={currentScreen}
        />
      )}
    </div>
  );
};

export default React.memo(MagicalBackground);