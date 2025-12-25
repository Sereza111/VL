import React, { useEffect, useState } from 'react';
import './GothicBalance.css';

/**
 * GothicBalance — компактный интерактивный блок баланса для шапки
 * Темная эстетика, белые акценты, без золота. Клик — открывает детали.
 */
const GothicBalance = ({ balance = 0, incomePerHour = 0, onClick, change, symbol = '✦', progress = 0 }) => {
  const [angle, setAngle] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Мягкий пульс при изменении баланса
  useEffect(() => {
    if (change !== null && change !== undefined) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      return () => clearTimeout(t);
    }
  }, [change]);

  const handleClick = () => {
    setAngle((a) => (a + 120) % 360);
    if (typeof onClick === 'function') onClick();
  };

  const clamped = Math.max(0, Math.min(1, progress || 0));

  return (
    <button
      className={`gothic-balance ${pulse ? 'pulse' : ''}`}
      onClick={handleClick}
      title="Открыть детали баланса"
    >
      <div 
        className="orb" 
        style={{ ['--angle']: `${angle}deg`, ['--progressDeg']: `${clamped * 360}deg` }}
      >
        <div className="orb-core" />
        <div className="orb-symbol">{symbol}</div>
        {/* тонкие метки по окружности */}
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="tick" style={{ ['--i']: i }} />
        ))}
      </div>

      <div className="numbers">
        <div className="value">{balance.toFixed(2)} ✦</div>
        {incomePerHour > 0 && (
          <div className="income">+{incomePerHour.toFixed(2)} VL/час</div>
        )}
      </div>

      {change && (
        <div className={`delta ${String(change).startsWith('-') ? 'down' : 'up'}`}>{change}</div>
      )}
    </button>
  );
};

export default GothicBalance;


