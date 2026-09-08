import React, { useEffect, useState, useRef } from 'react';
import circleLogo from '../assets/reflectai-circle-logo.svg';

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

/**
 * Clean, minimal ReflectAI Splash Screen.
 *
 * Requirements:
 * - Full-screen warm cream / off-white background.
 * - Perfectly centered circular ReflectAI logo ONLY (no cards, boxes, frames, or text).
 * - Smooth fade-in + slight scale (90% -> 100%).
 * - Subtle breathing / soft aura effect.
 * - Stays visible for ~1.3-1.6 seconds, then smoothly fades out.
 * - Responsive: Mobile ~130px, Tablet ~160px, Desktop ~185px.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 1300,
}) => {
  const [logoMounted, setLogoMounted] = useState(false);
  const [screenFadingOut, setScreenFadingOut] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(circleLogo || '/reflectai-circle-logo.svg');

  const completedRef = useRef(false);

  useEffect(() => {
    // Respect accessibility prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
    }

    const timers: NodeJS.Timeout[] = [];

    // Trigger smooth fade-in + scale from 90% to 100% shortly after mount
    timers.push(
      setTimeout(() => {
        setLogoMounted(true);
      }, 50)
    );

    // After ~1.3s, start smooth fade-out
    const fadeOutStartTime = Math.max(1300, minDurationMs);
    timers.push(
      setTimeout(() => {
        setScreenFadingOut(true);
      }, fadeOutStartTime)
    );

    // When fade-out completes (~1.65s total), unmount splash screen
    const totalDuration = fadeOutStartTime + 350;
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
      className="fixed inset-0 z-[999999] flex items-center justify-center select-none"
      style={{
        backgroundColor: '#fcf9f4',
        backgroundImage: 'radial-gradient(ellipse at 50% 50%, #f5ece2 0%, #fcf9f4 75%)',
        opacity: screenFadingOut ? 0 : 1,
        transition: 'opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: screenFadingOut ? 'none' : 'auto',
      }}
    >
      {/* Scoped CSS animations for clean, hardware-accelerated breathing effect */}
      <style>{`
        @keyframes reflectai-breathing-glow {
          0%, 100% {
            transform: scale(1.12);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.24);
            opacity: 0.55;
          }
        }
        @keyframes reflectai-breathing-logo {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }
        .reflectai-glow-anim {
          animation: reflectai-breathing-glow 2.4s ease-in-out infinite;
        }
        .reflectai-breathe-anim {
          animation: reflectai-breathing-logo 2.4s ease-in-out infinite;
        }
      `}</style>

      {/* Centered Circular Logo Container */}
      <div className="relative flex items-center justify-center">
        {/* Subtle breathing glow / soft ambient aura */}
        <div
          className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-700 ease-in-out -z-10 ${
            logoMounted && !reducedMotion ? 'reflectai-glow-anim' : ''
          }`}
          style={{
            opacity: logoMounted ? 0.45 : 0,
            filter: 'blur(26px)',
            backgroundColor: '#c98a58',
          }}
          aria-hidden="true"
        />

        {/* Circular Logo Element */}
        <div
          className={`w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] md:w-[185px] md:h-[185px] aspect-square rounded-full flex items-center justify-center select-none ${
            logoMounted && !reducedMotion ? 'reflectai-breathe-anim' : ''
          }`}
          style={{
            opacity: logoMounted ? 1 : 0,
            transform: reducedMotion
              ? 'none'
              : logoMounted
              ? 'scale(1)'
              : 'scale(0.90)',
            transition: reducedMotion
              ? 'opacity 500ms ease-out'
              : 'opacity 500ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <img
            id="reflectai-splash-logo-img"
            src={imgSrc}
            alt="ReflectAI"
            onError={() => {
              // Fallback cascade: SVG -> PNG -> static public path
              if (imgSrc !== '/reflectai-circle-logo.png') {
                setImgSrc('/reflectai-circle-logo.png');
              }
            }}
            className="w-full h-full object-contain rounded-full select-none pointer-events-none"
            style={{
              aspectRatio: '1 / 1',
              filter: 'drop-shadow(0 6px 16px rgba(139, 69, 19, 0.16))',
            }}
          />
        </div>
      </div>
    </div>
  );
};
