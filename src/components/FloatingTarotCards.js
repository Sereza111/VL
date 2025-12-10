import React, { useEffect, useRef } from 'react';
// Lazy-load p5 to reduce initial bundle size
let P5Constructor = null;
import anime from 'animejs/lib/anime.js';
import './FloatingTarotCards.css';

// Цветовая палитра из требований
const COLOR_PALETTE = {
  darkPurple: '#3C2F4F',    // Тёмно-фиолетовый — основной фон
  beigeParchment: '#E8D3A9', // Бежево-пергаментный — текст, акценты
  darkTurquoise: '#1A3C34',  // Тёмный бирюзовый — светлячки, свечение
  inkyBlue: '#1B263B',       // Чернильный синий — тени, контуры
  moonBlue: '#A8C7FA',       // Голубоватый оттенок луны
};

// Данные карт Таро
const TAROT_CARDS = [
  { 
    name: 'Луна', 
    symbolism: 'Интуиция', 
    color: COLOR_PALETTE.moonBlue, 
    image: null, // Убираем ссылку на изображение
    width: 120,
    height: 200,
    section: 'home'
  },
  { 
    name: 'Маг', 
    symbolism: 'Проявление', 
    color: COLOR_PALETTE.beigeParchment, 
    image: null, // Убираем ссылку на изображение
    width: 120,
    height: 200,
    section: 'earn'
  },
  { 
    name: 'Башня', 
    symbolism: 'Разрушение', 
    color: COLOR_PALETTE.darkPurple, 
    image: null, // Убираем ссылку на изображение
    width: 120,
    height: 200,
    section: 'shop'
  },
  { 
    name: 'Шут', 
    symbolism: 'Новые начинания', 
    color: COLOR_PALETTE.beigeParchment, 
    image: null, // Убираем ссылку на изображение
    width: 120,
    height: 200,
    section: 'profile'
  }
];

// Класс для карты Таро
class TarotCard {
  constructor(p, data, canvasWidth, canvasHeight) {
    this.p = p;
    this.data = data;
    this.width = data.width || 120;
    this.height = data.height || 200;
    
    // Начальная позиция
    this.x = p.random(this.width, canvasWidth - this.width);
    this.y = p.random(this.height, canvasHeight - this.height);
    
    // Скорость движения
    this.vx = p.random(-0.2, 0.2);
    this.vy = p.random(-0.2, 0.2);
    
    // Вращение
    this.angle = p.random(0, p.TWO_PI);
    this.rotationSpeed = p.random(-0.005, 0.005);
    
    // Параметры анимации
    this.scale = 1;
    this.opacity = p.random(0.7, 0.9);
    this.hovered = false;
    this.image = null;
    
    // Загружаем изображение, если есть
    if (data.image) {
      this.image = p.loadImage(data.image);
    }
    
    // Создаем анимацию парения
    this.floatOffset = p.random(0, p.TWO_PI);
    this.floatAmplitude = p.random(5, 15);
    this.floatFrequency = p.random(0.001, 0.003);
  }
  
  update() {
    const p = this.p;
    
    // Обновляем позицию
    this.x += this.vx;
    this.y += this.vy + Math.sin(p.frameCount * this.floatFrequency + this.floatOffset) * 0.3;
    
    // Обновляем угол
    this.angle += this.rotationSpeed;
    
    // Проверяем границы
    if (this.x < this.width/2 || this.x > p.width - this.width/2) {
      this.vx *= -1;
    }
    if (this.y < this.height/2 || this.y > p.height - this.height/2) {
      this.vy *= -1;
    }
    
    // Обновляем эффект парения
    const floatY = Math.sin(p.frameCount * this.floatFrequency + this.floatOffset) * this.floatAmplitude;
    this.displayY = this.y + floatY;
    
    // Если карта наведена, увеличиваем ее
    if (this.hovered) {
      this.scale = p.lerp(this.scale, 1.2, 0.1);
      this.opacity = p.lerp(this.opacity, 1, 0.1);
    } else {
      this.scale = p.lerp(this.scale, 1, 0.1);
      this.opacity = p.lerp(this.opacity, 0.8, 0.1);
    }
  }
  
