import React, { useRef, useEffect, useState, useCallback } from 'react';
import anime from 'animejs/lib/anime.js';
import AlchemyLab from '../screens/mini/AlchemyLab';
import './AdvancedPortalManager.css';

// WebGL Portal Ring с частицами и энергетическими эффектами
class WebGLPortalRing {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      console.warn('WebGL не поддерживается, используем fallback');
      this.fallback = true;
      return;
    }

    this.particles = [];
    this.time = 0;
    this.animationId = null;
    
    // Опции портала
    this.options = {
      particleCount: options.particleCount || 120,
      colors: options.colors || {
        primary: [0.3, 0.7, 1.0], // Голубой портал
        secondary: [1.0, 0.8, 0.3], // Золотые искры
        energy: [0.6, 0.9, 1.0]
      },
      radius: options.radius || 0.8,
      speed: options.speed || 0.02,
      intensity: options.intensity || 1.0
    };
    
    this.initWebGL();
    this.createParticles();
  }

  initWebGL() {
    const gl = this.gl;
    
    // Vertex shader для портального кольца
    const vertexShaderSource = `
      attribute vec3 a_position;
      attribute vec2 a_uv;
      attribute float a_phase;
      
      uniform float u_time;
      uniform mat4 u_projection;
      uniform float u_intensity;
      
      varying vec2 v_uv;
      varying float v_intensity;
      varying float v_phase;
      
      void main() {
        vec3 pos = a_position;
        
        // Волновой эффект энергии
        float wave = sin(u_time * 3.0 + a_phase * 10.0) * 0.1 * u_intensity;
        pos.y += wave;
        
        // Вращение частиц вокруг центра
        float angle = u_time * 0.5 + a_phase * 6.28318;
        float cosAngle = cos(angle);
        float sinAngle = sin(angle);
        
        vec3 rotated = vec3(
          pos.x * cosAngle - pos.z * sinAngle,
          pos.y,
          pos.x * sinAngle + pos.z * cosAngle
        );
        
        // Интенсивность для мерцания
        v_intensity = 0.5 + 0.5 * sin(u_time * 5.0 + a_phase * 15.0);
        v_uv = a_uv;
        v_phase = a_phase;
        
        gl_Position = u_projection * vec4(rotated, 1.0);
        gl_PointSize = 3.0 + v_intensity * 4.0;
      }
    `;

    // Fragment shader для магических эффектов
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec2 v_uv;
      varying float v_intensity;
      varying float v_phase;
      
      uniform float u_time;
      uniform vec3 u_primaryColor;
      uniform vec3 u_secondaryColor;
      uniform vec3 u_energyColor;
      
      void main() {
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        
        if (dist > 0.5) discard;
        
        // Магическое свечение с разными цветами
        vec3 color = u_primaryColor;
        
        // Добавляем золотые искры основанные на фазе частицы
        if (v_phase > 0.7) {
          color = mix(color, u_secondaryColor, v_intensity);
        }
        
        // Энергетическое свечение в центре
        if (dist < 0.2) {
          color = mix(color, u_energyColor, 0.8);
        }
        
        // Плавный fade на краях
        float alpha = (0.5 - dist) * 2.0 * v_intensity;
        
        // Дополнительное мерцание
        alpha *= 0.7 + 0.3 * sin(u_time * 8.0 + v_phase * 20.0);
        
        gl_FragColor = vec4(color, alpha * 0.8);
      }
    `;
    
    this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    
    if (!this.program) {
      console.error('Не удалось создать шейдерную программу');
      this.fallback = true;
      return;
    }

    // Получаем locations для uniform переменных
    this.uniforms = {
      time: gl.getUniformLocation(this.program, 'u_time'),
      projection: gl.getUniformLocation(this.program, 'u_projection'),
      intensity: gl.getUniformLocation(this.program, 'u_intensity'),
      primaryColor: gl.getUniformLocation(this.program, 'u_primaryColor'),
      secondaryColor: gl.getUniformLocation(this.program, 'u_secondaryColor'),
      energyColor: gl.getUniformLocation(this.program, 'u_energyColor')
    };

    // Настраиваем WebGL состояние
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
  }

  createShaderProgram(vertexShaderSource, fragmentShaderSource) {
    const gl = this.gl;
    
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      return null;
    }
    
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Ошибка линковки программы:', gl.getProgramInfoLog(program));
      return null;
    }
    
    return program;
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Ошибка компиляции шейдера:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  createParticles() {
    this.particles = [];
    const particleCount = this.options.particleCount;
    const positions = new Float32Array(particleCount * 3);
    const uvs = new Float32Array(particleCount * 2);
    const phases = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = this.options.radius + (Math.random() - 0.5) * 0.3;
      const height = (Math.random() - 0.5) * 0.2;
      
      // Позиция частицы
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      
      // UV координаты
      uvs[i * 2] = (Math.cos(angle) + 1.0) * 0.5;
      uvs[i * 2 + 1] = (Math.sin(angle) + 1.0) * 0.5;
      
      // Фаза для анимации
      phases[i] = Math.random();
      
      this.particles.push({
        originalAngle: angle,
        originalRadius: radius,
        speed: this.options.speed + Math.random() * 0.03,
        phase: phases[i]
      });
    }

    // Создаем буферы
    if (this.gl && this.program) {
      this.positionBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
      
      this.uvBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.uvBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, uvs, this.gl.STATIC_DRAW);
      
      this.phaseBuffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.phaseBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, phases, this.gl.STATIC_DRAW);
    }
  }

  animate() {
    if (this.fallback) {
      this.animateFallback();
      return;
    }
    
    this.time += 0.016;
    this.render();
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  render() {
    const gl = this.gl;
    if (!gl || !this.program) return;
    
    // Устанавливаем viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Используем шейдерную программу
    gl.useProgram(this.program);
    
    // Настраиваем проекционную матрицу (ортогональная проекция)
    const projection = new Float32Array([
      2.0, 0.0, 0.0, 0.0,
      0.0, 2.0, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0
    ]);
    
    // Устанавливаем uniform переменные
    gl.uniformMatrix4fv(this.uniforms.projection, false, projection);
    gl.uniform1f(this.uniforms.time, this.time);
    gl.uniform1f(this.uniforms.intensity, this.options.intensity);
    gl.uniform3fv(this.uniforms.primaryColor, this.options.colors.primary);
    gl.uniform3fv(this.uniforms.secondaryColor, this.options.colors.secondary);
    gl.uniform3fv(this.uniforms.energyColor, this.options.colors.energy);
    
    // Привязываем атрибуты
    const positionAttribute = gl.getAttribLocation(this.program, 'a_position');
    const uvAttribute = gl.getAttribLocation(this.program, 'a_uv');
    const phaseAttribute = gl.getAttribLocation(this.program, 'a_phase');
    
    // Позиции
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 3, gl.FLOAT, false, 0, 0);
    
    // UV координаты
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.enableVertexAttribArray(uvAttribute);
    gl.vertexAttribPointer(uvAttribute, 2, gl.FLOAT, false, 0, 0);
    
    // Фазы
    gl.bindBuffer(gl.ARRAY_BUFFER, this.phaseBuffer);
    gl.enableVertexAttribArray(phaseAttribute);
    gl.vertexAttribPointer(phaseAttribute, 1, gl.FLOAT, false, 0, 0);
    
    // Рисуем частицы
    gl.drawArrays(gl.POINTS, 0, this.options.particleCount);
  }

  // Fallback анимация для устройств без WebGL
  animateFallback() {
    const canvas = this.canvas;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.3;
    
    // Рисуем энергетическое кольцо
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 + this.time;
      const radius = baseRadius + Math.sin(this.time * 3 + i * 0.5) * 20;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const alpha = 0.5 + 0.3 * Math.sin(this.time * 5 + i * 0.8);
      const size = 3 + Math.sin(this.time * 4 + i * 0.3) * 2;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = i % 3 === 0 ? '#FFD700' : '#87CEEB';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    
    this.time += 0.016;
    this.animationId = requestAnimationFrame(() => this.animateFallback());
  }

  setIntensity(intensity) {
    this.options.intensity = intensity;
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  destroy() {
    this.stop();
    
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
      this.gl.deleteBuffer(this.positionBuffer);
      this.gl.deleteBuffer(this.uvBuffer);
      this.gl.deleteBuffer(this.phaseBuffer);
    }
  }
}

// Главный компонент продвинутого портального менеджера
const AdvancedPortalManager = ({ 
  isOpen = false, 
  onClose = null, 
  onComplete = null,
  clickPosition = null,
  children 
}) => {
  const [portalState, setPortalState] = useState('closed'); // closed, opening, webgl, expanding, fullscreen, laboratory, closing
  const [webglRing, setWebglRing] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const portalContainerRef = useRef(null);
  const webglCanvasRef = useRef(null);
  const laboratororyRef = useRef(null);
  
  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Звуковые эффекты
  const playSound = useCallback((soundType) => {
    // Здесь можно добавить звуковые эффекты
    console.log(`Playing sound: ${soundType}`);
  }, []);

  // Создание портального элемента
  const createPortalElement = useCallback((x, y) => {
    if (!portalContainerRef.current) return;
    
    const portal = portalContainerRef.current;
    
    // Устанавливаем начальную позицию
    portal.style.left = `${x - 10}px`;
    portal.style.top = `${y - 10}px`;
    portal.style.width = '20px';
    portal.style.height = '20px';
    portal.style.display = 'block';
    portal.style.opacity = '1';
    
    return portal;
  }, []);

  // Анимация появления портала
  const animatePortalAppearance = useCallback(async () => {
    return new Promise((resolve) => {
      const portal = portalContainerRef.current;
      if (!portal) return resolve();
      
      playSound('portal_opening');
      
      // CSS анимация разрыва пространства
      anime({
        targets: portal,
        width: ['20px', '200px'],
        height: ['20px', '200px'],
        left: (el) => parseFloat(el.style.left) - 90,
        top: (el) => parseFloat(el.style.top) - 90,
        rotate: [0, 720],
        scale: [0.1, 1],
        opacity: [0, 1],
        duration: isMobile ? 800 : 1200,
        easing: 'easeOutCubic',
        complete: () => {
          setPortalState('webgl');
          resolve();
        }
      });
    });
  }, [isMobile, playSound]);

  // Запуск WebGL эффектов
  const startWebGLEffects = useCallback(async () => {
    return new Promise((resolve) => {
      const canvas = webglCanvasRef.current;
      if (!canvas) return resolve();
      
      // Настройка canvas
      const rect = portalContainerRef.current?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
      }
      
      // Создаем WebGL эффект
      const ring = new WebGLPortalRing(canvas, {
        particleCount: isMobile ? 60 : 120,
        intensity: 1.0
      });
      
      setWebglRing(ring);
      ring.animate();
      
      // Плавное появление WebGL canvas
      anime({
        targets: canvas,
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutQuad',
        complete: () => {
          setTimeout(() => {
            setPortalState('expanding');
            resolve();
          }, 800);
        }
      });
    });
  }, [isMobile]);

  // Переход в fullscreen
  const expandToFullscreen = useCallback(async () => {
    return new Promise(async (resolve) => {
      // Пытаемся включить fullscreen
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (e) {
        console.log('Fallback к CSS fullscreen');
        // Fallback для iOS Safari и других браузеров
        document.body.classList.add('portal-fullscreen-fallback');
        setIsFullscreen(true);
      }
      
      const portal = portalContainerRef.current;
      if (!portal) return resolve();
      
      playSound('portal_expand');
      
      // Анимация расширения портала
      anime({
        targets: portal,
        width: '100vw',
        height: '100vh',
        left: '0px',
        top: '0px',
        borderRadius: ['50%', '0%'],
        duration: isMobile ? 600 : 1000,
        easing: 'easeInOutCubic',
        complete: () => {
          setPortalState('laboratory');
          resolve();
        }
      });
    });
  }, [isMobile, playSound]);

  // Загрузка лаборатории
  const loadLaboratory = useCallback(() => {
    playSound('portal_enter');
    
    // Затухание портального эффекта
    if (webglRing) {
      anime({
        targets: webglCanvasRef.current,
        opacity: 0,
        duration: 500,
        complete: () => {
          webglRing.stop();
        }
      });
    }
    
    // Показываем лабораторию
    const laboratory = laboratororyRef.current;
    if (laboratory) {
      laboratory.style.display = 'block';
      anime({
        targets: laboratory,
        opacity: [0, 1],
        scale: [0.9, 1],
        duration: 800,
        easing: 'easeOutQuart'
      });
    }
  }, [webglRing, playSound]);

  // Закрытие портала
  const closePortal = useCallback(async () => {
    // Защита от повторного закрытия
    if (portalState === 'closing' || portalState === 'closed') {
      return;
    }
    
    console.log('🚪 Закрытие портала...');
    setPortalState('closing');
    
    const laboratory = laboratororyRef.current;
    const portal = portalContainerRef.current;
    
    // Скрываем лабораторию
    if (laboratory) {
      await new Promise(resolve => {
        anime({
          targets: laboratory,
          opacity: 0,
          scale: 0.9,
          duration: 400,
          easing: 'easeInQuart',
          complete: () => {
            laboratory.style.display = 'none';
            resolve();
          }
        });
      });
    }
    
    // Анимация закрытия портала
    if (portal) {
      anime({
        targets: portal,
        scale: 0,
        rotate: -360,
        opacity: 0,
        duration: 600,
        easing: 'easeInBack',
        complete: () => {
          portal.style.display = 'none';
          setPortalState('closed');
        }
      });
    }
    
    // Выходим из fullscreen
    if (isFullscreen) {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        document.body.classList.remove('portal-fullscreen-fallback');
        setIsFullscreen(false);
      } catch (e) {
        console.log('Ошибка при выходе из fullscreen:', e);
      }
    }
    
    // Очищаем WebGL ресурсы
    if (webglRing) {
      webglRing.destroy();
      setWebglRing(null);
    }
    
    // Задержка перед вызовом onClose для избежания конфликтов
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 100);
  }, [portalState, isFullscreen, webglRing, onClose]);

  // Главная функция открытия портала
  const openPortal = useCallback(async () => {
    if (portalState !== 'closed') return;
    
    console.log('🌀 НАЧАЛО: Открытие портала...');
    setPortalState('opening');
    
    const { x, y } = clickPosition || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    try {
      // Шаг 1: Создаем портальный элемент
      console.log('📍 ШАГ 1: Создание портального элемента в позиции', { x, y });
      createPortalElement(x, y);
      
      // Шаг 2: Анимация появления портала
      console.log('✨ ШАГ 2: Запуск анимации появления...');
      await animatePortalAppearance();
      console.log('✅ ШАГ 2: Анимация появления завершена');
      
      // Шаг 3: WebGL эффекты
      console.log('🌀 ШАГ 3: Запуск WebGL эффектов...');
      await startWebGLEffects();
      console.log('✅ ШАГ 3: WebGL эффекты завершены');
      
      // Шаг 4: Переход в fullscreen
      console.log('📱 ШАГ 4: Переход в fullscreen...');
      await expandToFullscreen();
      console.log('✅ ШАГ 4: Fullscreen переход завершен');
      
      // Шаг 5: Загружаем лабораторию
      console.log('⚗️ ШАГ 5: Загрузка лаборатории...');
      loadLaboratory();
      console.log('✅ УСПЕХ: Портал полностью открыт и готов к использованию!');
      
      // НЕ вызываем onComplete сразу - только при реальном завершении активности
    } catch (error) {
      console.error('❌ КРИТИЧЕСКАЯ ОШИБКА при открытии портала:', error);
      console.error('Stack trace:', error.stack);
      // НЕ закрываем портал автоматически при ошибках - пусть пользователь сам решает
      // closePortal();
    }
  }, [
    portalState,
    clickPosition,
    createPortalElement,
    animatePortalAppearance,
    startWebGLEffects,
    expandToFullscreen,
    loadLaboratory,
    closePortal,
    onComplete
  ]);

  // Эффект для открытия портала
  useEffect(() => {
    if (isOpen && portalState === 'closed' && clickPosition) {
      console.log('🌀 Запуск портальной последовательности...');
      openPortal();
    }
  }, [isOpen, portalState, openPortal, clickPosition]);

  // Cleanup эффект
  useEffect(() => {
    return () => {
      if (webglRing) {
        webglRing.destroy();
      }
      
      // Очищаем fullscreen состояние
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      document.body.classList.remove('portal-fullscreen-fallback');
    };
  }, [webglRing]);

  return (
    <>
      {/* Портальный контейнер */}
      <div 
        ref={portalContainerRef}
        className={`advanced-portal-container portal-state-${portalState}`}
        style={{
          position: 'fixed',
          display: 'none',
          zIndex: 9999,
          pointerEvents: portalState === 'laboratory' ? 'auto' : 'none',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(60,47,79,0.9) 0%, rgba(27,38,59,0.6) 70%, rgba(26,60,52,0.3) 100%)',
          boxShadow: '0 0 50px rgba(168,199,250,0.5), inset 0 0 30px rgba(26,60,52,0.8)',
          border: '2px solid rgba(168,199,250,0.3)'
        }}
      >
        {/* WebGL Canvas для портального кольца */}
        <canvas
          ref={webglCanvasRef}
          className="portal-webgl-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            pointerEvents: 'none'
          }}
        />
        
        {/* Алхимическая лаборатория */}
        <div 
          ref={laboratororyRef}
          className="portal-laboratory"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'none',
            opacity: 0
          }}
        >
          {portalState === 'laboratory' && (
            <AlchemyLab
              onClose={() => {
                console.log('🚪 Пользователь закрыл лабораторию');
                closePortal();
              }}
              onBrew={(reward) => {
                console.log('Зелье готово! Награда:', reward);
                if (onComplete) onComplete({ type: 'brew', reward });
              }}
              onAddPotion={(potion) => {
                console.log('Добавлено зелье:', potion);
                if (onComplete) onComplete({ type: 'potion', potion });
              }}
              energyReward={0.12} // Повышенная награда за портальную алхимию
            />
          )}
        </div>
        
        {/* Эффекты частиц при открытии */}
        {portalState === 'opening' && (
          <div className="portal-opening-particles">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="portal-particle"
                style={{
                  position: 'absolute',
                  width: '4px',
                  height: '4px',
                  background: i % 2 === 0 ? '#A8C7FA' : '#FFD700',
                  borderRadius: '50%',
                  animation: `portalParticle${i % 4} 1.5s ease-out forwards`,
                  left: '50%',
                  top: '50%',
                  boxShadow: '0 0 10px currentColor'
                }}
              />
            ))}
          </div>
        )}
        
        {/* Дополнительные магические эффекты */}
        {(portalState === 'webgl' || portalState === 'expanding') && (
          <div className="portal-magic-effects">
            <div className="portal-runes">
              {['✦', '☽', '⚝', '⚜', '☾', '✧', '⚹', '♱'].map((rune, i) => (
                <div
                  key={i}
                  className="portal-rune"
                  style={{
                    position: 'absolute',
                    color: '#A8C7FA',
                    fontSize: '18px',
                    textShadow: '0 0 10px currentColor',
                    animation: `portalRune 3s linear infinite`,
                    animationDelay: `${i * 0.375}s`,
                    transformOrigin: 'center',
                    left: '50%',
                    top: '50%',
                    transform: `
                      translate(-50%, -50%) 
                      rotate(${i * 45}deg) 
                      translateY(-${isMobile ? '60px' : '80px'})`
                  }}
                >
                  {rune}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {children}
    </>
  );
};

export default AdvancedPortalManager;
