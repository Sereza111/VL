import { useState, useEffect, useRef } from 'react';

/**
 * Performance monitoring hook that detects performance issues
 * and can trigger performance optimizations
 */
export const usePerformanceMonitor = () => {
  const [performanceMode, setPerformanceMode] = useState('auto');
  const [fps, setFps] = useState(60);
  const [isLagging, setIsLagging] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef([]);

  useEffect(() => {
    let animationId;
    
    const measureFPS = () => {
      const currentTime = performance.now();
      const delta = currentTime - lastTimeRef.current;
      
      if (delta >= 1000) { // Measure every second
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        
        // Keep FPS history for averaging
        fpsHistoryRef.current.push(currentFps);
        if (fpsHistoryRef.current.length > 5) {
          fpsHistoryRef.current.shift();
        }
        
        // Calculate average FPS
        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        setFps(Math.round(avgFps));
        
        // Detect performance issues
        const isCurrentlyLagging = avgFps < 30;
        setIsLagging(isCurrentlyLagging);
        
        // Auto-adjust performance mode
        if (performanceMode === 'auto') {
          if (isCurrentlyLagging && performanceMode !== 'low') {
            console.warn('Performance issues detected, switching to low performance mode');
            setPerformanceMode('low');
          } else if (!isCurrentlyLagging && avgFps > 50 && performanceMode !== 'high') {
            setPerformanceMode('high');
          }
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      frameCountRef.current++;
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [performanceMode]);

  // Memory usage monitoring (if available)
  const [memoryUsage, setMemoryUsage] = useState(null);
  
  useEffect(() => {
    const checkMemory = () => {
      if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        
        setMemoryUsage({
          used: Math.round(used / 1048576), // MB
          total: Math.round(total / 1048576), // MB
          limit: Math.round(limit / 1048576), // MB
          percentage: Math.round((used / limit) * 100)
        });
        
        // Warn if memory usage is high
        if (used / limit > 0.8) {
          console.warn('High memory usage detected:', Math.round((used / limit) * 100) + '%');
        }
      }
    };
    
    const interval = setInterval(checkMemory, 5000); // Check every 5 seconds
    checkMemory(); // Initial check
    
    return () => clearInterval(interval);
  }, []);

  const getOptimizationSettings = () => {
    const baseSettings = {
      maxAnimations: 10,
      maxParticles: 50,
      audioPolyphony: 8,
      shadowQuality: 'high',
      effectsEnabled: true,
      renderDistance: 1000
    };

    if (performanceMode === 'low' || isLagging) {
      return {
        ...baseSettings,
        maxAnimations: 3,
        maxParticles: 10,
        audioPolyphony: 4,
        shadowQuality: 'low',
        effectsEnabled: false,
        renderDistance: 500
      };
    }

    if (memoryUsage && memoryUsage.percentage > 70) {
      return {
        ...baseSettings,
        maxAnimations: 5,
        maxParticles: 25,
        audioPolyphony: 6,
        shadowQuality: 'medium',
        effectsEnabled: true,
        renderDistance: 750
      };
    }

    return baseSettings;
  };

  return {
    fps,
    isLagging,
    performanceMode,
    memoryUsage,
    setPerformanceMode,
    getOptimizationSettings
  };
};

/**
 * Performance optimization utilities
 */
export const PerformanceUtils = {
  // Throttle function calls
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

  // Debounce function calls
  debounce: (func, delay) => {
    let timeoutId;
    return function() {
      const args = arguments;
      const context = this;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(context, args), delay);
    };
  },

  // Check if device is mobile
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Get device performance tier
  getDevicePerformanceTier: () => {
    const mobile = PerformanceUtils.isMobile();
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    
    if (mobile || memory < 2 || cores < 2) {
      return 'low';
    } else if (memory >= 8 && cores >= 4) {
      return 'high';
    } else {
      return 'medium';
    }
  },

  // Reduce motion for accessibility and performance
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
};