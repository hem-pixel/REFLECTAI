/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  signInWithGoogle,
  logoutUser,
  subscribeToAuth,
  subscribeToUserEntries,
  saveJournalEntry,
  deleteJournalEntry,
  deleteAllUserEntries,
} from './firebase';
import type { JournalEntry, UserProfile, ReflectionMode, MoodType, AppView } from './types';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { DashboardView } from './components/DashboardView';
import { InsightsView } from './components/InsightsView';
import { PrivacyView } from './components/PrivacyView';
import { HistoryView } from './components/HistoryView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ThreatModelModal } from './components/ThreatModelModal';
import { SplashScreen } from './components/SplashScreen';
import { Plus } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Startup splash screen state
  const [showSplash, setShowSplash] = useState(true);

  // Active view routing state
  const [activeView, setActiveView] = useState<AppView>('dashboard');

  // Firestore user entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // UI state
  // On tablet (<= 1024px), sidebar defaults to compact/collapsed (false); on desktop (> 1024px), it defaults to expanded (true)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024;
    }
    return false;
  });
  const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);

  // 1. Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user) {
        setActiveView('dashboard');
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to user's isolated Firestore entries when authenticated
  useEffect(() => {
    if (!currentUser) {
      setEntries([]);
      setActiveEntry(null);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      currentUser.uid,
      (fetchedEntries) => {
        setEntries(fetchedEntries);

        // If there's an active entry, keep it in sync without overwriting in-flight messages
        setActiveEntry((prev) => {
          if (!prev) {
            return fetchedEntries.length > 0 ? fetchedEntries[0] : null;
          }
          const updated = fetchedEntries.find((e) => e.id === prev.id);
          if (!updated) return prev;
          // Protect in-flight local message turns
          if (prev.messages.length > updated.messages.length) {
            return prev;
          }
          return updated;
        });
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setSaveError('Unable to sync with Firestore. Please check your network connection.');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Factory function for a new reflection
  const createBlankEntry = (userId: string, initialPrompt?: string, mood?: MoodType): JournalEntry => {
    return {
      id: 'reflection-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId,
      title: 'Untitled Reflection',
      initialPrompt: initialPrompt || '',
      mood: mood,
      mode: 'reflect',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Sign in handler
  const handleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      setActiveView('dashboard');
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err?.message || 'Authentication was cancelled or failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await logoutUser();
      setActiveEntry(null);
      setEntries([]);
      setActiveView('dashboard');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Create new reflection session
  const handleNewEntry = (initialPrompt?: string, mood?: MoodType) => {
    if (!currentUser) return;
    const newEntry = createBlankEntry(currentUser.uid, initialPrompt, mood);
    setActiveEntry(newEntry);
    setActiveView('editor');
  };

  // Select reflection from list or dashboard
  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setActiveView('editor');
  };

  // Save/Update entry in Firestore with non-blocking background capability and zero-data-loss
  const handleUpdateEntry = async (
    updated: JournalEntry,
    options?: { background?: boolean }
  ) => {
    if (!currentUser) return;

    // Optimistically update local active entry and entries list immediately
    setActiveEntry(updated);
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    // Local storage emergency backup to guarantee zero message loss
    try {
      localStorage.setItem(`reflectai_backup_${updated.id}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    const executeSave = async (retryCount = 0): Promise<void> => {
      setIsSaving(true);
      setSaveError(null);
      const tStart = performance.now();
      if (import.meta.env.DEV) {
        console.log('[PERF CLIENT] Firestore write start');
      }

      try {
        await saveJournalEntry(currentUser.uid, updated);
        setIsSaving(false);
        if (import.meta.env.DEV) {
          console.log(
            `[PERF CLIENT] Firestore write completed (${(performance.now() - tStart).toFixed(1)}ms)`
          );
        }
      } catch (err: any) {
        console.warn(`Firestore save attempt ${retryCount + 1} failed:`, err);
        if (retryCount < 2) {
          // Automatic retry after 2 seconds
          setTimeout(() => executeSave(retryCount + 1), 2000);
        } else {
          setIsSaving(false);
          setSaveError('Sync failed — retrying');
        }
        if (!options?.background) {
          throw err;
        }
      }
    };

    if (options?.background) {
      // Fire-and-forget in background without blocking
      executeSave();
      return;
    } else {
      await executeSave();
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (entry: JournalEntry) => {
    const updated: JournalEntry = {
      ...entry,
      favorite: !entry.favorite,
      updatedAt: new Date().toISOString(),
    };
    await handleUpdateEntry(updated);
  };

  // Delete entry from Firestore
  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    try {
      await deleteJournalEntry(currentUser.uid, entryId);
      if (activeEntry?.id === entryId) {
        const remaining = entries.filter((e) => e.id !== entryId);
        setActiveEntry(remaining.length > 0 ? remaining[0] : null);
        if (remaining.length === 0) {
          setActiveView('dashboard');
        }
      }
    } catch (err: any) {
      console.error('Delete entry failed:', err);
      setSaveError('Failed to delete entry from Firestore.');
    }
  };

  // Delete all user data (Right to Erasure)
  const handleDeleteAllData = async () => {
    if (!currentUser) return;
    await deleteAllUserEntries(currentUser.uid);
    setEntries([]);
    setActiveEntry(null);
    setActiveView('dashboard');
  };

  // Export all user reflections
  const handleExportAll = (format: 'json' | 'txt') => {
    if (!currentUser) return;
    const filename = `reflectai-export-${currentUser.uid.slice(0, 8)}-${
      new Date().toISOString().split('T')[0]
    }`;
    let content = '';
    let mimeType = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify(entries, null, 2);
      mimeType = 'application/json';
    } else {
      content = `REFLECTAI ARCHIVE - PRIVATE JOURNAL ENTRIES\nExported: ${new Date().toLocaleString()}\nUser: ${
        currentUser.displayName || currentUser.email
      }\nTotal Reflections: ${entries.length}\n\n==========================================\n\n`;
      entries.forEach((e, idx) => {
        content += `[ENTRY ${idx + 1}]: ${e.title || 'Untitled Reflection'}\n`;
        content += `Date: ${new Date(e.createdAt).toLocaleString()}\n`;
        content += `Mode: ${e.mode.toUpperCase()} | Mood: ${e.mood || 'Unspecified'} | Favorite: ${
          e.favorite ? 'Yes' : 'No'
        }\n`;
        if (e.initialPrompt) {
          content += `Initial Reflection: ${e.initialPrompt}\n`;
        }
        content += `\nConversation Turns:\n`;
        e.messages.forEach((m) => {
          content += `  [${m.role.toUpperCase()} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n  ${
            m.text
          }\n\n`;
        });
        if (e.microHabit) {
          content += `Personalized Micro-Habit: "${e.microHabit.text}" (Completed: ${
            e.microHabit.completed ? 'Yes' : 'No'
          })\n`;
        }
        content += `------------------------------------------\n\n`;
      });
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] flex flex-col bg-[#fcf9f4] text-[#282220] overflow-hidden font-sans relative">
      {/* 1. Root Level Startup Opening Experience */}
      {showSplash && (
        <SplashScreen
          onComplete={() => setShowSplash(false)}
          minDurationMs={1200}
        />
      )}

      {/* 2. Main Application Flow: Hidden during splash to prevent any flash of login or dashboard */}
      <div
        id="reflectai-main-app"
        className={`flex-1 flex flex-col min-h-0 overflow-hidden transition-opacity duration-300 ease-out ${
          showSplash ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'
        }`}
      >
        {/* Global Header */}
        <Header
          user={currentUser}
          activeView={activeView}
          onSignOut={handleSignOut}
          onOpenThreatModel={() => setIsThreatModalOpen(true)}
          onNewEntry={() => handleNewEntry()}
          onNavigateView={(view) => setActiveView(view)}
          onToggleSidebar={() => setIsSidebarExpanded((prev) => !prev)}
          isSidebarOpen={isSidebarExpanded}
        />

      {/* Main View Area */}
      {!currentUser ? (
        <div className="flex-1 overflow-y-auto">
          <LandingHero
            onSignIn={handleSignIn}
            isLoading={authLoading}
            error={authError}
          />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* Tablet & Desktop History & Navigation Sidebar (Compact icons-only or expanded) */}
          <HistorySidebar
            entries={entries}
            activeEntryId={activeEntry?.id || null}
            activeView={activeView}
            onSelectEntry={handleSelectEntry}
            onNewEntry={() => handleNewEntry()}
            onNavigateView={(view) => setActiveView(view)}
            onDeleteEntry={handleDeleteEntry}
            onToggleFavorite={handleToggleFavorite}
            isOpen={isSidebarExpanded}
            isExpanded={isSidebarExpanded}
            onToggleExpand={() => setIsSidebarExpanded((prev) => !prev)}
            onCloseMobile={() => setIsSidebarExpanded(false)}
          />

          {/* Dynamic Content Views */}
          <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#fcf9f4] relative">
            {activeView === 'dashboard' && (
              <DashboardView
                user={currentUser}
                entries={entries}
                onStartReflection={(prompt, mood) => handleNewEntry(prompt, mood)}
                onSelectEntry={handleSelectEntry}
                onNavigateInsights={() => setActiveView('insights')}
                onNavigateFavorites={() => setActiveView('favorites')}
                onUpdateEntry={handleUpdateEntry}
              />
            )}

            {activeView === 'insights' && (
              <InsightsView
                entries={entries}
                onSelectEntry={handleSelectEntry}
              />
            )}

            {activeView === 'privacy' && (
              <PrivacyView
                user={currentUser}
                entries={entries}
                onDeleteAllData={handleDeleteAllData}
                onExportAll={handleExportAll}
              />
            )}

            {/* History and Favorites View */}
            {(activeView === 'history' || activeView === 'favorites') && (
              <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                {/* On mobile: Render full-screen responsive HistoryView */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0 md:hidden">
                  <HistoryView
                    entries={entries}
                    activeEntryId={activeEntry?.id || null}
                    activeView={activeView}
                    onSelectEntry={(entry) => {
                      handleSelectEntry(entry);
                      setActiveView('editor');
                    }}
                    onNewEntry={() => handleNewEntry()}
                    onDeleteEntry={handleDeleteEntry}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>

                {/* On desktop: Render JournalEditor for the active entry or prompt selection */}
                <div className="hidden md:flex md:flex-1 md:flex-col md:min-w-0 md:min-h-0">
                  {activeEntry ? (
                    <JournalEditor
                      entry={activeEntry}
                      onUpdateEntry={handleUpdateEntry}
                      onDeleteEntry={handleDeleteEntry}
                      isSaving={isSaving}
                      saveError={saveError}
                      onClearSaveError={() => setSaveError(null)}
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                      <div className="max-w-sm rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-8 shadow-xs">
                        <p className="text-sm font-semibold text-[#282220] mb-1">
                          {activeView === 'favorites' ? 'No Starred Reflections' : 'No Reflection Selected'}
                        </p>
                        <p className="text-xs text-[#6e6259] mb-4">
                          {activeView === 'favorites'
                            ? 'Star any reflection in the history sidebar to easily find it here.'
                            : 'Select an entry from the sidebar or begin a new reflection.'}
                        </p>
                        <button
                          onClick={() => handleNewEntry()}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#9b4d36] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#833f2b] cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                          Start a New Reflection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'editor' && (
              <>
                {activeEntry ? (
                  <JournalEditor
                    entry={activeEntry}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    isSaving={isSaving}
                    saveError={saveError}
                    onClearSaveError={() => setSaveError(null)}
                    onBack={() => setActiveView('history')}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-8 shadow-xs">
                      <p className="text-sm font-semibold text-[#282220] mb-1">No Reflection Selected</p>
                      <p className="text-xs text-[#6e6259] mb-4">
                        Select an entry from history or begin a new reflection.
                      </p>
                      <button
                        onClick={() => handleNewEntry()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#9b4d36] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#833f2b] cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Start a New Reflection
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Fixed Mobile Bottom Navigation & Prominent CTA */}
          <MobileBottomNav
            activeView={activeView}
            onNavigateView={(view) => setActiveView(view)}
            onNewEntry={() => handleNewEntry()}
          />
        </div>
      )}
      </div>

      {/* Threat Model & Security Architecture Modal */}
      <ThreatModelModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
      />
    </div>
  );
}
