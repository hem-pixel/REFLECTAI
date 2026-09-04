import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Calendar,
  Sparkles,
  X,
  FileText,
  Lightbulb,
  Star,
  LayoutDashboard,
  BarChart3,
  Shield,
  Filter,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { JournalEntry, AppView, ReflectionMode, MoodType } from '../types';
import { MOOD_OPTIONS } from '../constants';
import { ConfirmModal } from './ConfirmModal';
import { ReflectAIAppIcon, ReflectAIMark } from './ReflectAILogo';

interface HistorySidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  activeView: AppView;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onNavigateView: (view: AppView) => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onToggleFavorite: (entry: JournalEntry) => Promise<void>;
  isOpen: boolean;
  isExpanded?: boolean;
  onCloseMobile: () => void;
  onToggleExpand?: () => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'older';

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  entries,
  activeEntryId,
  activeView,
  onSelectEntry,
  onNewEntry,
  onNavigateView,
  onDeleteEntry,
  onToggleFavorite,
  isOpen,
  isExpanded = true,
  onCloseMobile,
  onToggleExpand,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [modeFilter, setModeFilter] = useState<ReflectionMode | 'all'>('all');
  const [moodFilter, setMoodFilter] = useState<MoodType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Deletion modal state
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  // Filter reflections
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return entries.filter((entry) => {
      // 1. Favorites view
      if (activeView === 'favorites' && !entry.favorite) {
        return false;
      }

      // 2. Keyword query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const titleMatch = entry.title?.toLowerCase().includes(q);
        const initialPromptMatch = entry.initialPrompt?.toLowerCase().includes(q);
        const messageMatch = entry.messages?.some((m) => m.text?.toLowerCase().includes(q));
        if (!titleMatch && !initialPromptMatch && !messageMatch) {
          return false;
        }
      }

      // 3. Mode filter
      if (modeFilter !== 'all' && entry.mode !== modeFilter) {
        return false;
      }

      // 4. Mood filter
      if (moodFilter !== 'all' && entry.mood !== moodFilter) {
        return false;
      }

      // 5. Time filter
      const entryTime = new Date(entry.createdAt || entry.updatedAt).getTime();
      if (timeFilter === 'today' && entryTime < startOfToday) {
        return false;
      }
      if (timeFilter === 'week' && entryTime < oneWeekAgo) {
        return false;
      }
      if (timeFilter === 'month' && entryTime < oneMonthAgo) {
        return false;
      }
      if (timeFilter === 'older' && entryTime >= oneMonthAgo) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, timeFilter, modeFilter, moodFilter, activeView]);

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    try {
      await onDeleteEntry(entryToDelete.id);
      setEntryToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <>
      {/* Collapsed State: Compact Sidebar (Icons Only for Tablet / Collapsed Desktop) */}
      {!isExpanded ? (
        <aside
          id="tablet-desktop-history-sidebar-collapsed"
          className="hidden md:flex w-16 md:static md:top-auto md:bottom-auto md:h-full shrink-0 flex-col items-center py-3 border-r border-[#e2d7cb] bg-[#f2ebe1] transition-all duration-200 ease-in-out select-none"
        >
          {/* Official ReflectAI App Icon Badge */}
          <div className="mb-2.5">
            <ReflectAIAppIcon size="xs" className="shadow-xs hover:scale-105 transition-transform" />
          </div>

          {/* Collapse/Expand Toggle at Top */}
          {onToggleExpand && (
            <button
              id="sidebar-expand-toggle-top-btn"
              onClick={onToggleExpand}
              className="p-2 mb-2 rounded-xl text-[#6e6259] hover:text-[#282220] hover:bg-[#e8dfd3] transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          )}

          {/* New Reflection Button (+) */}
          <button
            id="sidebar-collapsed-new-reflection-btn"
            onClick={() => {
              onNewEntry();
              onCloseMobile();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9b4d36] text-[#ffffff] shadow-xs hover:bg-[#833f2b] transition-all cursor-pointer mb-3"
            title="New Reflection"
            aria-label="New Reflection"
          >
            <Plus className="h-5 w-5" />
          </button>

          <div className="w-8 h-[1px] bg-[#e2d7cb] mb-3" />

          {/* Navigation Items (Icons only) */}
          <div className="flex flex-col items-center space-y-2 w-full px-2">
            {/* Today */}
            <button
              id="sidebar-collapsed-nav-today-btn"
              onClick={() => {
                onNavigateView('dashboard');
                onCloseMobile();
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer relative ${
                activeView === 'dashboard'
                  ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs font-semibold ring-1 ring-[#e2d7cb]'
                  : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
              }`}
              title="Today"
              aria-label="Today"
            >
              <LayoutDashboard className="h-5 w-5" />
            </button>

            {/* History */}
            <button
              id="sidebar-collapsed-nav-history-btn"
              onClick={() => {
                onNavigateView('history');
                onCloseMobile();
                if (onToggleExpand) onToggleExpand();
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer relative ${
                activeView === 'history' || activeView === 'editor'
                  ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs font-semibold ring-1 ring-[#e2d7cb]'
                  : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
              }`}
              title="History (Click to browse reflections)"
              aria-label="History"
            >
              <MessageSquare className="h-5 w-5" />
              {entries.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#9b4d36] text-[9px] font-bold text-white shadow-xs">
                  {entries.length > 99 ? '99+' : entries.length}
                </span>
              )}
            </button>

            {/* Insights */}
            <button
              id="sidebar-collapsed-nav-insights-btn"
              onClick={() => {
                onNavigateView('insights');
                onCloseMobile();
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                activeView === 'insights'
                  ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs font-semibold ring-1 ring-[#e2d7cb]'
                  : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
              }`}
              title="Insights"
              aria-label="Insights"
            >
              <BarChart3 className="h-5 w-5" />
            </button>

            {/* Favorites */}
            <button
              id="sidebar-collapsed-nav-favorites-btn"
              onClick={() => {
                onNavigateView('favorites');
                onCloseMobile();
                if (onToggleExpand) onToggleExpand();
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                activeView === 'favorites'
                  ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs font-semibold ring-1 ring-[#e2d7cb]'
                  : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
              }`}
              title="Favorites"
              aria-label="Favorites"
            >
              <Star className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1" />

          {/* Privacy & Settings Icon at Bottom */}
          <div className="w-full px-2 flex flex-col items-center gap-2 pt-2 border-t border-[#e2d7cb]">
            <button
              id="sidebar-collapsed-nav-privacy-btn"
              onClick={() => {
                onNavigateView('privacy');
                onCloseMobile();
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                activeView === 'privacy'
                  ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs font-semibold ring-1 ring-[#e2d7cb]'
                  : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
              }`}
              title="Privacy & Security Settings"
              aria-label="Privacy & Security Settings"
            >
              <Shield className="h-5 w-5" />
            </button>

            {onToggleExpand && (
              <button
                id="sidebar-expand-toggle-bottom-btn"
                onClick={onToggleExpand}
                className="p-1.5 rounded-lg text-[#6e6259] hover:text-[#282220] hover:bg-[#e8dfd3] transition-colors cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </aside>
      ) : (
        /* Expanded State: Full Sidebar (Icons + Labels, Search, Reflections List) */
        <aside
          id="desktop-history-sidebar"
          className="hidden md:flex md:w-72 lg:w-80 md:static md:top-auto md:bottom-auto md:h-full shrink-0 flex-col border-r border-[#e2d7cb] bg-[#f2ebe1] transition-all duration-200 ease-in-out"
        >
          {/* Top Navigation Menu & Header */}
          <div className="p-3 border-b border-[#e2d7cb] space-y-1.5 shrink-0">
            {/* Header row with Title and Collapse button */}
            <div className="flex items-center justify-between px-1 pb-1">
              <div className="flex items-center gap-1.5">
                <ReflectAIMark size="xs" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider text-[#6e6259]">
                  Navigation
                </span>
              </div>
              {onToggleExpand && (
                <button
                  id="sidebar-collapse-toggle-btn"
                  onClick={onToggleExpand}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] text-[#6e6259] hover:text-[#282220] hover:bg-[#e8dfd3] transition-colors cursor-pointer"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                  <span>Collapse</span>
                </button>
              )}
            </div>

            <button
              id="nav-new-reflection-btn"
              onClick={() => {
                onNewEntry();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#9b4d36] px-4 py-2.5 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#833f2b] transition-all cursor-pointer mb-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Reflection</span>
            </button>

            <div className="grid grid-cols-2 gap-1 text-xs">
              <button
                onClick={() => {
                  onNavigateView('dashboard');
                  onCloseMobile();
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-[#fcf9f4] font-semibold text-[#9b4d36] shadow-2xs'
                    : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Today</span>
              </button>

              <button
                onClick={() => {
                  onNavigateView('history');
                  onCloseMobile();
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  activeView === 'history' || activeView === 'editor'
                    ? 'bg-[#fcf9f4] font-semibold text-[#9b4d36] shadow-2xs'
                    : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>History</span>
              </button>

              <button
                onClick={() => {
                  onNavigateView('insights');
                  onCloseMobile();
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  activeView === 'insights'
                    ? 'bg-[#fcf9f4] font-semibold text-[#9b4d36] shadow-2xs'
                    : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Insights</span>
              </button>

              <button
                onClick={() => {
                  onNavigateView('favorites');
                  onCloseMobile();
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  activeView === 'favorites'
                    ? 'bg-[#fcf9f4] font-semibold text-[#9b4d36] shadow-2xs'
                    : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
                }`}
              >
                <Star className="h-4 w-4" />
                <span>Favorites</span>
              </button>
            </div>
          </div>

        {/* Search & Filter Bar */}
        <div className="p-3 border-b border-[#e2d7cb] space-y-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6259]" />
              <input
                id="history-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections..."
                className="w-full rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] pl-8 pr-3 py-1.5 text-xs text-[#282220] placeholder:text-[#6e6259]/70 focus:border-[#9b4d36] focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e6259] hover:text-[#282220] text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                showFilters || timeFilter !== 'all' || modeFilter !== 'all' || moodFilter !== 'all'
                  ? 'bg-[#9b4d36] text-[#ffffff] border-[#9b4d36]'
                  : 'bg-[#fcf9f4] border-[#e2d7cb] text-[#6e6259] hover:text-[#282220]'
              }`}
              title="Toggle filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Collapsible Filter Chips */}
          {showFilters && (
            <div className="space-y-2 pt-1 text-[11px] animate-in fade-in duration-150">
              {/* Time Filters */}
              <div className="flex flex-wrap gap-1">
                {(['all', 'today', 'week', 'month', 'older'] as TimeFilter[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeFilter(tf)}
                    className={`px-2 py-0.5 rounded-lg capitalize cursor-pointer transition-colors ${
                      timeFilter === tf
                        ? 'bg-[#9b4d36] text-[#ffffff] font-semibold'
                        : 'bg-[#fcf9f4] text-[#6e6259] hover:bg-[#e8dfd3]'
                    }`}
                  >
                    {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : tf}
                  </button>
                ))}
              </div>

              {/* Mode Filters */}
              <div className="flex flex-wrap gap-1">
                {(['all', 'reflect', 'summarize', 'brainstorm'] as const).map((mf) => (
                  <button
                    key={mf}
                    onClick={() => setModeFilter(mf)}
                    className={`px-2 py-0.5 rounded-lg capitalize cursor-pointer transition-colors ${
                      modeFilter === mf
                        ? 'bg-[#9b4d36] text-[#ffffff] font-semibold'
                        : 'bg-[#fcf9f4] text-[#6e6259] hover:bg-[#e8dfd3]'
                    }`}
                  >
                    {mf}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Entries List Header */}
        <div className="px-3 pt-2 pb-1 flex items-center justify-between text-xs text-[#6e6259] shrink-0">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            {activeView === 'favorites' ? 'Starred Reflections' : 'All Reflections'}
          </span>
          <span className="text-[10px] bg-[#e8dfd3] px-2 py-0.5 rounded-full font-medium text-[#9b4d36]">
            {filteredEntries.length}
          </span>
        </div>

        {/* Entries List - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6e6259] px-4">
              {searchQuery || timeFilter !== 'all' || modeFilter !== 'all'
                ? 'No reflections match the current filters.'
                : activeView === 'favorites'
                ? 'No starred reflections yet. Star a reflection using the ⭐ icon.'
                : 'No reflections yet. Click "+ New Reflection" to begin.'}
            </div>
          ) : (
            filteredEntries.map((item) => {
              const isActive = activeView === 'editor' && item.id === activeEntryId;
              const dateStr = new Date(item.updatedAt || item.createdAt).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric' }
              );
              const moodObj = item.mood ? MOOD_OPTIONS.find((m) => m.type === item.mood) : null;

              return (
                <div
                  key={item.id}
                  id={`history-entry-${item.id}`}
                  onClick={() => {
                    onSelectEntry(item);
                    onCloseMobile();
                  }}
                  className={`group relative flex flex-col gap-1.5 rounded-xl p-3 text-left transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-[#fcf9f4] border-[#9b4d36] shadow-xs'
                      : 'bg-[#fcf9f4]/80 border-[#e2d7cb] hover:bg-[#fcf9f4] hover:border-[#dac1bb]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {moodObj && <span className="text-xs shrink-0">{moodObj.emoji}</span>}
                      <h3
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-[#9b4d36]' : 'text-[#282220]'
                        }`}
                      >
                        {item.title || 'Untitled Reflection'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Star Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item);
                        }}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          item.favorite
                            ? 'text-[#d19a28] hover:text-[#b8851e]'
                            : 'text-[#a3a193] hover:text-[#282220] opacity-0 group-hover:opacity-100'
                        }`}
                        title={item.favorite ? 'Remove from favorites' : 'Mark as favorite'}
                        aria-label="Toggle favorite"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${item.favorite ? 'fill-[#d19a28]' : ''}`}
                        />
                      </button>

                      {/* Delete Button */}
                      <button
                        id={`delete-entry-btn-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntryToDelete(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#6e6259] hover:text-[#ba1a1a] rounded transition-opacity cursor-pointer"
                        title="Delete reflection"
                        aria-label="Delete reflection"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#6e6259] line-clamp-2 leading-relaxed">
                    {item.initialPrompt ||
                      (item.messages[0] ? item.messages[0].text : 'Empty reflection...')}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#6e6259] mt-1 pt-1.5 border-t border-[#e2d7cb]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {dateStr}
                    </span>

                    <span className="inline-flex items-center gap-1 font-medium text-[#9b4d36]">
                      {item.mode === 'summarize' && <FileText className="h-2.5 w-2.5" />}
                      {item.mode === 'brainstorm' && <Lightbulb className="h-2.5 w-2.5" />}
                      {item.mode === 'reflect' && <Sparkles className="h-2.5 w-2.5" />}
                      {item.messages.length} turns
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer - Settings & Privacy */}
        <div className="p-3 border-t border-[#e2d7cb] shrink-0">
          <button
            onClick={() => {
              onNavigateView('privacy');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
              activeView === 'privacy'
                ? 'bg-[#fcf9f4] text-[#9b4d36] font-semibold'
                : 'text-[#6e6259] hover:bg-[#e8dfd3] hover:text-[#282220]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              <span>Privacy & Security</span>
            </div>
            <span className="text-[10px] text-[#6e6259]">Settings</span>
          </button>
        </div>
      </aside>
      )}

      {/* Confirmation Modal for Single Entry Deletion */}
      <ConfirmModal
        isOpen={Boolean(entryToDelete)}
        title="Delete Reflection?"
        message={`Are you sure you want to delete "${entryToDelete?.title || 'Untitled Reflection'}"? This cannot be undone.`}
        confirmLabel="Delete Reflection"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setEntryToDelete(null)}
      />
    </>
  );
};
