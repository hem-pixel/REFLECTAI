import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Star,
  Plus,
} from 'lucide-react';
import type { AppView } from '../types';

interface MobileBottomNavProps {
  activeView: AppView;
  onNavigateView: (view: AppView) => void;
  onNewEntry: () => void;
  isTypingInEditor?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavigateView,
  onNewEntry,
  isTypingInEditor = false,
}) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Detect virtual keyboard on mobile devices to prevent any overlap
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        // If viewport height significantly contracts compared to window height, keyboard is open
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setIsKeyboardVisible(heightDiff > 140);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'TEXTAREA' ||
          (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'checkbox'))
      ) {
        setIsKeyboardVisible(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const shouldHide = isKeyboardVisible || isTypingInEditor;
  // Prominent full-width "+ New Reflection" button sits above bottom nav when not in active reflection editor
  const showNewReflectionCTA = activeView !== 'editor';

  const navItems = [
    {
      view: 'dashboard' as AppView,
      label: 'Today',
      icon: LayoutDashboard,
      isActive: activeView === 'dashboard',
    },
    {
      view: 'history' as AppView,
      label: 'History',
      icon: MessageSquare,
      isActive: activeView === 'history',
    },
    {
      view: 'insights' as AppView,
      label: 'Insights',
      icon: BarChart3,
      isActive: activeView === 'insights',
    },
    {
      view: 'favorites' as AppView,
      label: 'Favorites',
      icon: Star,
      isActive: activeView === 'favorites',
    },
  ];

  return (
    <div
      id="mobile-bottom-navigation-container"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-200 ease-in-out pointer-events-none ${
        shouldHide ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* 1. Prominent "+ New Reflection" CTA Button placed above bottom nav */}
      {showNewReflectionCTA && (
        <div className="px-4 pb-2.5 max-w-md mx-auto pointer-events-auto">
          <button
            id="mobile-cta-new-reflection"
            onClick={onNewEntry}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#9b4d36] py-3.5 px-4 text-sm font-semibold text-[#ffffff] shadow-[0_4px_14px_rgba(155,77,54,0.35)] hover:bg-[#833f2b] active:scale-[0.98] transition-all cursor-pointer touch-manipulation"
            aria-label="Start a New Reflection"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
            <span>New Reflection</span>
          </button>
        </div>
      )}

      {/* 2. Fixed Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        aria-label="ReflectAI Mobile Navigation"
        className="pointer-events-auto border-t border-[#e2d7cb] bg-[#fcf9f4]/95 backdrop-blur-md rounded-t-2xl sm:rounded-t-3xl shadow-[0_-4px_20px_rgba(40,34,32,0.06)] px-2 pt-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isFav = item.view === 'favorites';

            return (
              <button
                key={item.view}
                id={`mobile-nav-${item.view}`}
                onClick={() => onNavigateView(item.view)}
                className={`group flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer min-h-[48px] touch-manipulation select-none relative ${
                  item.isActive
                    ? 'text-[#9b4d36] font-semibold bg-[#f2ebe1]'
                    : 'text-[#6e6259] hover:text-[#282220] hover:bg-[#f2ebe1]/50'
                }`}
                aria-current={item.isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`h-5 w-5 transition-transform duration-150 ${
                      item.isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                    } ${isFav && item.isActive ? 'fill-[#9b4d36]' : ''}`}
                  />
                  {item.isActive && (
                    <span className="absolute -top-1 right-[-4px] w-1.5 h-1.5 rounded-full bg-[#9b4d36]" />
                  )}
                </div>
                <span className="text-[10px] sm:text-[11px] leading-tight tracking-tight mt-0.5 whitespace-nowrap text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
