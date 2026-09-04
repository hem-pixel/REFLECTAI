import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle,
  RotateCw,
  ArrowRight,
  Calendar,
  Clock,
  BookOpen,
  Heart,
  Lightbulb,
  Check,
  Star,
} from 'lucide-react';
import type { JournalEntry, MoodType, UserProfile } from '../types';
import { MOOD_OPTIONS, DAILY_PROMPTS } from '../constants';

interface DashboardViewProps {
  user: UserProfile;
  entries: JournalEntry[];
  onStartReflection: (initialPrompt?: string, mood?: MoodType) => void;
  onSelectEntry: (entry: JournalEntry) => void;
  onNavigateInsights: () => void;
  onNavigateFavorites: () => void;
  onUpdateEntry: (entry: JournalEntry) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  entries,
  onStartReflection,
  onSelectEntry,
  onNavigateInsights,
  onNavigateFavorites,
  onUpdateEntry,
}) => {
  // 1. Calculate dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = user.displayName ? user.displayName.split(' ')[0] : 'friend';
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [user.displayName]);

  // 2. Daily reflection prompt rotation
  const [promptIndex, setPromptIndex] = useState(() => {
    // Seed by day of year so it stays stable throughout the day
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear % DAILY_PROMPTS.length;
  });

  const currentPrompt = DAILY_PROMPTS[promptIndex];

  const handleNextPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % DAILY_PROMPTS.length);
  };

  // 3. Selected mood state
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);

  // 4. Calculate streak (consecutive days with reflections)
  const streakDays = useMemo(() => {
    if (entries.length === 0) return 0;
    const dates = new Set(
      entries.map((e) => new Date(e.createdAt).toISOString().split('T')[0])
    );
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (dates.has(dateStr)) {
        streak++;
      } else if (i > 0) {
        // Break if day wasn't recorded, unless it's today and user hasn't journaled yet today
        break;
      }
    }
    return Math.max(streak, entries.length > 0 ? 1 : 0);
  }, [entries]);

  // 5. Active micro-habit from latest reflection
  const latestHabitEntry = useMemo(() => {
    return entries.find((e) => e.microHabit && !e.microHabit.completed);
  }, [entries]);

  const [localHabitCompleted, setLocalHabitCompleted] = useState(false);
  const [isGeneratingHabit, setIsGeneratingHabit] = useState(false);
  const [activeHabitText, setActiveHabitText] = useState<string | null>(
    latestHabitEntry?.microHabit?.text ||
      'Drink a glass of water and take 3 slow, deep breaths.'
  );

  const handleToggleHabit = async () => {
    if (latestHabitEntry && latestHabitEntry.microHabit) {
      const updated = {
        ...latestHabitEntry,
        microHabit: {
          ...latestHabitEntry.microHabit,
          completed: !localHabitCompleted,
        },
      };
      setLocalHabitCompleted(!localHabitCompleted);
      await onUpdateEntry(updated);
    } else {
      setLocalHabitCompleted(!localHabitCompleted);
    }
  };

  const handleGenerateAnotherHabit = async () => {
    setIsGeneratingHabit(true);
    try {
      const latestEntrySnippet = entries[0]?.initialPrompt || 'Cultivating everyday mindfulness and balance';
      const res = await fetch('/api/gemini/microhabit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflection: latestEntrySnippet }),
      });
      const data = await res.json();
      if (data.habit) {
        setActiveHabitText(data.habit);
        setLocalHabitCompleted(false);
      }
    } catch (err) {
      console.warn('Failed to generate habit:', err);
    } finally {
      setIsGeneratingHabit(false);
    }
  };

  const recentEntries = entries.slice(0, 4);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 pb-36 md:pb-8 max-w-5xl mx-auto w-full space-y-8">
      {/* 1. Header Greeting & Mood Selection */}
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-serif text-[#282220] tracking-tight mb-1">
            {greeting}
          </h1>
          <p className="text-sm sm:text-base text-[#6e6259]">
            What's on your mind today?
          </p>
        </div>

        {/* Mood Selector Row */}
        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-[#9b4d36] uppercase tracking-wider">
              How are you feeling right now?
            </span>
            {selectedMood && (
              <button
                onClick={() => setSelectedMood(null)}
                className="text-[11px] text-[#6e6259] hover:text-[#282220] cursor-pointer"
              >
                Clear mood
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = selectedMood === mood.type;
              return (
                <button
                  key={mood.type}
                  id={`mood-btn-${mood.type}`}
                  onClick={() => setSelectedMood(isSelected ? null : mood.type)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-[#fcf9f4] border-[#9b4d36] shadow-xs scale-105'
                      : 'bg-[#fcf9f4]/60 border-[#e2d7cb] hover:bg-[#fcf9f4] hover:border-[#dac1bb]'
                  }`}
                  title={mood.label}
                >
                  <span className="text-xl sm:text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-[10px] font-medium text-[#282220] truncate">
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[#6e6259] mt-2 text-right">
            Mood check-ins are private and stored with your reflection.
          </p>
        </div>
      </section>

      {/* 2. Daily Reflection Prompt Card */}
      <section className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fcf9f4] px-3 py-1 text-xs font-semibold text-[#9b4d36] border border-[#e2d7cb]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Today's Daily Prompt</span>
          </div>

          <button
            id="next-prompt-btn"
            onClick={handleNextPrompt}
            className="inline-flex items-center gap-1 text-xs text-[#9b4d36] hover:text-[#282220] p-1 rounded-md transition-colors cursor-pointer"
            title="Cycle to another prompt"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Give me another</span>
          </button>
        </div>

        <blockquote className="text-base sm:text-xl font-serif text-[#282220] italic mb-4 leading-relaxed">
          "{currentPrompt}"
        </blockquote>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="use-daily-prompt-btn"
            onClick={() => onStartReflection(currentPrompt, selectedMood || undefined)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#9b4d36] px-4 py-2 text-xs sm:text-sm font-semibold text-[#ffffff] shadow-xs hover:bg-[#833f2b] transition-all cursor-pointer"
          >
            <span>Use this prompt</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            id="blank-reflection-btn"
            onClick={() => onStartReflection(undefined, selectedMood || undefined)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] px-4 py-2 text-xs sm:text-sm font-medium text-[#282220] hover:bg-[#f2ebe1] transition-all cursor-pointer"
          >
            <BookOpen className="h-4 w-4 text-[#9b4d36]" />
            <span>Freeform Reflection</span>
          </button>
        </div>
      </section>

      {/* 3. Micro-Habit & Streak Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Streak Card */}
        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#9b4d36] uppercase tracking-wider">
              Reflection Streak
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#ffd8cd] flex items-center justify-center text-[#9b4d36]">
              <Flame className="h-4 w-4" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#282220]">
                {streakDays}
              </span>
              <span className="text-xs text-[#6e6259]">
                {streakDays === 1 ? 'day active' : 'days active'}
              </span>
            </div>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              {streakDays > 0
                ? 'Consistency builds mindfulness. Keep cultivating your quiet daily habit.'
                : 'Start your streak today with a short reflection.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e2d7cb] flex items-center justify-between text-xs text-[#9b4d36]">
            <span>Total reflections</span>
            <span className="font-semibold">{entries.length}</span>
          </div>
        </div>

        {/* Personalized Micro-Habit ("One small step for today") */}
        <div className="md:col-span-2 rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#e8dfd3] flex items-center justify-center text-[#9b4d36]">
                <Lightbulb className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold text-[#9b4d36] uppercase tracking-wider">
                One Small Step for Today
              </span>
            </div>

            <button
              onClick={handleGenerateAnotherHabit}
              disabled={isGeneratingHabit}
              className="inline-flex items-center gap-1 text-xs text-[#9b4d36] hover:text-[#282220] p-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
              title="Generate a new micro-habit"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isGeneratingHabit ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Suggest another</span>
            </button>
          </div>

          <div className="my-2 rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] p-4">
            <p
              className={`text-xs sm:text-sm leading-relaxed transition-all ${
                localHabitCompleted ? 'line-through text-[#6e6259]' : 'text-[#282220]'
              }`}
            >
              "{activeHabitText}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleToggleHabit}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                localHabitCompleted
                  ? 'bg-[#d8e5d8] text-[#345e34] hover:bg-[#c9dbc9]'
                  : 'bg-[#9b4d36] text-[#ffffff] hover:bg-[#833f2b]'
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>{localHabitCompleted ? 'Completed today' : 'Mark as complete'}</span>
            </button>

            <span className="text-[11px] text-[#6e6259]">
              Takes less than 5 minutes
            </span>
          </div>
        </div>
      </section>

      {/* 4. Recent Reflections Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif text-[#282220]">Recent Reflections</h2>
          {entries.length > 4 && (
            <button
              onClick={onNavigateInsights}
              className="text-xs text-[#9b4d36] hover:text-[#282220] font-medium cursor-pointer"
            >
              View insights & analytics →
            </button>
          )}
        </div>

        {recentEntries.length === 0 ? (
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-8 text-center">
            <BookOpen className="h-8 w-8 text-[#9b4d36] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-semibold text-[#282220] mb-1">
              No reflections written yet
            </p>
            <p className="text-xs text-[#6e6259] max-w-sm mx-auto mb-4">
              Your mindful journey starts here. Pour out a few sentences or explore today's prompt.
            </p>
            <button
              onClick={() => onStartReflection()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9b4d36] px-4 py-2 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#833f2b] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Begin First Reflection</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentEntries.map((entry) => {
              const moodObj = entry.mood
                ? MOOD_OPTIONS.find((m) => m.type === entry.mood)
                : null;
              const dateStr = new Date(entry.updatedAt || entry.createdAt).toLocaleDateString(
                undefined,
                { month: 'short', day: 'numeric', year: 'numeric' }
              );

              return (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry)}
                  className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-4 hover:border-[#9b4d36] hover:bg-[#fcf9f4] transition-all cursor-pointer shadow-xs flex flex-col justify-between gap-2 text-left"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {moodObj && <span className="text-sm">{moodObj.emoji}</span>}
                        <h3 className="text-xs sm:text-sm font-semibold text-[#282220] truncate">
                          {entry.title || 'Untitled Reflection'}
                        </h3>
                      </div>
                      {entry.favorite && (
                        <Star className="h-3.5 w-3.5 fill-[#d19a28] text-[#d19a28] shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-[#6e6259] line-clamp-2 leading-relaxed">
                      {entry.initialPrompt ||
                        (entry.messages[0] ? entry.messages[0].text : 'No prompt text')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#6e6259] pt-2 border-t border-[#e2d7cb]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {dateStr}
                    </span>
                    <span className="capitalize font-medium text-[#9b4d36]">
                      {entry.mode} mode · {entry.messages.length} turns
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
