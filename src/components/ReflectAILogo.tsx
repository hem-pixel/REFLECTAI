import React from 'react';

export type LogoVariant = 'mark' | 'horizontal' | 'stacked' | 'app-icon' | 'light-variant' | 'dark-variant';
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ReflectAILogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  showTagline?: boolean;
  className?: string;
  id?: string;
}

/**
 * Official ReflectAI Brand Symbol (Head profile + growing plant + halo + sparkle)
 * Exact vector representation from the official brand identity.
 */
export const ReflectAIMark: React.FC<{
  size?: LogoSize;
  className?: string;
  theme?: 'terracotta' | 'white' | 'cream';
  withAura?: boolean;
}> = ({ size = 'md', className = '', theme = 'terracotta', withAura = true }) => {
  const pixelSizes: Record<LogoSize, number> = {
    xs: 24,
    sm: 32,
    md: 44,
    lg: 64,
    xl: 96,
    '2xl': 128,
  };

  const px = pixelSizes[size];

  // Theme color mapping
  const headColor = theme === 'white' ? '#ffffff' : theme === 'cream' ? '#F8F3E9' : '#8B4513';
  const plantColor = theme === 'terracotta' ? '#F8F3E9' : '#8B4513';
  const sparkleColor = theme === 'white' ? '#ffffff' : theme === 'cream' ? '#F8F3E9' : '#A67C52';
  const auraFill = theme === 'terracotta' ? '#ecdcd0' : 'rgba(255,255,255,0.15)';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="ReflectAI Official Logo Symbol"
    >
      <defs>
        {/* Soft aura gradient */}
        <radialGradient id="markAuraGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={auraFill} stopOpacity="0.8" />
          <stop offset="70%" stopColor={auraFill} stopOpacity="0.3" />
          <stop offset="100%" stopColor={auraFill} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1. Background Halo / Sun Aura */}
      {withAura && <circle cx="78" cy="82" r="54" fill="url(#markAuraGrad)" />}

      {/* 2. Human Head Profile (facing right) */}
      <path
        d="
          M 72 130
          C 67 127 59 118 55 106
          C 50 92 49 78 55 65
          C 61 52 73 42 88 42
          C 100 42 110 47 118 56
          C 122 61 124 67 124 72
          C 124 76 122 79 120 81
          C 122 82 128 87 131 91
          C 132 92 131 95 127 96
          C 125 97 122 97 122 100
          C 123 101 126 104 126 105
          C 126 108 122 109 121 110
          C 122 113 125 115 124 119
          C 122 123 118 125 113 127
          C 105 128 99 122 96 116
          C 94 116 91 122 86 126
          C 81 130 76 130 72 130 Z
        "
        fill={headColor}
      />

      {/* 3. Growing Plant inside the head */}
      <g fill={plantColor} stroke={plantColor} strokeLinecap="round" strokeLinejoin="round">
        {/* Central curved stem */}
        <path
          d="M 80 122 C 79 104 76 86 84 65 C 86 58 90 51 93 46"
          fill="none"
          strokeWidth="3.8"
        />

        {/* Top leaf */}
        <path
          d="M 93 46 C 95 41 99 40 103 42 C 103 46 100 51 95 54 C 93 51 92 48 93 46 Z"
          strokeWidth="0.5"
        />

        {/* Upper right leaf (facing forehead) */}
        <path
          d="M 85 66 C 91 62 100 62 107 66 C 105 71 99 76 90 75 C 86 71 85 67 85 66 Z"
          strokeWidth="0.5"
        />

        {/* Middle left leaf (facing back of head) */}
        <path
          d="M 80 80 C 74 75 65 76 58 81 C 61 86 67 90 76 87 C 78 84 80 81 80 80 Z"
          strokeWidth="0.5"
        />

        {/* Lower right leaf */}
        <path
          d="M 79 93 C 85 90 94 92 99 97 C 97 102 90 106 82 103 C 80 100 79 96 79 93 Z"
          strokeWidth="0.5"
        />

        {/* Bottom left leaf */}
        <path
          d="M 79 107 C 74 104 68 106 63 111 C 65 116 71 117 79 114 C 80 111 80 108 79 107 Z"
          strokeWidth="0.5"
        />
      </g>

      {/* 4. Four-Point Sparkle Star (✦) near forehead */}
      <path
        d="
          M 134 60
          Q 134 66 128 66
          Q 134 66 134 72
          Q 134 66 140 66
          Q 134 66 134 60 Z
        "
        fill={sparkleColor}
      />
    </svg>
  );
};

