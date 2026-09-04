import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  BookOpen,
  PanelLeft,
  ChevronDown,
  Shield,
  LayoutDashboard,
  Star,
  Check,
} from 'lucide-react';
import type { UserProfile, AppView } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { ReflectAIMark } from './ReflectAILogo';

interface HeaderProps {
  user: UserProfile | null;
  activeView?: AppView;
  onSignOut: () => void;
  onOpenThreatModel: () => void;
  onNewEntry: () => void;
  onNavigateView?: (view: AppView) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeView,
  onSignOut,
  onOpenThreatModel,
  onNewEntry,
  onNavigateView,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 h-14 sm:h-16 shrink-0 border-b border-[#e2d7cb] bg-[#fcf9f4]/95 backdrop-blur-sm px-2.5 sm:px-6 flex items-center">
        <div className="w-full mx-auto flex max-w-7xl items-center justify-between min-w-0">
          {/* Brand identity & Sidebar Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            {/* Sidebar Collapse/Expand Toggle (Tablet & Desktop) */}
            {user && onToggleSidebar && (
              <button
                id="header-sidebar-toggle-btn"
                onClick={onToggleSidebar}
                className="hidden md:flex p-1.5 sm:p-2 rounded-xl text-[#6e6259] hover:text-[#282220] hover:bg-[#f2ebe1] transition-colors cursor-pointer shrink-0"
                title={isSidebarOpen ? "Collapse navigation sidebar" : "Expand navigation sidebar"}
                aria-label={isSidebarOpen ? "Collapse navigation sidebar" : "Expand navigation sidebar"}
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            )}

            <button
              onClick={() => onNavigateView && onNavigateView('dashboard')}
              className="flex items-center gap-1.5 sm:gap-2.5 text-left cursor-pointer group min-w-0"
              aria-label="ReflectAI Home"
            >
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#f2ebe1] border border-[#e2d7cb] shadow-xs shrink-0 group-hover:bg-[#e8dfd3] transition-colors p-0.5">
                <ReflectAIMark size="sm" className="w-full h-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="font-serif font-bold text-[#3E2723] tracking-tight text-base sm:text-lg shrink-0">
                    <span>Reflect</span><span className="text-[#8B4513]">AI</span>
                  </span>
                  <span className="inline-flex items-center rounded-md bg-[#f0dfd4] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#7d3621] border border-[#e2d7cb] whitespace-nowrap shrink-0">
                    Gemini 3.6 Flash
                  </span>
                </div>
                <p className="text-[11px] text-[#A67C52] hidden xl:block font-medium tracking-wide">
                  Think • Reflect • Grow
                </p>
              </div>
            </button>
          </div>

          {/* Actions & User State */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {user && (
              <button
                id="header-new-reflection-btn"
                onClick={onNewEntry}
                className="inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-[#9b4d36] p-1.5 sm:px-3.5 sm:py-1.5 text-xs sm:text-sm font-semibold text-[#ffffff] shadow-xs hover:bg-[#833f2b] transition-colors focus:outline-hidden cursor-pointer"
                title="New Reflection"
                aria-label="New Reflection"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline sm:ml-1.5">New Reflection</span>
              </button>
            )}

            <button
              id="threat-model-btn"
              onClick={onOpenThreatModel}
              className="inline-flex items-center justify-center rounded-lg sm:rounded-xl border border-[#e2d7cb] bg-[#f2ebe1] p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-[#282220] hover:bg-[#e8dfd3] transition-colors cursor-pointer"
              title="View Security & Threat Model architecture"
              aria-label="Security & Threat Model architecture"
            >
              <ShieldCheck className="h-4 w-4 text-[#9b4d36] shrink-0" />
              <span className="hidden md:inline xl:hidden md:ml-1.5">Security</span>
              <span className="hidden xl:inline xl:ml-1.5">Security Architecture</span>
            </button>

            {/* User Profile & Account Menu */}
            {user && (
              <div className="relative pl-1 border-l border-[#e2d7cb]" ref={menuRef}>
                <button
                  id="user-menu-btn"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-1 p-0.5 sm:p-1 rounded-lg sm:rounded-xl hover:bg-[#f2ebe1] transition-colors cursor-pointer"
                  aria-expanded={isMenuOpen}
                  aria-label="User account menu"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border border-[#e2d7cb] object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#f2ebe1] text-[#9b4d36] shrink-0">
                      <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  )}

                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-[#282220] truncate max-w-[110px]">
                      {user.displayName || 'Journaler'}
                    </p>
                    <p className="text-[10px] text-[#6e6259] truncate max-w-[110px]">
                      {user.email || 'Authenticated'}
                    </p>
                  </div>

                  <ChevronDown className="h-3.5 w-3.5 text-[#6e6259] hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[#e2d7cb] bg-[#fcf9f4] p-2 shadow-lg z-50 text-left">
                    <div className="px-3 py-2 border-b border-[#e2d7cb]">
                      <p className="text-xs font-semibold text-[#282220] truncate">
                        {user.displayName || 'User'}
                      </p>
                      <p className="text-[11px] text-[#6e6259] truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1 space-y-0.5 text-xs">
                      {onNavigateView && (
                        <>
                          <button
                            onClick={() => {
                              onNavigateView('dashboard');
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#282220] hover:bg-[#f2ebe1] transition-colors cursor-pointer"
                          >
                            <LayoutDashboard className="h-4 w-4 text-[#9b4d36]" />
                            <span>Dashboard Home</span>
                          </button>

                          <button
                            onClick={() => {
                              onNavigateView('privacy');
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#282220] hover:bg-[#f2ebe1] transition-colors cursor-pointer"
                          >
                            <Shield className="h-4 w-4 text-[#9b4d36]" />
                            <span>Privacy & Data Controls</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="pt-1 border-t border-[#e2d7cb]">
                      <button
                        id="menu-sign-out-btn"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsSignOutModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer text-xs font-medium"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sign Out Confirmation Modal */}
      <ConfirmModal
        isOpen={isSignOutModalOpen}
        title="Sign Out of ReflectAI?"
        message="Are you sure you want to sign out? Your saved reflections remain protected in your private Firestore database."
        confirmLabel="Sign Out"
        confirmVariant="primary"
        onConfirm={() => {
          setIsSignOutModalOpen(false);
          onSignOut();
        }}
        onCancel={() => setIsSignOutModalOpen(false)}
      />
    </>
  );
};
