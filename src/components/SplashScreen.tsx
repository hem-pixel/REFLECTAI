import React, { useEffect, useState, useRef } from 'react';
import reflectAiLogo from '../assets/reflectai-logo.png';

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

/**
 * Official ReflectAI Startup Splash Screen.
 *
 * Guaranteed Startup Timeline:
 * - 0ms: Cream background (#fcf9f4) appears.
 * - 100ms: Logo starts appearing.
 * - 100ms → 600ms: Logo fades in and scales (opacity: 0 → 1, scale: 0.85 → 1).
 * - 600ms → 900ms: Subtle logo glow and pulse (scale: 1.03, soft aura glow).
 * - 900ms: ReflectAI wordmark appears.
 * - 1000ms: "Think • Reflect • Grow" tagline appears.
 * - 1200ms: Hold briefly.
 * - 1200ms → 1600ms: Splash screen smoothly fades out (opacity: 1 → 0).
 * - 1600ms: Callback onComplete() unmounts splash screen and reveals application.
 *
 * Fully respects prefers-reduced-motion and guards against layout shift or flicker.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 1200,
}) => {
  // Animation milestone states
  const [logoVisible, setLogoVisible] = useState(false);
  const [logoPulsing, setLogoPulsing] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [screenFadingOut, setScreenFadingOut] = useState(false);

  // Check prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);

  // Fallback image source in case bundler URL differs in preview
  const [imgSrc, setImgSrc] = useState<string>(reflectAiLogo || '/reflectai-logo.png');

  // Track if onComplete has been called to prevent duplicate triggers
  const completedRef = useRef(false);

  useEffect(() => {
    // Detect prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
    }

    const timers: NodeJS.Timeout[] = [];

    // 100ms: Logo starts appearing (100ms -> 600ms)
    timers.push(
      setTimeout(() => {
        setLogoVisible(true);
      }, 100)
    );

    // 600ms -> 900ms: Subtle logo glow & pulse
    timers.push(
      setTimeout(() => {
        setLogoPulsing(true);
      }, 600)
    );

    // 900ms: ReflectAI wordmark appears
    timers.push(
      setTimeout(() => {
        setLogoPulsing(false);
        setTitleVisible(true);
      }, 900)
    );

    // 1000ms: "Think • Reflect • Grow" tagline appears
    timers.push(
      setTimeout(() => {
        setTaglineVisible(true);
      }, 1000)
    );

    // 1200ms: Hold briefly, then initiate fade out (1200ms -> 1600ms)
    const fadeOutStart = Math.max(1200, minDurationMs);
    timers.push(
      setTimeout(() => {
        setScreenFadingOut(true);
      }, fadeOutStart)
    );

    // 1600ms: Splash sequence finished, reveal application
    const totalDuration = fadeOutStart + 400; // 400ms fadeout
    timers.push(
      setTimeout(() => {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
      }, totalDuration)
    );

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [minDurationMs, onComplete]);

  return (
    <div
      id="reflectai-splash-screen"
      role="status"
      aria-label="ReflectAI loading"
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center select-none px-4"
      style={{
        backgroundColor: '#fcf9f4',
        backgroundImage: 'radial-gradient(ellipse at 50% 45%, #f5ece2 0%, #fcf9f4 75%)',
        opacity: screenFadingOut ? 0 : 1,
        transition: 'opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: screenFadingOut ? 'none' : 'auto',
      }}
    >
      {/* Centered Brand Column */}
      <div className="flex flex-col items-center text-center max-w-xs sm:max-w-sm md:max-w-md w-full">
        {/* Logo Container with 100ms-600ms fade/scale and 600ms-900ms subtle glow/pulse */}
        <div className="relative mb-5 sm:mb-6 flex items-center justify-center">
          {/* Subtle Ambient Halo Glow */}
          <div
            className="absolute inset-0 rounded-full blur-2xl bg-[#ebdcd0]/70 -z-10 pointer-events-none transition-all duration-300 ease-out"
            style={{
              transform: logoPulsing && !reducedMotion ? 'scale(1.35)' : 'scale(1.15)',
              opacity: logoVisible ? 0.75 : 0,
            }}
            aria-hidden="true"
          />

          {/* Official ReflectAI Logo Asset */}
          <div
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 flex items-center justify-center"
            style={{
              opacity: logoVisible ? 1 : 0,
              transform: reducedMotion
                ? 'none'
                : logoPulsing
                ? 'scale(1.03)'
                : logoVisible
                ? 'scale(1)'
                : 'scale(0.85)',
              transition: reducedMotion
                ? 'opacity 500ms ease-out'
                : 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              filter: logoPulsing && !reducedMotion ? 'drop-shadow(0 8px 18px rgba(139, 69, 19, 0.22))' : 'drop-shadow(0 4px 10px rgba(90, 40, 10, 0.12))',
            }}
          >
            <img
              id="reflectai-splash-logo-img"
              src={imgSrc}
              alt="ReflectAI Official Logo"
              onError={() => {
                // If bundler relative path fails, try root-relative fallback
                if (imgSrc !== '/reflectai-logo.png') {
                  setImgSrc('/reflectai-logo.png');
                }
              }}
              className="w-full h-full object-contain select-none pointer-events-none rounded-3xl"
              style={{
                aspectRatio: '1 / 1',
              }}
            />
          </div>
        </div>

        {/* 900ms: ReflectAI Wordmark */}
        <h1
          id="reflectai-splash-title"
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#3E2723] leading-none mb-2.5"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: reducedMotion
              ? 'none'
              : titleVisible
              ? 'translateY(0)'
              : 'translateY(8px)',
            transition: reducedMotion
              ? 'opacity 350ms ease-out'
              : 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1), transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <span>Reflect</span>
          <span className="text-[#8B4513] font-serif">AI</span>
        </h1>

        {/* 1000ms: "Think • Reflect • Grow" Tagline */}
        <p
          id="reflectai-splash-tagline"
          className="font-sans text-xs sm:text-sm font-semibold tracking-[0.24em] uppercase text-[#A67C52] mb-6"
          style={{
            opacity: taglineVisible ? 1 : 0,
            transform: reducedMotion
              ? 'none'
              : taglineVisible
              ? 'translateY(0)'
              : 'translateY(6px)',
            transition: reducedMotion
              ? 'opacity 300ms ease-out'
              : 'opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          Think <span className="text-[#8B4513]/60">•</span> Reflect{' '}
          <span className="text-[#8B4513]/60">•</span> Grow
        </p>

        {/* Subtle Minimal Accent Line */}
        <div
          className="w-24 sm:w-28 h-[2px] bg-[#e2d7cb] rounded-full overflow-hidden relative"
          style={{
            opacity: taglineVisible ? 0.8 : 0,
            transition: 'opacity 300ms ease-out',
          }}
        >
          <div className="h-full w-full bg-gradient-to-r from-[#8B4513] via-[#A67C52] to-[#8B4513] rounded-full" />
        </div>
      </div>
    </div>
  );
};
