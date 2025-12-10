import React, { useMemo } from 'react';

// Generates inline SVG icons in a unified iridescent style
const GenerativeIcon = ({
  name = 'crystal',
  size = 24,
  stroke = 1.8,
  hue = 210,
  className = ''
}) => {
  const defs = useMemo(() => ({
    gradientId: `grad-${name}-${hue}`,
  }), [name, hue]);

  const strokeColor = `url(#${defs.gradientId})`;

  const path = useMemo(() => {
    switch (name) {
      case 'crystal':
        return (
          <g>
            <path d="M12 2 L18 8 L12 22 L6 8 Z" fill="none" stroke={strokeColor} />
            <path d="M12 2 L12 22" fill="none" stroke={strokeColor} />
            <path d="M6 8 L18 8" fill="none" stroke={strokeColor} />
          </g>
        );
      case 'potion':
        return (
          <g>
            <path d="M9 2 H15 M12 2 V7" fill="none" stroke={strokeColor} />
            <path d="M8 7 C6 10, 6 14, 12 20 C18 14, 18 10, 16 7 Z" fill="none" stroke={strokeColor} />
            <path d="M9 12 Q12 14 15 12" fill="none" stroke={strokeColor} />
          </g>
        );
      case 'alchemy':
        return (
          <g>
            <circle cx="12" cy="12" r="8" fill="none" stroke={strokeColor} />
            <path d="M12 4 L12 20" fill="none" stroke={strokeColor} />
            <path d="M4 12 L20 12" fill="none" stroke={strokeColor} />
          </g>
        );
      default:
        return (
          <g>
            <circle cx="12" cy="12" r="8" fill="none" stroke={strokeColor} />
          </g>
        );
    }
  }, [name, strokeColor]);

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id={defs.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={`hsl(${hue}, 80%, 70%)`} />
          <stop offset="100%" stopColor={`hsl(${(hue+60)%360}, 80%, 60%)`} />
        </linearGradient>
      </defs>
      {path}
    </svg>
  );
};

export default React.memo(GenerativeIcon);