  display() {
    const p = this.p;
    
    p.push();
    p.translate(this.x, this.displayY);
    p.rotate(this.angle);
    p.scale(this.scale);
    
    // Рисуем карту
    p.noStroke();
    p.fill(this.data.color + parseInt(this.opacity * 255).toString(16));
    
    if (this.image && this.image.width > 0) {
      // Если изображение загружено, рисуем его
      p.image(this.image, -this.width/2, -this.height/2, this.width, this.height);
    } else {
      // Иначе рисуем заглушку
      p.rect(-this.width/2, -this.height/2, this.width, this.height, 10);
      
      // Рисуем рамку
      p.noFill();
      p.stroke(COLOR_PALETTE.beigeParchment + '80');
      p.strokeWeight(3);
      p.rect(-this.width/2 + 5, -this.height/2 + 5, this.width - 10, this.height - 10, 7);
      
      // Рисуем название карты
      p.fill(COLOR_PALETTE.beigeParchment);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(this.data.name, 0, 0);
      
      // Рисуем символизм
      p.textSize(12);
      p.text(this.data.symbolism, 0, 30);
    }
    
    // Рисуем свечение при наведении
    if (this.hovered) {
      p.noFill();
      p.stroke(COLOR_PALETTE.moonBlue + '80');
      p.strokeWeight(5);
      p.rect(-this.width/2 - 5, -this.height/2 - 5, this.width + 10, this.height + 10, 15);
    }
    
    p.pop();
  }
  
  checkHover(mouseX, mouseY) {
    // Проверяем, находится ли мышь над картой
    const dx = mouseX - this.x;
    const dy = mouseY - this.displayY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Учитываем поворот карты и масштаб при проверке
    const effectiveRadius = Math.max(this.width, this.height) / 2 * this.scale;
    
    this.hovered = distance < effectiveRadius;
    return this.hovered;
  }
  
  onClick(callback) {
    if (this.hovered) {
      callback(this.data);
      return true;
    }
    return false;
  }
}

// Класс для частиц лунной пыли
class MoonDustParticle {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = p.random(1, 3);
    this.opacity = p.random(0.3, 0.7);
    this.color = p.random() > 0.5 ? COLOR_PALETTE.moonBlue : COLOR_PALETTE.beigeParchment;
    
    // Скорость и направление
    this.vx = p.random(-0.5, 0.5);
    this.vy = p.random(-0.5, 0.5);
    
    // Время жизни
    this.lifespan = p.random(100, 300);
    this.age = 0;
  }
  
  update() {
    // Обновляем позицию
    this.x += this.vx;
    this.y += this.vy;
    
    // Увеличиваем возраст
    this.age++;
    
    // Обновляем прозрачность в зависимости от возраста
    if (this.age < 30) {
      this.opacity = this.p.map(this.age, 0, 30, 0, this.opacity);
    } else if (this.age > this.lifespan - 30) {
      this.opacity = this.p.map(this.age, this.lifespan - 30, this.lifespan, this.opacity, 0);
    }
    
    // Добавляем небольшое случайное движение
    this.vx += this.p.random(-0.03, 0.03);
    this.vy += this.p.random(-0.03, 0.03);
    
    // Ограничиваем скорость
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 1) {
      this.vx = this.vx / speed;
      this.vy = this.vy / speed;
    }
  }
  
  display() {
    const p = this.p;
    
    p.noStroke();
    p.fill(this.color + parseInt(this.opacity * 255).toString(16));
    
    // Рисуем частицу с размытием для эффекта свечения
    p.circle(this.x, this.y, this.size);
    p.fill(this.color + parseInt(this.opacity * 0.5 * 255).toString(16));
    p.circle(this.x, this.y, this.size * 1.5);
    p.fill(this.color + parseInt(this.opacity * 0.2 * 255).toString(16));
    p.circle(this.x, this.y, this.size * 2.5);
  }
  
  isDead() {
    return this.age >= this.lifespan;
  }
}

