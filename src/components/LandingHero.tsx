import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  Shield,
  Database,
  ArrowRight,
  MessageSquare,
  BookOpen,
  Compass,
  CheckCircle2,
  Cpu,
  ChevronDown,
  Layers,
  HeartHandshake,
  Activity,
  Smile,
} from 'lucide-react';
import { ReflectAIMark } from './ReflectAILogo';

interface LandingHeroProps {
  onSignIn: () => void;
  isLoading: boolean;
  error: string | null;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSignIn, isLoading, error }) => {
  const [activeTab, setActiveTab] = useState<'reflect' | 'summarize' | 'brainstorm'>('reflect');

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col items-center px-4 py-10 sm:px-6 lg:px-8 bg-[#fcf9f4] text-[#282220]">
      {/* 1. Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center pt-2 pb-12">
        {/* Official Brand Logo Lockup */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full blur-xl bg-[#ecdcd0]/70 -z-10 transform scale-150" aria-hidden="true" />
            <ReflectAIMark size="lg" className="drop-shadow-xs" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#3E2723] tracking-tight">
            <span>Reflect</span><span className="text-[#8B4513]">AI</span>
          </div>
          <div className="font-sans text-[11px] sm:text-xs font-medium tracking-[0.2em] uppercase text-[#A67C52] mt-1">
            Think <span className="text-[#8B4513]/60">•</span> Reflect <span className="text-[#8B4513]/60">•</span> Grow
          </div>
        </div>

        {/* Subtle pill tag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#e2d7cb] bg-[#f2ebe1] px-3.5 py-1 text-xs font-medium text-[#9b4d36] mb-6 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-[#9b4d36]" />
          <span>Mindful AI Companion & Private Journal</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-[#282220] mb-5 leading-[1.15]">
          Reflect deeper.{' '}
          <span className="italic text-[#9b4d36]">Understand yourself better.</span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-lg text-[#6e6259] max-w-2xl mx-auto leading-relaxed mb-8 font-light">
          An AI-powered private space to reflect, understand patterns, and turn thoughts into meaningful actions.
        </p>

        {/* Auth Error Banner */}
        {error && (
          <div
            id="auth-error-banner"
            className="mb-6 rounded-2xl border border-[#e8c7bd] bg-[#f7dfd6] p-4 text-xs sm:text-sm text-[#9e5a3f] text-left max-w-md mx-auto shadow-xs"
          >
            <p className="font-semibold text-[#85452d] mb-0.5">Authentication Alert</p>
            <p>{error}</p>
          </div>
        )}

        {/* Primary and Secondary CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
          <button
            id="google-signin-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-[#9b4d36] px-7 py-3.5 text-sm font-semibold text-[#ffffff] shadow-sm hover:bg-[#833e2a] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ffffff] border-t-transparent" />
            ) : (
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Start Reflecting</span>
            <ArrowRight className="h-4 w-4 text-[#ffffff]/80" />
          </button>

          <button
            onClick={scrollToHowItWorks}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d7cb] bg-[#f2ebe1] px-5 py-3.5 text-sm font-medium text-[#282220] hover:bg-[#e8dfd3] transition-colors cursor-pointer"
          >
            <span>See how it works</span>
            <ChevronDown className="h-4 w-4 text-[#6e6259]" />
          </button>
        </div>

        {/* 2. Interactive Reflection Preview Card */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1]/60 p-4 sm:p-6 shadow-sm text-left">
          {/* Mock Window Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#e2d7cb]">
            <div className="flex items-center gap-2">
              <span className="text-base">😌</span>
              <span className="text-xs font-semibold text-[#282220]">
                Untangling Academic Pressure
              </span>
              <span className="text-[10px] text-[#6e6259]">• Just now</span>
            </div>

            {/* Mode switch pills */}
            <div className="flex items-center gap-1.5 bg-[#e8dfd3] p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('reflect')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'reflect'
                    ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs'
                    : 'text-[#6e6259] hover:text-[#282220]'
                }`}
              >
                Reflect
              </button>
              <button
                onClick={() => setActiveTab('summarize')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'summarize'
                    ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs'
                    : 'text-[#6e6259] hover:text-[#282220]'
                }`}
              >
                Summarize
              </button>
              <button
                onClick={() => setActiveTab('brainstorm')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  activeTab === 'brainstorm'
                    ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs'
                    : 'text-[#6e6259] hover:text-[#282220]'
                }`}
              >
                Brainstorm
              </button>
            </div>
          </div>

          {/* Interactive Dialogue Preview */}
          <div className="space-y-3">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-[#9b4d36] px-4 py-2.5 text-xs sm:text-sm text-[#ffffff] leading-relaxed">
                I feel overwhelmed with my college projects and feel like I'm falling behind on everything.
              </div>
            </div>

            {/* AI message corresponding to tab */}
            <div className="flex items-start gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-[#9b4d36] flex items-center justify-center text-[#ffffff] shrink-0 mt-0.5">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-xs border border-[#e2d7cb] bg-[#fcf9f4] px-4 py-3 text-xs sm:text-sm text-[#282220] leading-relaxed shadow-2xs">
                {activeTab === 'reflect' && (
                  <div>
                    <p className="mb-2">
                      Hey, that is understandable. You had a lot going on today, and it sounds like the project pressure got to you. Take it one step at a time.
                    </p>
                    <p className="font-serif italic text-[#9b4d36]">
                      "What is the one thing you want to finish first?"
                    </p>
                  </div>
                )}
                {activeTab === 'summarize' && (
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-xs text-[#9b4d36]">📌 What you shared</p>
                      <p className="text-xs text-[#6e6259]">
                        You are feeling stressed because you have several college tasks.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-[#9b4d36]">🌿 What seems important</p>
                      <p className="text-xs text-[#6e6259]">
                        Your deadlines are making you feel pressured.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-[#9b4d36]">🎯 One thing you can try</p>
                      <p className="text-xs text-[#6e6259]">
                        Pick one important task and finish that first.
                      </p>
                    </div>
                  </div>
                )}
                {activeTab === 'brainstorm' && (
                  <div className="space-y-1.5">
                    <p className="font-semibold text-xs text-[#9b4d36]">💡 3 Simple things you can try</p>
                    <p className="text-xs text-[#6e6259]">1. Write down everything you need to finish.</p>
                    <p className="text-xs text-[#6e6259]">2. Pick the most important task.</p>
                    <p className="text-xs text-[#6e6259]">3. Work on it for 25 minutes without checking your phone.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Feature Cards (6 Cards) */}
      <section className="w-full max-w-5xl mx-auto py-12 border-t border-[#e2d7cb]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-serif text-[#282220] mb-2">
            Engineered for calm, meaningful clarity
          </h2>
          <p className="text-xs sm:text-sm text-[#6e6259]">
            A mindful workspace designed to slow down reactive thinking and encourage intentional self-growth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs hover:border-[#d5c7b8] transition-colors">
            <div className="h-9 w-9 rounded-xl bg-[#e8dfd3] flex items-center justify-center text-[#9b4d36] mb-3">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1.5">
              Friendly & Simple English
            </h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              No complicated words, lectures, or clinical jargon. The AI speaks in simple everyday English and understands casual chat, Tamil, and Tanglish.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs hover:border-[#d5c7b8] transition-colors">
            <div className="h-9 w-9 rounded-xl bg-[#e8dfd3] flex items-center justify-center text-[#9b4d36] mb-3">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1.5">
              Private Journaling
            </h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Every reflection is strictly isolated to your authenticated account UID. Database security rules ensure nobody else can view your reflections.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs hover:border-[#d5c7b8] transition-colors">
            <div className="h-9 w-9 rounded-xl bg-[#e8dfd3] flex items-center justify-center text-[#9b4d36] mb-3">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1.5">
              Clear, Simple Summaries
            </h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Turn long thoughts into 3 clear sections: what you shared, what seems important, and one simple thing you can try.
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs hover:border-[#d5c7b8] transition-colors">
            <div className="h-9 w-9 rounded-xl bg-[#e8dfd3] flex items-center justify-center text-[#9b4d36] mb-3">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1.5">
              Pattern Discovery
            </h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Gain weekly insights into your emotional trends, frequent topics, and productivity loops across all your journal sessions.
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs hover:border-[#d5c7b8] transition-colors">
            <div className="h-9 w-9 rounded-xl bg-[#e8dfd3] flex items-center justify-center text-[#9b4d36] mb-3">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1.5">
              Personalized Micro-Habits
            </h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Receive "One small step for today"—a low-friction habit tailored specifically to your reflection that takes under 10 minutes.
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5 shadow-xs hover:border-[#d5c7b8] transition-colors">
            <div className="h-9 w-9 rounded-xl bg-[#e8dfd3] flex items-center justify-center text-[#9b4d36] mb-3">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1.5">
              Secure Cloud Storage
            </h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Backed by Google Cloud Firestore and server-side Gemini API routing with zero client secret exposure or API key leakage.
            </p>
          </div>
        </div>
      </section>

      {/* 4. "How it Works" Section */}
      <section id="how-it-works" className="w-full max-w-4xl mx-auto py-14 border-t border-[#e2d7cb]">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#9b4d36] bg-[#f2ebe1] px-3 py-1 rounded-full border border-[#e2d7cb]">
            Mindful Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#282220] mt-3 mb-2">
            Write → Reflect → Understand → Grow
          </h2>
          <p className="text-xs sm:text-sm text-[#6e6259]">
            Four effortless steps toward daily emotional balance and mental clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* Step 1 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5">
            <div className="text-xs font-bold text-[#9b4d36] mb-2 font-mono">STEP 01</div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1">Write</h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Pour out thoughts freely. Select an optional mood or choose from daily reflective prompts.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5">
            <div className="text-xs font-bold text-[#9b4d36] mb-2 font-mono">STEP 02</div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1">Reflect</h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Gemini engages thoughtfully, providing active inquiry and alternative perspectives.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5">
            <div className="text-xs font-bold text-[#9b4d36] mb-2 font-mono">STEP 03</div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1">Understand</h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Synthesize your thoughts into structured summaries and discover emotional patterns over time.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-5">
            <div className="text-xs font-bold text-[#9b4d36] mb-2 font-mono">STEP 04</div>
            <h3 className="text-sm font-semibold text-[#282220] mb-1">Grow</h3>
            <p className="text-xs text-[#6e6259] leading-relaxed">
              Receive one practical, realistic micro-habit to take calm, positive momentum into your day.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Privacy Statement Section */}
      <section className="w-full max-w-3xl mx-auto py-10 border-t border-[#e2d7cb] text-center">
        <div className="rounded-2xl border border-[#e2d7cb] bg-[#f2ebe1] p-6 sm:p-8 shadow-xs">
          <div className="h-10 w-10 rounded-full bg-[#e8dfd3] flex items-center justify-center text-[#9b4d36] mx-auto mb-3">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-serif text-[#282220] mb-2">
            "Your reflections belong to you."
          </h3>
          <p className="text-xs sm:text-sm text-[#6e6259] max-w-xl mx-auto leading-relaxed mb-4">
            We hold your privacy to the highest standard. Your thoughts are never used to train commercial models, never shared, and remain securely guarded by Firestore database security rules. You can export or erase all data at any time with one click.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#9b4d36] font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> No Client Key Leakage
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> User-Bound Firestore
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Full Data Portability
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
