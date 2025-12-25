/**
 * Утилиты для оптимизации портальной системы
 * Автоматическая настройка производительности в зависимости от устройства
 */

// Детекция типа устройства и его возможностей
export const DeviceCapabilities = {
  // Проверка поддержки WebGL
  hasWebGL: () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  },

  // Определение мощности GPU
  getGPUInfo: () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    
    if (!gl) return { tier: 'none', renderer: 'unknown' };
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return { tier: 'low', renderer: 'unknown' };
    
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
    
    // Высокопроизводительные GPU
    if (renderer.includes('rtx') || 
        renderer.includes('gtx 1') || 
        renderer.includes('gtx 2') ||
        renderer.includes('radeon rx') ||
        renderer.includes('apple m1') ||
        renderer.includes('apple m2')) {
      return { tier: 'high', renderer };
    }
    
    // Средние GPU  
    if (renderer.includes('gtx') || 
        renderer.includes('radeon') ||
        renderer.includes('intel iris') ||
        renderer.includes('intel xe')) {
      return { tier: 'medium', renderer };
    }
    
    // Мобильные и слабые GPU
    if (renderer.includes('mali') || 
        renderer.includes('adreno') ||
        renderer.includes('powervr') ||
        renderer.includes('intel hd')) {
      return { tier: 'low', renderer };
    }
    
    return { tier: 'medium', renderer };
  },

  // Детекция мобильного устройства
  isMobile: () => {
    return window.innerWidth <= 768 || 
           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Проверка поддержки Fullscreen API
  hasFullscreenSupport: () => {
    return !!(document.fullscreenEnabled || 
             document.webkitFullscreenEnabled || 
             document.mozFullScreenEnabled ||
             document.msFullscreenEnabled);
  },

  // Проверка поддержки Vibration API
  hasVibrationSupport: () => {
    return 'vibrate' in navigator;
  },

  // Оценка общей производительности устройства
  getPerformanceScore: () => {
    let score = 0;
    
    // Базовые характеристики
    score += window.innerWidth > 1920 ? 30 : window.innerWidth > 1280 ? 20 : 10;
    score += navigator.hardwareConcurrency > 8 ? 20 : navigator.hardwareConcurrency > 4 ? 15 : 10;
    
    // GPU
    const gpu = DeviceCapabilities.getGPUInfo();
    score += gpu.tier === 'high' ? 30 : gpu.tier === 'medium' ? 20 : 10;
    
    // Мобильное устройство
    if (DeviceCapabilities.isMobile()) {
      score = Math.max(10, score - 20);
    }
    
    // WebGL поддержка
    score += DeviceCapabilities.hasWebGL() ? 10 : 0;
    
    return Math.min(100, score);
  }
};

// Автоматические настройки производительности
export const PerformancePresets = {
  // Настройки для слабых устройств
  low: {
    webgl: {
      enabled: false,
      particleCount: 20,
      animationFPS: 30
    },
    css: {
      enableComplexAnimations: false,
      enable3DTransforms: false,
      enableBlur: false,
      enableShadows: false
    },
    portal: {
      animationDuration: 800,
      enableParticleExplosion: false,
      enableRunes: false,
      enableAura: false
    }
  },

  // Настройки для средних устройств
  medium: {
    webgl: {
      enabled: true,
      particleCount: 60,
      animationFPS: 30
    },
    css: {
      enableComplexAnimations: true,
      enable3DTransforms: false,
      enableBlur: true,
      enableShadows: true
    },
    portal: {
      animationDuration: 1000,
      enableParticleExplosion: true,
      enableRunes: true,
      enableAura: false
    }
  },

  // Настройки для мощных устройств
  high: {
    webgl: {
      enabled: true,
      particleCount: 120,
      animationFPS: 60
    },
    css: {
      enableComplexAnimations: true,
      enable3DTransforms: true,
      enableBlur: true,
      enableShadows: true
    },
    portal: {
      animationDuration: 1200,
      enableParticleExplosion: true,
      enableRunes: true,
      enableAura: true
    }
  }
};

// Автоматический выбор пресета
export const getOptimalPreset = () => {
  const score = DeviceCapabilities.getPerformanceScore();
  
  if (score >= 70) return PerformancePresets.high;
  if (score >= 40) return PerformancePresets.medium;
  return PerformancePresets.low;
};

// Мониторинг производительности
export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.isMonitoring = false;
    this.callbacks = [];
  }

  start() {
    this.isMonitoring = true;
    this.monitor();
  }

  stop() {
    this.isMonitoring = false;
  }

  monitor() {
    if (!this.isMonitoring) return;

    const now = performance.now();
    this.frameCount++;

    if (now >= this.lastTime + 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;

      // Уведомляем подписчиков об изменении FPS
      this.callbacks.forEach(callback => callback(this.fps));
    }

    requestAnimationFrame(() => this.monitor());
  }

  onFPSChange(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  getFPS() {
    return this.fps;
  }
}

