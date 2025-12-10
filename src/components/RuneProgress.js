import React, { useMemo } from 'react';

const RuneProgress = ({ size = 120, stroke = 6, progress = 0, hue = 210, className = '' }) => {
  const r = useMemo(() => (size - stroke) / 2, [size, stroke]);
  const c = useMemo(() => 2 * Math.PI * r, [r]);
  const dash = useMemo(() => Math.max(0, Math.min(1, progress)) * c, [c, progress]);
  const rest = useMemo(() => c - dash, [c, dash]);
  const grdId = useMemo(() => `rune-grad-${hue}-${size}`, [hue, size]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden>
      <defs>
        <linearGradient id={grdId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`hsl(${hue}, 80%, 70%)`} />
          <stop offset="100%" stopColor={`hsl(${(hue+60)%360}, 80%, 60%)`} />
        </linearGradient>
      </defs>
      <g transform={`translate(${size/2}, ${size/2})`}>
        <circle r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          r={r}
          fill="none"
          stroke={`url(#${grdId})`}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${rest}`}
          strokeLinecap="round"
          transform="rotate(-90)"
        />
        {/* Runes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <text key={i} x={0} y={-r + 12} fill={`hsl(${(hue+ i*10)%360}, 80%, 75%)`} fontSize="10" textAnchor="middle" transform={`rotate(${(i/8)*360})`}>
            ✦
          </text>
        ))}
      </g>
    </svg>
  );
};

export default React.memo(RuneProgress);