/**
 * Official ReflectAI App Icon (Squircle container matching the brand sheet)
 */
export const ReflectAIAppIcon: React.FC<{
  size?: LogoSize;
  variant?: 'main' | 'light' | 'dark';
  className?: string;
  id?: string;
}> = ({ size = 'md', variant = 'main', className = '', id }) => {
  const pixelSizes: Record<LogoSize, number> = {
    xs: 28,
    sm: 36,
    md: 48,
    lg: 64,
    xl: 96,
    '2xl': 128,
  };

  const px = pixelSizes[size];

  // Theme styling according to the official brand sheet
  const bgFill =
    variant === 'main'
      ? '#8B4513'
      : variant === 'light'
      ? '#F8F3E9'
      : '#3E2723';

  const strokeColor =
    variant === 'light'
      ? '#e2d7cb'
      : 'rgba(255, 255, 255, 0.15)';

  const markTheme =
    variant === 'main'
      ? 'cream'
      : variant === 'light'
      ? 'terracotta'
      : 'cream';

  return (
    <div
      id={id}
      style={{ width: px, height: px }}
      className={`relative inline-flex items-center justify-center shrink-0 rounded-[24%] overflow-hidden shadow-sm transition-transform ${className}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <rect width="128" height="128" rx="30" ry="30" fill={bgFill} />
        <rect
          x="0.75"
          y="0.75"
          width="126.5"
          height="126.5"
          rx="29.25"
          ry="29.25"
          stroke={strokeColor}
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center p-[10%]">
        <ReflectAIMark size={size} theme={markTheme} withAura={false} className="w-full h-full" />
      </div>
    </div>
  );
};

/**
 * ReflectAI Full Logo Component
 * Combines the official mark, wordmark, and tagline with strict typography.
 */
export const ReflectAILogo: React.FC<ReflectAILogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showTagline = true,
  className = '',
  id,
}) => {
  // Direct squircle app icon variants
  if (variant === 'app-icon') {
    return <ReflectAIAppIcon size={size} variant="main" className={className} id={id} />;
  }
  if (variant === 'light-variant') {
    return <ReflectAIAppIcon size={size} variant="light" className={className} id={id} />;
  }
  if (variant === 'dark-variant') {
    return <ReflectAIAppIcon size={size} variant="dark" className={className} id={id} />;
  }
  if (variant === 'mark') {
    return <ReflectAIMark size={size} className={className} />;
  }

  // Typography scale
  const textSizes = {
    xs: { title: 'text-sm', tag: 'text-[9px]' },
    sm: { title: 'text-base sm:text-lg', tag: 'text-[10px]' },
    md: { title: 'text-xl sm:text-2xl', tag: 'text-xs' },
    lg: { title: 'text-2xl sm:text-3xl', tag: 'text-sm' },
    xl: { title: 'text-4xl sm:text-5xl', tag: 'text-sm sm:text-base' },
    '2xl': { title: 'text-5xl sm:text-6xl', tag: 'text-base sm:text-lg' },
  };

  const isStacked = variant === 'stacked';

  return (
    <div
      id={id}
      className={`inline-flex ${
        isStacked ? 'flex-col items-center text-center' : 'items-center gap-2.5 sm:gap-3.5 text-left'
      } ${className}`}
    >
      {/* Official Mark */}
      <ReflectAIMark size={size} className={isStacked ? 'mb-2' : ''} />

      {/* Official Wordmark */}
      <div className="flex flex-col justify-center leading-none select-none">
        <div className={`font-serif tracking-tight font-semibold text-[#3E2723] ${textSizes[size].title}`}>
          <span>Reflect</span>
          <span className="text-[#8B4513] font-serif">AI</span>
        </div>

        {/* Official Tagline: Think • Reflect • Grow */}
        {showTagline && (
          <div
            className={`font-sans font-medium text-[#A67C52] tracking-[0.2em] uppercase mt-1 sm:mt-1.5 ${textSizes[size].tag}`}
          >
            Think <span className="text-[#8B4513]/60">•</span> Reflect <span className="text-[#8B4513]/60">•</span> Grow
          </div>
        )}
      </div>
    </div>
  );
};
