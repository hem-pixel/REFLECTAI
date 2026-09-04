import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Lightbulb,
  Copy,
  Check,
  Star,
  Download,
  Trash2,
  Smile,
  ChevronDown,
  ArrowLeft,
  MoreVertical,
  X,
  ChevronRight,
} from 'lucide-react';
import type { JournalEntry, ChatMessage, ReflectionMode, MoodType } from '../types';
import { MOOD_OPTIONS, QUICK_PROMPTS, BRAINSTORM_QUICK_ACTIONS } from '../constants';
import { ConfirmModal } from './ConfirmModal';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry, options?: { background?: boolean }) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
  onBack?: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onUpdateEntry,
  onDeleteEntry,
  isSaving,
  saveError,
  onClearSaveError,
  onBack,
}) => {
  const [inputText, setInputText] = useState(() => {
    // Restore local unsaved draft if present
    const savedDraft = localStorage.getItem(`reflectai_draft_${entry.id}`);
    return savedDraft || '';
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [streamingModel, setStreamingModel] = useState<string>('3.6 Flash');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMoodDropdownOpen, setIsMoodDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);
  const [isTabletOptionsOpen, setIsTabletOptionsOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const tabletOptionsMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOptionsOpen(false);
        setIsTabletOptionsOpen(false);
        setIsMoodDropdownOpen(false);
        setIsExportDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile options on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setIsMobileOptionsOpen(false);
      }
    };
    if (isMobileOptionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileOptionsOpen]);

  // Close tablet options on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (tabletOptionsMenuRef.current && !tabletOptionsMenuRef.current.contains(e.target as Node)) {
        setIsTabletOptionsOpen(false);
      }
    };
    if (isTabletOptionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTabletOptionsOpen]);

  // Track visual viewport for mobile keyboard detection
  useEffect(() => {
    const handleViewportResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setIsKeyboardOpen(heightDiff > 100);
      }
    };
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
  }, []);

  // Auto-scroll to latest turn or streaming chunk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isGenerating, streamingText]);

  // Save local draft on edit
  useEffect(() => {
    if (inputText) {
      localStorage.setItem(`reflectai_draft_${entry.id}`, inputText);
    } else {
      localStorage.removeItem(`reflectai_draft_${entry.id}`);
    }
  }, [inputText, entry.id]);

  // Handle mode change
  const handleModeChange = async (newMode: ReflectionMode) => {
    if (newMode === entry.mode) return;
    const updated: JournalEntry = {
      ...entry,
      mode: newMode,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateEntry(updated);
  };

  // Handle favorite toggle
  const handleToggleFavorite = async () => {
    const updated: JournalEntry = {
      ...entry,
      favorite: !entry.favorite,
      updatedAt: new Date().toISOString(),
    };
    await onUpdateEntry(updated);
  };

  // Handle mood selection
  const handleSelectMood = async (mType: MoodType | null) => {
    const updated: JournalEntry = {
      ...entry,
      mood: mType || undefined,
      updatedAt: new Date().toISOString(),
    };
    setIsMoodDropdownOpen(false);
    await onUpdateEntry(updated);
  };

  // Export entry
  const handleExport = (format: 'txt' | 'md' | 'json') => {
    setIsExportDropdownOpen(false);
    let content = '';
    let mimeType = 'text/plain';
    const filename = `${(entry.title || 'reflection')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')}-${new Date(entry.createdAt).toISOString().split('T')[0]}`;

    if (format === 'json') {
      content = JSON.stringify(entry, null, 2);
      mimeType = 'application/json';
    } else if (format === 'md') {
      content = `# ${entry.title || 'Untitled Reflection'}\n\n`;
      content += `*Date: ${new Date(entry.createdAt).toLocaleString()}*\n`;
      content += `*Mode: ${entry.mode}* | *Mood: ${entry.mood || 'Unspecified'}*\n\n---\n\n`;
      entry.messages.forEach((m) => {
        content += `### ${m.role === 'user' ? 'You' : 'Gemini 3.6 Flash'}\n\n${m.text}\n\n`;
      });
      mimeType = 'text/markdown';
    } else {
      content = `${entry.title || 'Untitled Reflection'}\nDate: ${new Date(entry.createdAt).toLocaleString()}\n\n`;
      entry.messages.forEach((m) => {
        content += `[${m.role.toUpperCase()}]:\n${m.text}\n\n`;
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

  // Submit turn to Gemini with optimistic updates, non-blocking Firestore sync, and live SSE streaming
  const handleSubmitPrompt = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const textToSubmit = (customPrompt || inputText).trim();
    if (!textToSubmit || isGenerating) return;

    const tSubmit = performance.now();
    if (import.meta.env.DEV) {
      console.log('[PERF CLIENT] User message submitted');
    }

    setGenerationError(null);
    onClearSaveError();

    const userMessage: ChatMessage = {
      id: 'msg-user-' + Date.now(),
      role: 'user',
      text: textToSubmit,
      timestamp: new Date().toISOString(),
    };

    const previousMessages = [...entry.messages];
    const newMessages = [...previousMessages, userMessage];

    const updatedEntryWithUser: JournalEntry = {
      ...entry,
      initialPrompt: entry.initialPrompt || textToSubmit,
      messages: newMessages,
      updatedAt: new Date().toISOString(),
    };

    // 1. Optimistic UI update & Non-blocking background save to Firestore
    setInputText('');
    localStorage.removeItem(`reflectai_draft_${entry.id}`);
    onUpdateEntry(updatedEntryWithUser, { background: true });

    // 2. Start streaming generation immediately without waiting for database writes
    setIsGenerating(true);
    setStreamingText('');
    setStreamingModel('3.6 Flash');

    if (import.meta.env.DEV) {
      console.log(`[PERF CLIENT] Requesting Gemini API stream (+${(performance.now() - tSubmit).toFixed(1)}ms)`);
    }

    try {
      const historyPayload = previousMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          prompt: textToSubmit,
          history: historyPayload,
          mode: entry.mode,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      let modelReply = '';
      let modelUsed = 'gemini-3.6-flash';
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        // Handle streaming SSE
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let firstTokenLogged = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith('data: ')) {
              try {
                const payload = JSON.parse(trimmed.slice(6));
                if (payload.error) {
                  throw new Error(payload.error);
                }
                if (payload.chunk) {
                  if (!firstTokenLogged) {
                    firstTokenLogged = true;
                    if (import.meta.env.DEV) {
                      console.log(
                        `[PERF CLIENT] First token received (+${(performance.now() - tSubmit).toFixed(1)}ms)`
                      );
                    }
                  }
                  modelReply += payload.chunk;
                  setStreamingText(modelReply);
                  if (payload.modelUsed) {
                    setStreamingModel(payload.modelUsed);
                    modelUsed = payload.modelUsed;
                  }
                }
                if (payload.done && payload.modelUsed) {
                  modelUsed = payload.modelUsed;
                }
              } catch (parseErr: any) {
                if (parseErr.message && !parseErr.message.includes('JSON')) {
                  throw parseErr;
                }
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming response
        const data = await res.json();
        modelReply = data.reply || 'No response generated.';
        modelUsed = data.modelUsed || 'gemini-3.6-flash';
      }

      if (import.meta.env.DEV) {
        console.log(
          `[PERF CLIENT] Response complete from ${modelUsed} (+${(performance.now() - tSubmit).toFixed(1)}ms)`
        );
      }

      const modelMessage: ChatMessage = {
        id: 'msg-model-' + Date.now(),
        role: 'model',
        text: modelReply || 'I am listening and here with you.',
        timestamp: new Date().toISOString(),
        modelUsed: modelUsed || 'gemini-3.6-flash',
      };

      const finalEntry: JournalEntry = {
        ...updatedEntryWithUser,
        messages: [...newMessages, modelMessage],
        updatedAt: new Date().toISOString(),
      };

      // 3. Persist final AI turn to Firestore in the background
      await onUpdateEntry(finalEntry, { background: true });

      // 4. Concurrently generate session title in background if untitled
      if (entry.title === 'Untitled Reflection' || !entry.title) {
        fetch('/api/gemini/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry: textToSubmit }),
        })
          .then((tRes) => tRes.json())
          .then((tData) => {
            if (tData.title && tData.title !== 'Untitled Reflection') {
              onUpdateEntry(
                { ...finalEntry, title: tData.title },
                { background: true }
              );
            }
          })
          .catch((tErr) => console.warn('Background title generation skipped:', tErr));
      }
    } catch (apiErr: any) {
      console.error('Gemini reflection failed:', apiErr);
      setGenerationError(apiErr.message || 'Unable to connect to Gemini API. Please try again.');
    } finally {
      setIsGenerating(false);
      setStreamingText(null);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentMoodObj = entry.mood ? MOOD_OPTIONS.find((m) => m.type === entry.mood) : null;

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#fcf9f4] relative">
      {/* Desktop Top Bar / Entry Header (Unchanged for md+) */}
      <div className="hidden md:flex border-b border-[#e2d7cb] px-6 py-3 items-center justify-between gap-3 bg-[#fcf9f4] shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <input
              id="entry-title-input"
              type="text"
              value={entry.title}
              onChange={(e) => {
                const updated = { ...entry, title: e.target.value, updatedAt: new Date().toISOString() };
                onUpdateEntry(updated);
              }}
              placeholder="Reflection Title..."
              className="text-lg sm:text-xl font-serif font-semibold text-[#282220] border-none p-0 focus:outline-hidden focus:ring-0 placeholder:text-[#6e6259]/60 bg-transparent truncate flex-1"
            />

            {/* Favorite Toggle Button */}
            <button
              id="favorite-toggle-btn"
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                entry.favorite
                  ? 'text-[#d19a28] hover:text-[#b8851e]'
                  : 'text-[#6e6259] hover:text-[#282220]'
              }`}
              title={entry.favorite ? 'Favorited' : 'Add to Favorites'}
            >
              <Star className={`h-4 w-4 ${entry.favorite ? 'fill-[#d19a28]' : ''}`} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#6e6259] mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#9b4d36]" />
              {new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {/* Current Active Mode Badge on Tablet (md to <xl) */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9b4d36] bg-[#f0dfd4] px-2 py-0.5 rounded-md border border-[#e2d7cb] xl:hidden">
              {entry.mode === 'summarize' ? (
                <FileText className="h-3 w-3" />
              ) : entry.mode === 'brainstorm' ? (
                <Lightbulb className="h-3 w-3 text-[#c26d2d]" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span className="capitalize">{entry.mode}</span>
            </span>

            {/* Mood indicator on Tablet if tagged */}
            {currentMoodObj && (
              <button
                onClick={() => setIsMoodDropdownOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-[#e2d7cb] bg-[#f2ebe1] px-2.5 py-0.5 text-[11px] font-medium text-[#282220] hover:bg-[#e8dfd3] cursor-pointer xl:hidden"
                title="Change mood check-in"
              >
                <span>{currentMoodObj.emoji}</span>
                <span>{currentMoodObj.label}</span>
              </button>
            )}

            {/* Mood Pill / Dropdown (Desktop >=xl only) */}
            <div className="relative hidden xl:block">
              <button
                onClick={() => setIsMoodDropdownOpen(!isMoodDropdownOpen)}
                className="inline-flex items-center gap-1 rounded-full border border-[#e2d7cb] bg-[#f2ebe1] px-2.5 py-0.5 text-[11px] font-medium text-[#282220] hover:bg-[#e8dfd3] cursor-pointer"
                title="Change mood check-in"
              >
                {currentMoodObj ? (
                  <>
                    <span>{currentMoodObj.emoji}</span>
                    <span>{currentMoodObj.label}</span>
                  </>
                ) : (
                  <>
                    <Smile className="h-3 w-3 text-[#9b4d36]" />
                    <span>Tag Mood</span>
                  </>
                )}
                <ChevronDown className="h-2.5 w-2.5 text-[#6e6259]" />
              </button>

              {isMoodDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-30 w-44 rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] p-1.5 shadow-md">
                  <div className="grid grid-cols-4 gap-1 p-1">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.type}
                        onClick={() => {
                          handleSelectMood(m.type);
                          setIsMoodDropdownOpen(false);
                        }}
                        className="p-1 text-center rounded-lg hover:bg-[#f2ebe1] cursor-pointer text-lg"
                        title={m.label}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>
                  {entry.mood && (
                    <button
                      onClick={() => {
                        handleSelectMood(null);
                        setIsMoodDropdownOpen(false);
                      }}
                      className="w-full text-center text-[10px] text-[#6e6259] hover:text-[#282220] py-1 border-t border-[#e2d7cb] mt-1 cursor-pointer"
                    >
                      Clear mood
                    </button>
                  )}
                </div>
              )}
            </div>

            <span className="text-[#9b4d36] font-medium">
              {entry.messages.length} {entry.messages.length === 1 ? 'turn' : 'turns'}
            </span>
          </div>
        </div>

        {/* Tablet View: Clean "Reflection Options ▾" Popover (md to <xl) */}
        <div className="relative shrink-0 xl:hidden">
          <button
            id="tablet-reflection-options-btn"
            onClick={() => setIsTabletOptionsOpen(!isTabletOptionsOpen)}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-[#e2d7cb] px-3 py-1.5 text-xs font-medium transition-all cursor-pointer shadow-2xs ${
              isTabletOptionsOpen
                ? 'bg-[#e8dfd3] text-[#9b4d36] border-[#9b4d36]/40'
                : 'bg-[#f2ebe1] hover:bg-[#e8dfd3] text-[#282220]'
            }`}
            title="Reflection Options"
            aria-label="Reflection Options"
            aria-expanded={isTabletOptionsOpen}
          >
            <span>Reflection Options</span>
            <ChevronDown className={`h-3.5 w-3.5 text-[#6e6259] transition-transform ${isTabletOptionsOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Tablet Dropdown Menu */}
          {isTabletOptionsOpen && (
            <div
              ref={tabletOptionsMenuRef}
              id="tablet-reflection-options-menu"
              role="menu"
              aria-label="Reflection Options"
              className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-2xl border border-[#e2d7cb] bg-[#fcf9f4] shadow-xl p-2 text-xs text-[#282220] transition-all duration-150 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#e2d7cb] mb-1.5">
                <span className="font-semibold text-xs text-[#282220]">Reflection Options</span>
                <button
                  onClick={() => setIsTabletOptionsOpen(false)}
                  className="p-1 text-[#6e6259] hover:text-[#282220] rounded-lg hover:bg-[#f2ebe1] cursor-pointer"
                  aria-label="Close options"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                {/* ✨ Reflect */}
                <button
                  id="tablet-option-reflect"
                  role="menuitem"
                  onClick={() => {
                    handleModeChange('reflect');
                    setIsTabletOptionsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                    entry.mode === 'reflect'
                      ? 'bg-[#f2ebe1] border border-[#9b4d36]/30 text-[#9b4d36] font-semibold'
                      : 'hover:bg-[#f2ebe1] text-[#282220]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#9b4d36] shrink-0" />
                    <div>
                      <div className="font-medium text-xs">Reflect</div>
                      <div className="text-[10px] text-[#6e6259] font-normal">Thoughtful, open inquiry</div>
                    </div>
                  </div>
                  {entry.mode === 'reflect' && <Check className="h-3.5 w-3.5 text-[#9b4d36] shrink-0" />}
                </button>

                {/* 📄 Summarize */}
                <button
                  id="tablet-option-summarize"
                  role="menuitem"
                  onClick={() => {
                    handleModeChange('summarize');
                    setIsTabletOptionsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                    entry.mode === 'summarize'
                      ? 'bg-[#f2ebe1] border border-[#9b4d36]/30 text-[#9b4d36] font-semibold'
                      : 'hover:bg-[#f2ebe1] text-[#282220]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#9b4d36] shrink-0" />
                    <div>
                      <div className="font-medium text-xs">Summarize</div>
                      <div className="text-[10px] text-[#6e6259] font-normal">Key takeaways & core points</div>
                    </div>
                  </div>
                  {entry.mode === 'summarize' && <Check className="h-3.5 w-3.5 text-[#9b4d36] shrink-0" />}
                </button>

                {/* 💡 Brainstorm */}
                <button
                  id="tablet-option-brainstorm"
                  role="menuitem"
                  onClick={() => {
                    handleModeChange('brainstorm');
                    setIsTabletOptionsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                    entry.mode === 'brainstorm'
                      ? 'bg-[#f2ebe1] border border-[#c26d2d]/40 text-[#c26d2d] font-semibold'
                      : 'hover:bg-[#f2ebe1] text-[#282220]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-[#c26d2d] shrink-0" />
                    <div>
                      <div className="font-medium text-xs">Brainstorm</div>
                      <div className="text-[10px] text-[#6e6259] font-normal">Creative perspective shifts</div>
                    </div>
                  </div>
                  {entry.mode === 'brainstorm' && <Check className="h-3.5 w-3.5 text-[#c26d2d] shrink-0" />}
                </button>

                {/* 🙂 Tag Mood */}
                <button
                  id="tablet-option-tag-mood"
                  role="menuitem"
                  onClick={() => {
                    setIsTabletOptionsOpen(false);
                    setIsMoodDropdownOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f2ebe1] text-[#282220] transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-[#9b4d36] shrink-0" />
                    <div>
                      <div className="font-medium text-xs">Tag Mood</div>
                      <div className="text-[10px] text-[#6e6259]">
                        {currentMoodObj ? `Currently: ${currentMoodObj.emoji} ${currentMoodObj.label}` : 'Check in how you are feeling'}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#6e6259] shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop View: Full Mode Selector Chips (>=xl only) */}
        <div className="hidden xl:flex items-center gap-1.5 p-1 rounded-xl bg-[#f2ebe1] border border-[#e2d7cb]">
          <button
            id="mode-reflect-btn"
            type="button"
            onClick={() => handleModeChange('reflect')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              entry.mode === 'reflect'
                ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs font-semibold'
                : 'text-[#6e6259] hover:text-[#282220]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#9b4d36]" />
            <span>Reflect</span>
          </button>

          <button
            id="mode-summarize-btn"
            type="button"
            onClick={() => handleModeChange('summarize')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              entry.mode === 'summarize'
                ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs font-semibold'
                : 'text-[#6e6259] hover:text-[#282220]'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#9b4d36]" />
            <span>Summarize</span>
          </button>

          <button
            id="mode-brainstorm-btn"
            type="button"
            onClick={() => handleModeChange('brainstorm')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              entry.mode === 'brainstorm'
                ? 'bg-[#fcf9f4] text-[#9b4d36] shadow-2xs font-semibold'
                : 'text-[#6e6259] hover:text-[#282220]'
            }`}
          >
            <Lightbulb className="h-3.5 w-3.5 text-[#c26d2d]" />
            <span>Brainstorm</span>
          </button>
        </div>

        {/* Actions: Export & Delete */}
        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="p-1.5 text-[#6e6259] hover:text-[#282220] hover:bg-[#f2ebe1] rounded-lg transition-colors cursor-pointer"
              title="Export Reflection"
              aria-label="Export Reflection"
            >
              <Download className="h-4 w-4" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-30 w-36 rounded-xl border border-[#e2d7cb] bg-[#fcf9f4] p-1 shadow-md text-xs">
                <button
                  onClick={() => handleExport('md')}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#f2ebe1] cursor-pointer text-[#282220]"
                >
                  Markdown (.md)
                </button>
                <button
                  onClick={() => handleExport('txt')}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#f2ebe1] cursor-pointer text-[#282220]"
                >
                  Plain Text (.txt)
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#f2ebe1] cursor-pointer text-[#282220]"
                >
                  Raw JSON (.json)
                </button>
              </div>
            )}
          </div>

          {/* Delete Single Entry */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-1.5 text-[#6e6259] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/60 rounded-lg transition-colors cursor-pointer"
            title="Delete Reflection"
            aria-label="Delete Reflection"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Top Bar / Entry Header (Clean, uncrowded mobile header) */}
      <div className="md:hidden border-b border-[#e2d7cb] px-3 py-2 bg-[#fcf9f4] shrink-0 relative">
        {/* Row 1: Back Button, Title (truncating gracefully), Favorite, Reflection Options button */}
        <div className="flex items-center gap-1.5 min-w-0">
          {onBack && (
            <button
              id="mobile-editor-back-btn"
              onClick={onBack}
              className="p-1 -ml-1 text-[#9b4d36] hover:bg-[#f2ebe1] rounded-lg transition-colors cursor-pointer shrink-0"
              title="Back to reflections"
              aria-label="Back to reflections"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <input
            id="mobile-entry-title-input"
            type="text"
            value={entry.title}
            onChange={(e) => {
              const updated = { ...entry, title: e.target.value, updatedAt: new Date().toISOString() };
              onUpdateEntry(updated);
            }}
            placeholder="Untitled Reflection"
            className="text-base font-serif font-semibold text-[#282220] border-none p-0 focus:outline-hidden focus:ring-0 placeholder:text-[#6e6259]/60 bg-transparent truncate flex-1 min-w-0"
          />

          {/* Favorite Toggle Button */}
          <button
            id="mobile-favorite-toggle-btn"
            onClick={handleToggleFavorite}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
              entry.favorite ? 'text-[#d19a28] hover:text-[#b8851e]' : 'text-[#6e6259] hover:text-[#282220]'
            }`}
            title={entry.favorite ? 'Favorited' : 'Add to Favorites'}
            aria-label="Toggle Favorite"
          >
            <Star className={`h-4 w-4 ${entry.favorite ? 'fill-[#d19a28]' : ''}`} />
          </button>

          {/* Compact Reflection Options Button (⋮ icon button / Reflection Options) */}
          <div className="relative shrink-0">
            <button
              id="mobile-reflection-options-btn"
              onClick={() => setIsMobileOptionsOpen(!isMobileOptionsOpen)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                isMobileOptionsOpen
                  ? 'bg-[#e8dfd3] text-[#9b4d36]'
                  : 'text-[#6e6259] hover:text-[#282220] hover:bg-[#f2ebe1]'
              }`}
              title="Reflection Options"
              aria-label="Reflection Options"
              aria-expanded={isMobileOptionsOpen}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Date & time + Active Mode / Mood Indicator */}
        <div className="flex items-center justify-between text-[11px] text-[#6e6259] pt-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="h-3 w-3 text-[#9b4d36]" />
              <span>
                {new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </span>

            {/* Quick Mood Tag Display if present */}
            {currentMoodObj && (
              <button
                onClick={() => setIsMoodDropdownOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] text-[#282220] bg-[#f2ebe1] border border-[#e2d7cb] rounded-full px-2 py-0.5 cursor-pointer hover:bg-[#e8dfd3] transition-colors"
                title="Change mood check-in"
              >
                <span>{currentMoodObj.emoji}</span>
                <span className="truncate max-w-[65px]">{currentMoodObj.label}</span>
              </button>
            )}
          </div>

          {/* Active Mode pill with dropdown chevron: tapping this also opens the options menu! */}
          <button
            id="mobile-active-mode-pill"
            onClick={() => setIsMobileOptionsOpen(!isMobileOptionsOpen)}
            className="inline-flex items-center gap-1 rounded-full border border-[#e2d7cb] bg-[#f2ebe1] hover:bg-[#e8dfd3] px-2.5 py-0.5 text-[11px] font-medium text-[#9b4d36] cursor-pointer shadow-2xs transition-colors shrink-0"
            title="Change reflection options"
          >
            {entry.mode === 'summarize' ? (
              <FileText className="h-3 w-3" />
            ) : entry.mode === 'brainstorm' ? (
              <Lightbulb className="h-3 w-3 text-[#c26d2d]" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            <span className="capitalize">{entry.mode || 'reflect'}</span>
            <ChevronDown className="h-2.5 w-2.5 text-[#6e6259]" />
          </button>
        </div>

        {/* Backdrop for mobile options menu */}
        {isMobileOptionsOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/15 transition-opacity duration-150"
            onClick={() => setIsMobileOptionsOpen(false)}
          />
        )}

        {/* Reflection Options Popover Dropdown (Subtle 150-200ms animation) */}
        {isMobileOptionsOpen && (
          <div
            ref={optionsMenuRef}
            id="mobile-reflection-options-menu"
            role="menu"
            aria-label="Reflection Options"
            className="absolute right-3 top-full mt-1.5 z-50 w-72 max-w-[calc(100vw-24px)] rounded-2xl border border-[#e2d7cb] bg-[#fcf9f4] shadow-xl p-2.5 text-xs text-[#282220] transition-all duration-150 transform origin-top-right animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#e2d7cb] mb-1.5">
              <span className="font-semibold text-xs text-[#282220] tracking-wide">
                Reflection Options
              </span>
              <button
                onClick={() => setIsMobileOptionsOpen(false)}
                className="p-1 text-[#6e6259] hover:text-[#282220] rounded-lg hover:bg-[#f2ebe1] cursor-pointer"
                aria-label="Close options"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {/* ✨ Reflect Mode */}
              <button
                id="mobile-option-reflect"
                role="menuitem"
                onClick={() => {
                  handleModeChange('reflect');
                  setIsMobileOptionsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                  entry.mode === 'reflect'
                    ? 'bg-[#f2ebe1] border border-[#9b4d36]/30 text-[#9b4d36] font-semibold'
                    : 'hover:bg-[#f2ebe1] text-[#282220]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-[#9b4d36] shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Reflect</div>
                    <div className="text-[10px] text-[#6e6259] font-normal">Thoughtful, open inquiry & contemplation</div>
                  </div>
                </div>
                {entry.mode === 'reflect' && <Check className="h-3.5 w-3.5 text-[#9b4d36] shrink-0" />}
              </button>

              {/* 📄 Summarize Mode */}
              <button
                id="mobile-option-summarize"
                role="menuitem"
                onClick={() => {
                  handleModeChange('summarize');
                  setIsMobileOptionsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                  entry.mode === 'summarize'
                    ? 'bg-[#f2ebe1] border border-[#9b4d36]/30 text-[#9b4d36] font-semibold'
                    : 'hover:bg-[#f2ebe1] text-[#282220]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-[#9b4d36] shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Summarize</div>
                    <div className="text-[10px] text-[#6e6259] font-normal">Clear takeaway bullets & core points</div>
                  </div>
                </div>
                {entry.mode === 'summarize' && <Check className="h-3.5 w-3.5 text-[#9b4d36] shrink-0" />}
              </button>

              {/* 💡 Brainstorm Mode */}
              <button
                id="mobile-option-brainstorm"
                role="menuitem"
                onClick={() => {
                  handleModeChange('brainstorm');
                  setIsMobileOptionsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                  entry.mode === 'brainstorm'
                    ? 'bg-[#f2ebe1] border border-[#c26d2d]/40 text-[#c26d2d] font-semibold'
                    : 'hover:bg-[#f2ebe1] text-[#282220]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lightbulb className="h-4 w-4 text-[#c26d2d] shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Brainstorm</div>
                    <div className="text-[10px] text-[#6e6259] font-normal">Creative perspective shifts & solutions</div>
                  </div>
                </div>
                {entry.mode === 'brainstorm' && <Check className="h-3.5 w-3.5 text-[#c26d2d] shrink-0" />}
              </button>

              {/* 🙂 Tag Mood */}
              <button
                id="mobile-option-tag-mood"
                role="menuitem"
                onClick={() => {
                  setIsMobileOptionsOpen(false);
                  setIsMoodDropdownOpen(true);
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#f2ebe1] text-[#282220] transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Smile className="h-4 w-4 text-[#9b4d36] shrink-0" />
                  <div>
                    <div className="font-medium text-xs">Tag Mood</div>
                    <div className="text-[10px] text-[#6e6259]">
                      {currentMoodObj ? `Currently: ${currentMoodObj.emoji} ${currentMoodObj.label}` : 'Check in how you are feeling'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[#6e6259] shrink-0" />
              </button>
            </div>

            {/* Preserved Actions: Export & Delete */}
            <div className="border-t border-[#e2d7cb] my-1.5 pt-1.5 space-y-1">
              <div className="px-2 py-1">
                <div className="text-[10px] font-semibold uppercase text-[#6e6259] tracking-wider mb-1 flex items-center gap-1.5">
                  <Download className="h-3 w-3 text-[#9b4d36]" />
                  <span>Export Reflection</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      handleExport('md');
                      setIsMobileOptionsOpen(false);
                    }}
                    className="px-2 py-1 text-center rounded-lg bg-[#f2ebe1] hover:bg-[#e8dfd3] text-[11px] text-[#282220] cursor-pointer"
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => {
                      handleExport('txt');
                      setIsMobileOptionsOpen(false);
                    }}
                    className="px-2 py-1 text-center rounded-lg bg-[#f2ebe1] hover:bg-[#e8dfd3] text-[11px] text-[#282220] cursor-pointer"
                  >
                    Text
                  </button>
                  <button
                    onClick={() => {
                      handleExport('json');
                      setIsMobileOptionsOpen(false);
                    }}
                    className="px-2 py-1 text-center rounded-lg bg-[#f2ebe1] hover:bg-[#e8dfd3] text-[11px] text-[#282220] cursor-pointer"
                  >
                    JSON
                  </button>
                </div>
              </div>

              <button
                id="mobile-option-delete"
                onClick={() => {
                  setIsMobileOptionsOpen(false);
                  setIsDeleteModalOpen(true);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-colors cursor-pointer text-xs font-medium"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Reflection</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sync / Persistence Status Banner (Single Compact Row) */}
      <div className="px-3 sm:px-6 py-1 bg-[#f2ebe1]/80 border-b border-[#e2d7cb] flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-[#6e6259] shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {isSaving ? (
            <span className="flex items-center gap-1 text-[#9b4d36]">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </span>
          ) : saveError ? (
            <span className="flex items-center gap-1 text-[#ba1a1a] font-semibold">
              <AlertCircle className="h-3 w-3" />
              <span>Save error</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#9b4d36] font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>Saved & Isolated</span>
            </span>
          )}
        </div>

        <span className="text-[10px] text-[#6e6259]/90 shrink-0">
          Gemini 3.6 Flash
        </span>
      </div>

      {/* Error Banners */}
      {saveError && (
        <div
          id="save-error-banner"
          className="mx-3 sm:mx-4 mt-2 rounded-xl border border-[#e8c7bd] bg-[#f7dfd6] p-2.5 sm:p-3 text-xs text-[#9e5a3f] flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#9e5a3f] shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            onClick={() => onUpdateEntry(entry)}
            className="rounded-lg bg-[#9e5a3f] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#85452d] cursor-pointer"
          >
            Retry Save
          </button>
        </div>
      )}

      {generationError && (
        <div
          id="generation-error-banner"
          className="mx-3 sm:mx-4 mt-2 rounded-xl border border-[#e8c7bd] bg-[#f7dfd6] p-2.5 sm:p-3 text-xs text-[#9e5a3f] flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#9e5a3f] shrink-0" />
            <span>Gemini Generation: {generationError}</span>
          </div>
          <button
            onClick={() => handleSubmitPrompt(undefined, entry.messages[entry.messages.length - 1]?.text)}
            className="rounded-lg bg-[#9b4d36] px-2.5 py-1 text-xs font-semibold text-[#ffffff] hover:bg-[#833f2b] cursor-pointer"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* Conversation Thread / Main Content Area (Primary Scrollable Area) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-6 sm:py-6 space-y-3.5 sm:space-y-6">
        {entry.messages.length === 0 ? (
          <div className="py-2 max-w-lg mx-auto w-full">
            {/* Compact Empty State Message */}
            <div className="flex items-center gap-2.5 mb-3 px-1">
              <div className="h-7 w-7 rounded-lg bg-[#f2ebe1] border border-[#e2d7cb] flex items-center justify-center text-[#9b4d36] shrink-0 shadow-2xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-semibold text-[#282220]">
                  No reflections yet
                </h3>
                <p className="text-[11px] text-[#6e6259] leading-tight">
                  Share your thoughts in English, Tamil, or Tanglish.
                </p>
              </div>
            </div>

            {/* Simple Starters (Fits inside viewport with natural wrap) */}
            <div className="w-full space-y-2 text-left">
              <p className="text-[10px] sm:text-xs font-semibold text-[#9b4d36] uppercase tracking-wider px-1">
                Simple Starters
              </p>
              {[
                'Today was really busy and stressful...',
                'I have a big deadline coming up and feel worried...',
                'Something good happened today that made me happy...',
                'I feel stuck and do not know what to do next...',
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  id={`starter-prompt-${idx}`}
                  onClick={() => handleSubmitPrompt(undefined, prompt)}
                  className="w-full text-left p-3 rounded-xl border border-[#e2d7cb] bg-[#f2ebe1] hover:border-[#9b4d36] hover:bg-[#fcf9f4] text-xs sm:text-sm text-[#282220] transition-all flex items-center justify-between gap-2 group shadow-2xs cursor-pointer"
                >
                  <span className="leading-snug break-words flex-1 pr-1">{prompt}</span>
                  <Send className="h-3.5 w-3.5 text-[#6e6259] group-hover:text-[#9b4d36] group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          entry.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 sm:gap-3 max-w-3xl ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-[#833f2b] text-[#ffffff]'
                    : 'bg-[#ffd8cd] text-[#9b4d36] shadow-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm leading-relaxed max-w-[90%] sm:max-w-[80%] relative group ${
                  msg.role === 'user'
                    ? 'bg-[#9b4d36] text-[#ffffff] font-normal shadow-xs'
                    : 'bg-[#f2ebe1] border border-[#e2d7cb] text-[#282220] shadow-xs'
                }`}
              >
                {/* Role Header & Copy button */}
                <div
                  className={`flex items-center justify-between gap-3 mb-1.5 pb-1 text-[10px] sm:text-[11px] ${
                    msg.role === 'user'
                      ? 'border-b border-white/20 text-white/80'
                      : 'border-b border-[#e2d7cb] text-[#6e6259]'
                  }`}
                >
                  <span className="font-medium">
                    {msg.role === 'user' ? 'You' : `Gemini (${msg.modelUsed || '3.6 Flash'})`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      onClick={() => handleCopyText(msg.text, msg.id)}
                      className="p-1 hover:opacity-100 opacity-60 rounded transition-opacity cursor-pointer"
                      title="Copy message text"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-emerald-300" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Content rendering */}
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="prose prose-sm max-w-none text-[#282220] leading-relaxed">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Live Streaming Response or Thinking Indicator */}
        {isGenerating && (
          <div className="flex gap-2 sm:gap-3 max-w-3xl mr-auto">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg sm:rounded-xl bg-[#ffd8cd] text-[#9b4d36] flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>

            {streamingText ? (
              <div className="rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm leading-relaxed max-w-[90%] sm:max-w-[80%] bg-[#f2ebe1] border border-[#e2d7cb] text-[#282220] shadow-xs">
                <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 text-[10px] sm:text-[11px] border-b border-[#e2d7cb] text-[#6e6259]">
                  <span className="font-medium flex items-center gap-1.5">
                    Gemini ({streamingModel})
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  </span>
                  <span className="text-[10px] text-[#6e6259]">Streaming reply...</span>
                </div>
                <div className="prose prose-sm max-w-none text-[#282220] leading-relaxed">
                  <ReactMarkdown>{streamingText}</ReactMarkdown>
                </div>
                <span className="inline-block w-1.5 h-3.5 bg-[#9b4d36] animate-pulse ml-0.5 align-middle" />
              </div>
            ) : (
              <div className="rounded-2xl px-3.5 py-2.5 bg-[#f2ebe1] border border-[#e2d7cb] text-[#9b4d36] text-xs flex items-center gap-2 shadow-xs">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-[#9b4d36] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-[#9b4d36] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-[#9b4d36] rounded-full animate-bounce"></div>
                </div>
                <span className="font-medium text-[#282220]">
                  Thinking...
                </span>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Tray (Follow-ups + Message Composer + Keyboard Padding) */}
      <div
        className={`border-t border-[#e2d7cb] bg-[#fcf9f4] p-2.5 sm:p-4 shrink-0 transition-all duration-150 ${
          isKeyboardOpen || isTextareaFocused
            ? 'pb-2 md:pb-4'
            : 'pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-4'
        }`}
      >
        <form onSubmit={handleSubmitPrompt} className="max-w-4xl mx-auto w-full">
          {/* Quick Prompts / Follow-ups Bar (Horizontally scrollable with hidden scrollbar) */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar w-full py-0.5 text-xs text-[#6e6259]">
            <span className="font-semibold text-[#9b4d36] shrink-0 text-[10px] sm:text-[11px] uppercase tracking-wider whitespace-nowrap">
              Follow-ups:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {(entry.mode === 'brainstorm' ? BRAINSTORM_QUICK_ACTIONS : QUICK_PROMPTS).map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSubmitPrompt(undefined, qp)}
                  disabled={entry.messages.length === 0 || isGenerating}
                  className="inline-flex items-center gap-1 rounded-full border border-[#e2d7cb] bg-[#f2ebe1] px-2.5 py-1 text-[11px] sm:text-xs text-[#282220] hover:bg-[#e8dfd3] disabled:opacity-40 transition-colors whitespace-nowrap cursor-pointer shrink-0 shadow-2xs"
                >
                  <span>{qp}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl border border-[#e2d7cb] focus-within:border-[#9b4d36] focus-within:ring-1 focus-within:ring-[#9b4d36] bg-[#f2ebe1] transition-all shadow-xs w-full">
            <textarea
              id="reflection-prompt-input"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setIsTextareaFocused(true)}
              onBlur={() => setIsTextareaFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitPrompt();
                }
              }}
              placeholder={
                entry.messages.length === 0
                  ? 'Write what is on your mind... (English, Tamil, or Tanglish welcome!)'
                  : 'Reply or ask something... (Press Enter to send)'
              }
              className="w-full resize-none border-0 bg-transparent px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-[#282220] placeholder:text-[#6e6259]/70 focus:outline-hidden min-h-[50px] max-h-[120px]"
            />

            <div className="flex items-center justify-between px-3 py-1.5 sm:py-2 border-t border-[#e2d7cb] bg-[#e8dfd3]/60 rounded-b-2xl">
              <span className="text-[10px] sm:text-[11px] text-[#6e6259] hidden sm:inline truncate mr-2">
                Shift + Enter for new line · Autosaved locally & isolated in Firestore
              </span>
              <button
                id="submit-prompt-btn"
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#9b4d36] px-3.5 py-1.5 text-xs font-semibold text-[#ffffff] shadow-xs hover:bg-[#833f2b] disabled:opacity-50 transition-all cursor-pointer shrink-0 ml-auto"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Reflecting...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Mood Selector Modal (Shared across Mobile and Tablet) */}
      {isMoodDropdownOpen && (
        <div
          id="mood-selector-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 transition-opacity duration-150"
          onClick={() => setIsMoodDropdownOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-[#e2d7cb] bg-[#fcf9f4] p-4 shadow-xl text-center animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#e2d7cb]">
              <h4 className="font-serif font-semibold text-sm text-[#282220]">How are you feeling?</h4>
              <button
                onClick={() => setIsMoodDropdownOpen(false)}
                className="p-1 text-[#6e6259] hover:text-[#282220] rounded-lg hover:bg-[#f2ebe1] cursor-pointer"
                aria-label="Close mood selector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 py-1">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.type}
                  onClick={() => {
                    handleSelectMood(m.type);
                    setIsMoodDropdownOpen(false);
                  }}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                    entry.mood === m.type
                      ? 'border-[#9b4d36] bg-[#f2ebe1] text-[#9b4d36] font-semibold shadow-2xs'
                      : 'border-transparent hover:bg-[#f2ebe1] text-[#282220]'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] mt-1 truncate max-w-full">{m.label}</span>
                </button>
              ))}
            </div>
            {entry.mood && (
              <button
                onClick={() => {
                  handleSelectMood(null);
                  setIsMoodDropdownOpen(false);
                }}
                className="w-full text-center text-xs text-[#6e6259] hover:text-[#ba1a1a] py-2 border-t border-[#e2d7cb] mt-2 cursor-pointer font-medium"
              >
                Clear mood check-in
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Entry Deletion */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete This Reflection?"
        message={`Are you sure you want to delete "${entry.title || 'Untitled Reflection'}"? This action cannot be undone.`}
        confirmLabel="Delete Reflection"
        confirmVariant="danger"
        onConfirm={async () => {
          setIsDeleteModalOpen(false);
          await onDeleteEntry(entry.id);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
