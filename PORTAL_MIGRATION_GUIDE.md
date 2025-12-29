# 🔄 Гид по миграции портальной системы

## ⚠️ Важные изменения в архитектуре

Портальная система была **полностью переработана** для создания правильного пользовательского опыта:

### ❌ Старый подход (неправильный)
```javascript
// Портал привязан к кнопке
<BalanceButton 
  portalProgress={portalCharge}
  portalOpen={portalOpen}
  onPortalOpen={() => setShowPortalUI(true)}
/>

// Дублирующая кнопка портала
<button onClick={() => setShowPortalUI(true)}>
  🌀 Открыть портал
</button>
```

### ✅ Новый подход (правильный)
```javascript
// Весь экран как портальное пространство
<div 
  className={`farm-screen ${portalCharge >= 0.8 ? 'portal-ready' : ''}`}
  onClick={handleScreenClick}
  style={{ cursor: portalCharge >= 0.8 ? 'pointer' : 'default' }}
>
  {/* Магическое свечение при готовности */}
  {portalCharge >= 0.8 && (
    <div className="portal-ready-overlay" />
  )}
  
  {/* Инструкция пользователю */}
  {portalCharge >= 0.8 && (
    <div className="portal-instruction">
      ✨ Кликните в любое место для открытия портала ✨
    </div>
  )}
  
  {/* Обычный контент */}
  <BalanceButton onTap={handleEnergyTap} /> {/* Убрали портальные пропсы */}
  
  {/* Кинематографический портал */}
  {showAdvancedPortal && (
    <AdvancedPortalManager
      isOpen={showAdvancedPortal}
      clickPosition={portalClickPosition}
      onComplete={handlePortalComplete}
    />
  )}
</div>
```

## 🚀 Пошаговая миграция

### Шаг 1: Обновите импорты
```javascript
// Удалите старые импорты
// import PortalGateway from '../components/PortalGateway'; ❌

// Добавьте новый импорт
import AdvancedPortalManager from '../components/AdvancedPortalManager'; ✅
```

### Шаг 2: Обновите состояния
```javascript
// Добавьте новые состояния
const [showAdvancedPortal, setShowAdvancedPortal] = useState(false);
const [portalClickPosition, setPortalClickPosition] = useState(null);

// Сохраните существующие
const [portalCharge, setPortalCharge] = useState(0);
```

### Шаг 3: Создайте обработчик клика по экрану
```javascript
const handleScreenClick = (event) => {
  // Игнорируем клики по кнопкам и другим UI элементам
  if (event.target.closest('button') || 
      event.target.closest('.zone-selector') ||
      event.target.closest('.modal-overlay')) {
    return;
  }

  // Открываем портал при достаточной зарядке
  if (portalCharge >= 0.8 && !showAdvancedPortal) {
    setPortalClickPosition({ x: event.clientX, y: event.clientY });
    setShowAdvancedPortal(true);
    setPortalCharge(0); // Сбрасываем заряд
    
    // Воспроизводим событие
    window.dispatchEvent(new CustomEvent('portal-opened', { 
      detail: { x: event.clientX, y: event.clientY, source: 'YourScreen' } 
    }));
  }
};
```

### Шаг 4: Обновите рендер компонента
```javascript
// Оберните ваш экран в портальную зону
<div 
  className={`your-screen ${portalCharge >= 0.8 ? 'portal-ready' : ''}`}
  onClick={handleScreenClick}
  style={{
    cursor: (portalCharge >= 0.8) ? 'pointer' : 'default',
    position: 'relative' // Важно для overlay
  }}
>
  {/* Добавьте портальные индикаторы */}
  {portalCharge >= 0.8 && (
    <>
      <div className="portal-ready-overlay" style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle, rgba(168,199,250,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 1,
        animation: 'portalReadyPulse 3s ease-in-out infinite'
      }} />
      
      <div className="portal-instruction" style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#A8C7FA',
        fontSize: '18px',
        textShadow: '0 0 20px currentColor',
        pointerEvents: 'none',
        zIndex: 10
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>
          ✨ Портал готов к открытию ✨
        </div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          Кликните в любое место экрана
        </div>
      </div>
    </>
  )}

  {/* Ваш обычный контент */}
  <YourNormalContent />

  {/* Новый кинематографический портал */}
  {showAdvancedPortal && (
    <AdvancedPortalManager
      isOpen={showAdvancedPortal}
      clickPosition={portalClickPosition}
      onClose={() => {
        setShowAdvancedPortal(false);
        setPortalClickPosition(null);
      }}
      onComplete={(result) => {
        // Обработка результатов портала
        handlePortalReward(result);
        setShowAdvancedPortal(false);
        setPortalClickPosition(null);
      }}
    />
  )}
</div>
```

