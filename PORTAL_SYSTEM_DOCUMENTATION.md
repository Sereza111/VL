# Кинематографическая портальная система для knigavl.ru

## Обзор системы

Новая портальная система представляет собой многослойную анимационную платформу уровня AAA-игр, которая обеспечивает кинематографические переходы между различными мини-играми и активностями в веб-приложении knigavl.ru.

## Основные компоненты

### 1. AdvancedPortalManager.js
**Главный компонент портальной системы**

```javascript
import AdvancedPortalManager from './components/AdvancedPortalManager';

<AdvancedPortalManager
  isOpen={showPortal}
  clickPosition={{ x: 100, y: 200 }}
  onClose={() => setShowPortal(false)}
  onComplete={(result) => handlePortalComplete(result)}
/>
```

**Особенности:**
- WebGL-эффекты с частицами и энергетическими кольцами
- CSS 3D трансформации для эффекта разрыва пространства
- Fullscreen API с fallback для мобильных устройств
- Интеграция с AlchemyLab и другими мини-играми

### 2. PortalGateway.js
**Центральный шлюз для управления всеми порталами**

```javascript
import PortalGateway from './components/PortalGateway';

<PortalGateway
  isVisible={true}
  position="corner" // center, corner, top-center, custom
  theme="mystical" // mystical, cosmic, ethereal
  onEnergyReward={(reward) => updateBalance(reward)}
  onAddPotion={(potion) => addToInventory(potion)}
  onAddArtifact={(artifact) => addArtifact(artifact)}
  energyMultiplier={1.5}
  enableHapticFeedback={true}
/>
```

**Функциональность:**
- Автоматическое определение типа портала по времени суток
- Haptic feedback для мобильных устройств
- История портальных переходов
- Система множителей энергии

### 3. PortalReveal.js (Улучшенная версия)
**Совместимая версия с кинематографическим режимом**

```javascript
import PortalReveal from './components/PortalReveal';

<PortalReveal
  isOpen={portalReady}
  enableCinematicMode={true} // Включает кинематографические эффекты
  clickPosition={clickPos}
  onComplete={(result) => handleComplete(result)}
  fallbackToSimple={false} // Fallback для слабых устройств
/>
```

## Технические характеристики

### WebGL Шейдеры
- **Vertex Shader**: Обрабатывает позиции частиц с волновыми эффектами
- **Fragment Shader**: Создает магическое свечение с градиентными цветами
- **Fallback**: Canvas 2D для устройств без WebGL поддержки

### CSS 3D Анимации
```css
@keyframes portalSpaceRip {
  0% { transform: scale(0) rotateX(0deg) rotateY(0deg); }
  100% { transform: scale(1) rotateX(720deg) rotateY(720deg); }
}
```

### Fullscreen API
- Полная поддержка современных браузеров
- iOS Safari fallback через CSS positioning
- Автоматический exit при закрытии портала

## Интеграция в существующий код

### В FarmScreen.js
```javascript
// 1. Импортируем компоненты
import PortalGateway from '../components/PortalGateway';

// 2. Добавляем состояние
const [enableCinematicPortals, setEnableCinematicPortals] = useState(true);
const [artifacts, setArtifacts] = useState([]);

// 3. Создаем обработчики
const handlePortalEnergyReward = (reward) => {
  updateBalance(reward, reward * 0.2);
};

const handlePortalAddPotion = (potion) => {
  setPotions(prev => [...prev, { ...potion, fromPortal: true }]);
};

// 4. Рендерим портальный шлюз
{enableCinematicPortals && portalCharge >= 0.3 && (
  <PortalGateway
    isVisible={true}
    position="corner"
    onEnergyReward={handlePortalEnergyReward}
    onAddPotion={handlePortalAddPotion}
    onAddArtifact={handlePortalAddArtifact}
  />
)}
```

## Мобильная оптимизация

### Адаптивные настройки
- **Меньше частиц**: 60 вместо 120 на мобильных
- **Упрощенные эффекты**: Отключение сложных 3D трансформаций
- **Оптимизация GPU**: Автоматическое снижение качества шейдеров

