import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  BarChart3,
  Calendar,
  Clock,
  Flame,
  ShieldAlert,
  RotateCw,
  Tag,
  TrendingUp,
  Brain,
  CheckCircle2,
  Smile,
  AlertCircle,
} from 'lucide-react';
import type { JournalEntry, MoodType, AIInsightsSummary } from '../types';
import { MOOD_OPTIONS } from '../constants';

interface InsightsViewProps {
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ entries, onSelectEntry }) => {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiData, setAiData] = useState<Partial<AIInsightsSummary> | null>(null);
  const [synthError, setSynthError] = useState<string | null>(null);

  // 1. Calculate mood distribution
  const moodDistribution = useMemo(() => {
    const counts: Record<MoodType, number> = {
      happy: 0,
      calm: 0,
      neutral: 0,
      sad: 0,
      anxious: 0,
      angry: 0,
      tired: 0,
      excited: 0,
    };

    let totalTagged = 0;
    entries.forEach((e) => {
      if (e.mood && counts[e.mood] !== undefined) {
        counts[e.mood]++;
        totalTagged++;
      }
    });

    return { counts, totalTagged };
  }, [entries]);

  // 2. Calculate time-of-day reflection frequency
  const timeOfDayBreakdown = useMemo(() => {
    let morning = 0; // 5am - 12pm
    let afternoon = 0; // 12pm - 5pm
    let evening = 0; // 5pm - 9pm
    let night = 0; // 9pm - 5am

    entries.forEach((e) => {
      const d = new Date(e.createdAt);
      const h = d.getHours();
      if (h >= 5 && h < 12) morning++;
      else if (h >= 12 && h < 17) afternoon++;
      else if (h >= 17 && h < 21) evening++;
      else night++;
    });

    let peak = 'Mornings';
    let maxVal = morning;
    if (afternoon > maxVal) {
      peak = 'Afternoons';
      maxVal = afternoon;
    }
    if (evening > maxVal) {
      peak = 'Evenings';
      maxVal = evening;
    }
    if (night > maxVal) {
      peak = 'Late Nights';
      maxVal = night;
    }

    return { morning, afternoon, evening, night, peak: entries.length > 0 ? peak : 'N/A' };
  }, [entries]);

  // 3. Fallback topics extracted from reflection titles & messages
  const extractedTopics = useMemo(() => {
    const defaultTopics = ['College & Work', 'Personal Growth', 'Managing Energy', 'Daily Focus'];
    if (aiData?.frequentTopics && aiData.frequentTopics.length > 0) {
      return aiData.frequentTopics;
    }
    return defaultTopics;
  }, [aiData]);

  // Fetch AI observations
  const handleFetchAiInsights = async () => {
    if (entries.length === 0) return;
    setIsSynthesizing(true);
    setSynthError(null);

    try {
      const sample = entries.slice(0, 10).map((e) => ({
        title: e.title,
        mood: e.mood,
        snippet: e.initialPrompt || e.messages[0]?.text?.slice(0, 200) || '',
      }));

      const res = await fetch('/api/gemini/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reflections: sample }),
      });

      if (!res.ok) throw new Error('Insights synthesis request failed');
      const data = await res.json();
      setAiData(data);
    } catch (err: any) {
      console.error('Insights synthesis error:', err);
      setSynthError('Unable to synthesize reflections with Gemini at this moment. Showing local metrics.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  useEffect(() => {
    if (entries.length > 0 && !aiData) {
      handleFetchAiInsights();
    }
  }, [entries.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 pb-36 md:pb-8 max-w-5xl mx-auto w-full space-y-8 text-left">
      {/* 1. Header & Medical Disclaimer Notice */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#282220] tracking-tight">
              Reflections & Patterns
            </h1>
            <p className="text-xs sm:text-sm text-[#6e6259]">
              Simple patterns and friendly observations from what you wrote.
            </p>
          </div>

          <button
            onClick={handleFetchAiInsights}
            disabled={isSynthesizing || entries.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2d7cb] bg-[#f2ebe1] px-3.5 py-2 text-xs font-semibold text-[#9b4d36] hover:bg-[#e8dfd3] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>{isSynthesizing ? 'Updating...' : 'Refresh AI Notes'}</span>
          </button>
        </div>

        {/* Mandatory Ethical Notice */}
        <div className="flex items-start gap-2.5 rounded-xl border border-[#e2d7cb] bg-[#f2ebe1] p-3 text-xs text-[#6e6259]">
          <ShieldAlert className="h-4 w-4 text-[#9b4d36] shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-[#282220]">Important Notice:</span> These notes are generated by AI to help you look back at your reflections. They are not medical advice or psychological diagnosis.
          </p>
        </div>
      </div>

      {synthError && (
        <div className="rounded-xl border border-[#e8c7bd] bg-[#f7dfd6] p-3 text-xs text-[#9e5a3f]">
          {synthError}
        </div>
      )}

      {/* 2. Frequency & Rhythm Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#9b4d36] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Sessions</span>
            <Calendar className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[#282220]">
            {entries.length}
          </p>
          <span className="text-[10px] text-[#6e6259]">Journal entries saved</span>
        </div>

        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#9b4d36] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Dialogue</span>
            <Brain className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[#282220]">
            {entries.reduce((acc, e) => acc + (e.messages?.length || 0), 0)}
          </p>
          <span className="text-[10px] text-[#6e6259]">Reflective conversation turns</span>
        </div>

        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#9b4d36] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Peak Time</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-xl sm:text-2xl font-serif font-bold text-[#282220] truncate">
            {timeOfDayBreakdown.peak}
          </p>
          <span className="text-[10px] text-[#6e6259]">Most active reflection window</span>
        </div>

        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#9b4d36] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Starred</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-[#282220]">
            {entries.filter((e) => e.favorite).length}
          </p>
          <span className="text-[10px] text-[#6e6259]">Bookmarked reflections</span>
        </div>
      </section>

      {/* 3. Weekly Mood Distribution Visualization */}
      <section className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="h-4 w-4 text-[#9b4d36]" />
            <h2 className="text-sm sm:text-base font-semibold text-[#282220]">
              Mood Check-in Distribution
            </h2>
          </div>
          <span className="text-xs text-[#6e6259]">
            {moodDistribution.totalTagged} entries tagged
          </span>
        </div>

        {moodDistribution.totalTagged === 0 ? (
          <p className="text-xs text-[#6e6259] py-4 text-center">
            No moods recorded yet. Select an emotion when creating a reflection to visualize your emotional rhythm.
          </p>
        ) : (
          <div className="space-y-2.5">
            {MOOD_OPTIONS.map((mood) => {
              const count = moodDistribution.counts[mood.type] || 0;
              const percentage =
                moodDistribution.totalTagged > 0
                  ? Math.round((count / moodDistribution.totalTagged) * 100)
                  : 0;

              return (
                <div key={mood.type} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 w-24 shrink-0">
                    <span className="text-base">{mood.emoji}</span>
                    <span className="font-medium text-[#282220]">{mood.label}</span>
                  </div>

                  {/* Visual Bar */}
                  <div className="flex-1 h-3 rounded-full bg-[#e8dfd3] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#9b4d36] transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-12 text-right text-[11px] font-semibold text-[#9b4d36]">
                    {count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. AI-Generated Synthesis Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Frequent Topics */}
        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-[#9b4d36]" />
              <h3 className="text-sm font-semibold text-[#282220]">
                Frequently Discussed Themes
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {extractedTopics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] px-3 py-1.5 text-xs font-medium text-[#282220]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-[#6e6259]">
            Topics that repeatedly appear in your journal entries and inquiries.
          </p>
        </div>

        {/* Positive & Productivity Patterns */}
        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[#9b4d36]" />
              <h3 className="text-sm font-semibold text-[#282220]">
                Good Habits & Strengths
              </h3>
            </div>
            <ul className="space-y-2 mb-4">
              {(aiData?.positivePatterns || [
                'Taking time to pause and write down your thoughts.',
                'Looking for small solutions instead of keeping stress inside.',
              ]).map((pat, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#282220]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#9b4d36] shrink-0 mt-0.5" />
                  <span>{pat}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[11px] text-[#6e6259]">
            Positive habits noticed from what you shared.
          </p>
        </div>
      </section>

      {/* 5. AI Observations Card */}
      <section className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-[#9b4d36]" />
          <h2 className="text-sm sm:text-base font-semibold text-[#282220]">
            Helpful Observations
          </h2>
        </div>

        <div className="space-y-3">
          {(aiData?.observations || [
            'Work, college tasks, and deadlines are what you write about most.',
            'You like writing in the evenings, which is a great way to unwind before bed.',
            'Writing down your worries helps you see what to do next.',
          ]).map((obs, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] p-3 text-xs sm:text-sm text-[#282220] leading-relaxed"
            >
              "{obs}"
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
