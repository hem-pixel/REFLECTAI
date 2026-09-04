import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  Trash2,
  Clock,
  Sparkles,
  BookOpen,
  Calendar,
} from 'lucide-react';
import type { JournalEntry, ReflectionMode, MoodType } from '../types';
import { MOOD_OPTIONS } from '../constants';
import { ConfirmModal } from './ConfirmModal';

interface HistoryViewProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  activeView: 'history' | 'favorites';
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onToggleFavorite: (entry: JournalEntry) => Promise<void>;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'older';

export const HistoryView: React.FC<HistoryViewProps> = ({
  entries,
  activeEntryId,
  activeView,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [modeFilter, setModeFilter] = useState<ReflectionMode | 'all'>('all');
  const [moodFilter, setMoodFilter] = useState<MoodType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

    return entries.filter((entry) => {
      // 1. Favorites view filter
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

  return (
    <div className="flex-1 overflow-y-auto bg-[#fcf9f4] p-4 sm:p-6 pb-36 md:pb-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header Title */}
        <div className="flex items-center justify-between pb-2 border-b border-[#e2d7cb]">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#282220]">
              {activeView === 'favorites' ? 'Starred Reflections' : 'Reflection History'}
            </h1>
            <p className="text-xs sm:text-sm text-[#6e6259]">
              {activeView === 'favorites'
                ? 'Your favorite moments and saved reflections'
                : 'Browse, search, and revisit your past reflections'}
            </p>
          </div>
          <span className="text-xs font-semibold bg-[#f2ebe1] text-[#9b4d36] px-2.5 py-1 rounded-full border border-[#e2d7cb]">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6e6259]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeView === 'favorites' ? 'Search favorites...' : 'Search reflections...'}
              className="w-full rounded-xl border border-[#e2d7cb] bg-[#f2ebe1] pl-9 pr-8 py-2 text-xs sm:text-sm text-[#282220] placeholder:text-[#6e6259]/70 focus:border-[#9b4d36] focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6e6259] hover:text-[#282220] text-sm cursor-pointer p-1"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 text-xs ${
              showFilters || timeFilter !== 'all' || modeFilter !== 'all' || moodFilter !== 'all'
                ? 'bg-[#9b4d36] text-[#ffffff] border-[#9b4d36]'
                : 'bg-[#f2ebe1] border-[#e2d7cb] text-[#6e6259] hover:text-[#282220]'
            }`}
            aria-label="Filter entries"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* Collapsible Filter Chips */}
        {showFilters && (
          <div className="p-3 rounded-xl border border-[#e2d7cb] bg-[#f2ebe1]/60 space-y-2 text-xs animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-semibold text-[#6e6259] uppercase tracking-wider block mb-1">
                Timeframe
              </span>
              <div className="flex flex-wrap gap-1">
                {(['all', 'today', 'week', 'month', 'older'] as TimeFilter[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeFilter(tf)}
                    className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer transition-colors text-xs ${
                      timeFilter === tf
                        ? 'bg-[#9b4d36] text-[#ffffff] font-semibold'
                        : 'bg-[#fcf9f4] text-[#6e6259] border border-[#e2d7cb] hover:bg-[#e8dfd3]'
                    }`}
                  >
                    {tf === 'week' ? 'This Week' : tf === 'month' ? 'This Month' : tf}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-[#6e6259] uppercase tracking-wider block mb-1">
                Reflection Mode
              </span>
              <div className="flex flex-wrap gap-1">
                {(['all', 'reflect', 'summarize', 'brainstorm'] as const).map((mf) => (
                  <button
                    key={mf}
                    onClick={() => setModeFilter(mf)}
                    className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer transition-colors text-xs ${
                      modeFilter === mf
                        ? 'bg-[#9b4d36] text-[#ffffff] font-semibold'
                        : 'bg-[#fcf9f4] text-[#6e6259] border border-[#e2d7cb] hover:bg-[#e8dfd3]'
                    }`}
                  >
                    {mf}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="space-y-2.5">
          {filteredEntries.length === 0 ? (
            <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-8 text-center">
              <Sparkles className="h-8 w-8 text-[#9b4d36] mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-[#282220] mb-1">
                {searchQuery || timeFilter !== 'all' || modeFilter !== 'all'
                  ? 'No matching reflections found'
                  : activeView === 'favorites'
                  ? 'No starred reflections yet'
                  : 'No reflections yet'}
              </p>
              <p className="text-xs text-[#6e6259] mb-4 max-w-sm mx-auto">
                {activeView === 'favorites'
                  ? 'Star any reflection to easily find it here.'
                  : 'Start a new reflection to begin journaling your thoughts.'}
              </p>
              <button
                onClick={onNewEntry}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#9b4d36] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#833f2b] transition-colors cursor-pointer"
              >
                <BookOpen className="h-4 w-4" />
                <span>Start New Reflection</span>
              </button>
            </div>
          ) : (
            filteredEntries.map((item) => {
              const isActive = item.id === activeEntryId;
              const dateStr = new Date(item.updatedAt || item.createdAt).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric', year: 'numeric' }
              );
              const moodObj = item.mood ? MOOD_OPTIONS.find((m) => m.type === item.mood) : null;
              const previewText =
                item.messages.find((m) => m.role === 'user')?.text ||
                item.initialPrompt ||
                'No message content yet';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectEntry(item)}
                  className={`group relative rounded-2xl p-4 text-left transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-[#fcf9f4] border-[#9b4d36] shadow-sm ring-1 ring-[#9b4d36]/30'
                      : 'bg-[#f2ebe1] border-[#e2d7cb] hover:bg-[#e8dfd3] hover:border-[#dac1bb]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {moodObj && (
                          <span className="text-base shrink-0" title={moodObj.label}>
                            {moodObj.emoji}
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-[#282220] truncate">
                          {item.title || 'Untitled Reflection'}
                        </h3>
                        <span className="text-[10px] uppercase font-semibold text-[#9b4d36] bg-[#fcf9f4] px-2 py-0.5 rounded-md border border-[#e2d7cb] shrink-0">
                          {item.mode}
                        </span>
                      </div>

                      <p className="text-xs text-[#6e6259] line-clamp-2 leading-relaxed mb-2">
                        {previewText}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#6e6259]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#9b4d36]" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#9b4d36]" />
                          {item.messages.length} {item.messages.length === 1 ? 'message' : 'messages'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      {/* Star Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item);
                        }}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          item.favorite
                            ? 'text-[#d19a28] hover:text-[#b8851e]'
                            : 'text-[#a3a193] hover:text-[#282220]'
                        }`}
                        title={item.favorite ? 'Remove from favorites' : 'Add to favorites'}
                        aria-label="Toggle favorite"
                      >
                        <Star className={`h-4 w-4 ${item.favorite ? 'fill-[#d19a28]' : ''}`} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntryToDelete(item);
                        }}
                        className="p-2 text-[#6e6259] hover:text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors cursor-pointer"
                        title="Delete reflection"
                        aria-label="Delete reflection"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(entryToDelete)}
        title="Delete Reflection?"
        message={`Are you sure you want to permanently delete "${entryToDelete?.title || 'this reflection'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={async () => {
          if (entryToDelete) {
            await onDeleteEntry(entryToDelete.id);
            setEntryToDelete(null);
          }
        }}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
};