### Haptic Feedback
```javascript
// Вибрация при активации портала
navigator.vibrate([30, 50, 30, 100, 30]); // Портальная вибрация
```

### Детекция устройства
```javascript
const isMobile = window.innerWidth <= 768 || 
  /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
```

## Производительность

### Оптимизации
- **60 FPS** на десктопе, **30 FPS** на мобильных
- **Memory management** для предотвращения утечек
- **Lazy loading** WebGL эффектов
- **Throttling** анимаций при сворачивании вкладки

### Fallback стратегии
```javascript
// WebGL не поддерживается
if (!this.gl) {
  this.fallback = true;
  this.animateFallback(); // Canvas 2D анимация
}
```

## Пользовательский опыт

### Доступность
- **Клавиатурная навигация**: Tab, Enter, Space
- **Screen readers**: ARIA-labels и роли
- **Высокий контраст**: Специальные CSS правила
- **Уменьшенная анимация**: `prefers-reduced-motion` поддержка

### Визуальные эффекты
- **Рунические символы** вращаются вокруг портала
- **Частицы энергии** взрываются при открытии
- **Магические ауры** создают атмосферу
- **Индикаторы прогресса** показывают готовность

## API Reference

### AdvancedPortalManager Props
| Prop | Type | Default | Описание |
|------|------|---------|----------|
| `isOpen` | boolean | false | Состояние открытия портала |
| `onClose` | function | null | Колбэк закрытия |
| `onComplete` | function | null | Колбэк завершения |
| `clickPosition` | object | null | {x, y} позиция клика |

### PortalGateway Props
| Prop | Type | Default | Описание |
|------|------|---------|----------|
| `isVisible` | boolean | true | Видимость шлюза |
| `position` | string | 'center' | Позиция на экране |
| `theme` | string | 'mystical' | Визуальная тема |
| `energyMultiplier` | number | 1.2 | Множитель энергии |
| `enableHapticFeedback` | boolean | true | Тактильная отдача |

### События
- `portal-opened`: Срабатывает при открытии портала
- `energy-collected`: Анимация сбора энергии
- `portal-closed`: Завершение портальной сессии

## Устранение неполадок

### Частые проблемы
1. **WebGL не загружается**: Проверьте поддержку браузера
2. **Fullscreen не работает**: Убедитесь в HTTPS протоколе
3. **Анимации тормозят**: Включите аппаратное ускорение
4. **Вибрация не работает**: Проверьте разрешения браузера

### Отладка
```javascript
// Включите детальное логирование
console.log('Portal state:', portalState);
console.log('WebGL support:', !!canvas.getContext('webgl'));
```

## Примеры использования

### Базовый портал
```javascript
const [showPortal, setShowPortal] = useState(false);

<AdvancedPortalManager
  isOpen={showPortal}
  onComplete={(result) => {
    console.log('Portal result:', result);
    setShowPortal(false);
  }}
/>
```

### Портал с кастомными эффектами
```javascript
<PortalGateway
  position="custom"
  customPosition={{ top: '100px', left: '200px' }}
  theme="cosmic"
  energyMultiplier={2.0}
  onEnergyReward={(reward) => {
    showNotification(`+${reward} энергии!`);
    updateBalance(reward);
  }}
/>
```

### Интеграция с мини-играми
```javascript
// AlchemyLab через портал
const handlePortalToAlchemy = () => {
  setShowPortal(true);
  setPortalDestination('alchemy');
};

<PortalReveal
  isOpen={portalReady}
  enableCinematicMode={true}
  onComplete={(result) => {
    if (result.type === 'brew') {
      addPotion(result.potion);
    }
  }}
/>
```

## Заключение

Кинематографическая портальная система обеспечивает премиальный пользовательский опыт с высокой производительностью и полной адаптивностью. Система спроектирована для легкой интеграции и расширения функциональности в будущем.

**Версия системы**: 1.0.0  
**Совместимость**: Chrome 70+, Firefox 65+, Safari 12+  
**Мобильная поддержка**: iOS 12+, Android 8+