### Шаг 5: Добавьте CSS анимации
```css
/* Добавьте эти стили в ваш CSS файл или в <style jsx> */
@keyframes portalReadyPulse {
  0%, 100% { 
    opacity: 0.1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.2;
    transform: scale(1.02);
  }
}

.portal-instruction {
  font-family: serif;
  font-weight: bold;
  letter-spacing: 1px;
  animation: portalInstructionFloat 4s ease-in-out infinite;
}

@keyframes portalInstructionFloat {
  0%, 100% { 
    transform: translate(-50%, -50%) translateY(0px);
    opacity: 0.8;
  }
  50% { 
    transform: translate(-50%, -50%) translateY(-10px);
    opacity: 1;
  }
}
```

## 🧹 Что нужно удалить

### Удалите старые компоненты:
```javascript
// Удалите эти строки
{showPortalUI && (
  <div className="modal-overlay">
    <button onClick={() => setShowPotionLab(true)}>Алхимия</button>
    <button onClick={() => setShowCrystalMine(true)}>Кристаллы</button>
  </div>
)}

// Удалите PortalGateway
<PortalGateway isVisible={true} ... />

// Удалите портальные пропсы из BalanceButton
<BalanceButton 
  portalProgress={portalCharge}  // ❌ Удалить
  portalOpen={portalOpen}        // ❌ Удалить  
  onPortalOpen={...}             // ❌ Удалить
/>
```

### Удалите дублирующие кнопки:
```javascript
// ❌ Удалите эти кнопки
<button onClick={() => setShowPortalUI(true)}>
  🌀 Открыть портал
</button>
```

## ✅ Проверочный список миграции

- [ ] Обновлены импорты (AdvancedPortalManager вместо PortalGateway)
- [ ] Добавлены новые состояния (showAdvancedPortal, portalClickPosition)
- [ ] Создан обработчик handleScreenClick
- [ ] Экран обернут в портальную зону с onClick
- [ ] Добавлены портальные индикаторы (overlay и instruction)
- [ ] Удалены старые портальные пропсы из BalanceButton
- [ ] Удалены дублирующие кнопки портала
- [ ] Добавлены CSS анимации
- [ ] Протестирована работа на мобильных устройствах

## 🎯 Результат миграции

После миграции пользователи получат:

✨ **Полноэкранное портальное пространство** вместо ограниченной кнопки  
🎬 **Кинематографические переходы** из любой точки экрана  
🌟 **Магическую атмосферу** с индикаторами готовности портала  
📱 **Улучшенный мобильный опыт** с haptic feedback  
🏆 **Премиальные награды** от портальных активностей

## ❓ Часто задаваемые вопросы

**В: Почему нужно было менять архитектуру?**
О: Старая система привязывала портал к кнопке, ограничивая его возможности. Новая система делает весь экран магическим пространством, что создает правильный пользовательский опыт уровня AAA-игр.

**В: Будет ли работать на старых устройствах?**
О: Да! Система автоматически адаптируется под производительность устройства, отключая сложные эффекты на слабых GPU.

**В: Как пользователь поймет, что портал готов?**
О: При зарядке ≥80% весь экран начинает магически светиться, появляется инструкция в центре, и курсор меняется на указатель.

**В: Что если пользователь случайно кликнет?**
О: Система игнорирует клики по кнопкам и другим UI элементам, реагируя только на клики по свободному пространству.

---

**Готово!** 🎉 Ваша портальная система теперь работает как настоящее магическое пространство!