// Адаптивный менеджер качества
export class QualityManager {
  constructor(initialQuality = 'auto') {
    this.currentQuality = initialQuality;
    this.performanceMonitor = new PerformanceMonitor();
    this.settings = this.getQualitySettings();
    this.autoAdjustEnabled = initialQuality === 'auto';
    
    if (this.autoAdjustEnabled) {
      this.setupAutoAdjust();
    }
  }

  getQualitySettings() {
    if (this.currentQuality === 'auto') {
      return getOptimalPreset();
    }
    return PerformancePresets[this.currentQuality] || PerformancePresets.medium;
  }

  setupAutoAdjust() {
    this.performanceMonitor.start();
    
    this.performanceMonitor.onFPSChange((fps) => {
      // Понижаем качество если FPS слишком низкий
      if (fps < 25 && this.currentQuality !== 'low') {
        if (this.currentQuality === 'high') {
          this.setQuality('medium');
        } else if (this.currentQuality === 'medium') {
          this.setQuality('low');
        }
      }
      
      // Повышаем качество если FPS стабильно высокий
      if (fps > 50 && this.currentQuality === 'low') {
        setTimeout(() => {
          if (this.performanceMonitor.getFPS() > 45) {
            this.setQuality('medium');
          }
        }, 2000);
      }
      
      if (fps > 55 && this.currentQuality === 'medium') {
        setTimeout(() => {
          if (this.performanceMonitor.getFPS() > 50) {
            this.setQuality('high');
          }
        }, 3000);
      }
    });
  }

  setQuality(quality) {
    this.currentQuality = quality;
    this.settings = this.getQualitySettings();
    console.log(`Portal quality adjusted to: ${quality}`, this.settings);
  }

  getSettings() {
    return this.settings;
  }

  destroy() {
    this.performanceMonitor.stop();
  }
}

// Утилиты для оптимизации анимаций
export const AnimationOptimizer = {
  // Throttle для ограничения частоты вызовов
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Debounce для отложенного выполнения
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Проверка видимости элемента
  isElementVisible: (element) => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
      rect.top < windowHeight &&
      rect.bottom > 0 &&
      rect.left < windowWidth &&
      rect.right > 0
    );
  },

  // Приостановка анимаций при скрытой вкладке
  setupVisibilityOptimization: () => {
    let animationsRunning = true;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Приостанавливаем анимации
        animationsRunning = false;
        document.body.classList.add('animations-paused');
      } else {
        // Возобновляем анимации
        animationsRunning = true;
        document.body.classList.remove('animations-paused');
      }
    });
    
    return () => animationsRunning;
  }
};

// Менеджер батареи для мобильных устройств
export const BatteryOptimizer = {
  async getBatteryInfo() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  async shouldReducePerformance() {
    const batteryInfo = await this.getBatteryInfo();
    
    if (!batteryInfo) return false;
    
    // Снижаем производительность при низком заряде
    return batteryInfo.level < 0.2 && !batteryInfo.charging;
  },

  async setupBatteryOptimization(qualityManager) {
    const batteryInfo = await this.getBatteryInfo();
    
    if (!batteryInfo) return;
    
    // Слушаем изменения уровня батареи
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      
      battery.addEventListener('levelchange', () => {
        if (battery.level < 0.15 && !battery.charging) {
          qualityManager.setQuality('low');
        }
      });
      
      battery.addEventListener('chargingchange', () => {
        if (battery.charging && battery.level > 0.3) {
          qualityManager.setQuality('auto');
        }
      });
    }
  }
};

// Экспорт главного класса оптимизатора
export class PortalOptimizer {
  constructor(options = {}) {
    this.qualityManager = new QualityManager(options.quality || 'auto');
    this.performanceMonitor = this.qualityManager.performanceMonitor;
    
    // Настройка оптимизаций
    this.setupOptimizations();
  }

  async setupOptimizations() {
    // Настройка видимости вкладки
    AnimationOptimizer.setupVisibilityOptimization();
    
    // Настройка батареи (только для поддерживающих браузеров)
    await BatteryOptimizer.setupBatteryOptimization(this.qualityManager);
  }

  getSettings() {
    return this.qualityManager.getSettings();
  }

  setQuality(quality) {
    this.qualityManager.setQuality(quality);
  }

  getFPS() {
    return this.performanceMonitor.getFPS();
  }

  getDeviceInfo() {
    return {
      capabilities: {
        webGL: DeviceCapabilities.hasWebGL(),
        fullscreen: DeviceCapabilities.hasFullscreenSupport(),
        vibration: DeviceCapabilities.hasVibrationSupport(),
        isMobile: DeviceCapabilities.isMobile()
      },
      gpu: DeviceCapabilities.getGPUInfo(),
      performanceScore: DeviceCapabilities.getPerformanceScore(),
      currentFPS: this.getFPS(),
      currentQuality: this.qualityManager.currentQuality
    };
  }

  destroy() {
    this.qualityManager.destroy();
  }
}

export default PortalOptimizer;