const FloatingTarotCards = ({ onCardClick, currentScreen }) => {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const cardsRef = useRef([]);
  const particlesRef = useRef([]);
  const lastInteractionRef = useRef(0);
  
  useEffect(() => {
    // Создаем экземпляр P5
    const sketch = (p) => {
      let canvas;
      let cards = [];
      let particles = [];
      
      p.setup = () => {
        // Создаем холст на всю ширину контейнера
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        canvas = p.createCanvas(width, height);
        canvas.parent(container);
        
        // Создаем карты
        cards = TAROT_CARDS.map(cardData => 
          new TarotCard(p, cardData, width, height)
        );
        cardsRef.current = cards;
        
        // Создаем начальные частицы
        for (let i = 0; i < 50; i++) {
          particles.push(new MoonDustParticle(p, p.random(width), p.random(height)));
        }
        particlesRef.current = particles;
        
        // Обработчики событий
        canvas.mousePressed(() => {
          let cardClicked = false;
          
          // Проверяем клик по картам в обратном порядке (верхние карты первыми)
          for (let i = cards.length - 1; i >= 0; i--) {
            if (cards[i].onClick((data) => {
              if (onCardClick && data.section) {
                onCardClick(data.section);
              }
            })) {
              cardClicked = true;
              break;
            }
          }
          
          // Если не кликнули по карте, создаем частицы
          if (!cardClicked) {
            createParticlesBurst(p.mouseX, p.mouseY, 20);
            lastInteractionRef.current = p.frameCount;
          }
        });
        
        canvas.mouseMoved(() => {
          // Обновляем состояние наведения для карт
          for (const card of cards) {
            card.checkHover(p.mouseX, p.mouseY);
          }
        });
      };
      
      p.draw = () => {
        // Прозрачный фон
        p.clear();
        
        // Обновляем и отображаем частицы
        for (let i = particles.length - 1; i >= 0; i--) {
          particles[i].update();
          particles[i].display();
          
          // Удаляем мертвые частицы
          if (particles[i].isDead()) {
            particles.splice(i, 1);
          }
        }
        
        // Добавляем новые частицы с небольшой вероятностью
        if (p.random() < 0.1 && particles.length < 100) {
          particles.push(new MoonDustParticle(p, p.random(p.width), p.random(p.height)));
        }
        
        // Обновляем и отображаем карты
        for (const card of cards) {
          card.update();
          card.display();
        }
        
        // Создаем частицы при движении мыши с задержкой
        if (p.frameCount % 5 === 0 && p.frameCount - lastInteractionRef.current < 30) {
          createParticlesBurst(p.mouseX, p.mouseY, 1);
        }
      };
      
      p.windowResized = () => {
        // Изменяем размер холста при изменении размера окна
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;
        p.resizeCanvas(width, height);
      };
      
      // Функция для создания взрыва частиц
      const createParticlesBurst = (x, y, count) => {
        for (let i = 0; i < count; i++) {
          const particle = new MoonDustParticle(p, x, y);
          particles.push(particle);
        }
        
        // Ограничиваем количество частиц
        while (particles.length > 100) {
          particles.shift();
        }
      };
    };
    
    // Lazy import p5 at runtime
    const initP5 = async () => {
      try {
        if (!P5Constructor) {
          const mod = await import('p5');
          P5Constructor = mod.default || mod;
        }
        p5InstanceRef.current = new P5Constructor(sketch);
      } catch (e) {
        console.error('Не удалось загрузить p5:', e);
      }
    };
    initP5();
    
    // Очистка при размонтировании
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, [onCardClick]);
  
  // Эффект для анимации карт при смене экрана
  useEffect(() => {
    if (cardsRef.current.length > 0) {
      // Находим карту, соответствующую текущему экрану
      const activeCard = cardsRef.current.find(card => card.data.section === currentScreen);
      
      if (activeCard) {
        // Анимируем активную карту
        anime({
          targets: activeCard,
          scale: [1, 1.3, 1],
          opacity: [0.8, 1, 0.8],
          duration: 1500,
          easing: 'easeInOutQuad'
        });
      }
    }
  }, [currentScreen]);
  
  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
};

export default FloatingTarotCards; 