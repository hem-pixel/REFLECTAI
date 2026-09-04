import type { MoodOption } from './types';

export const MOOD_OPTIONS: MoodOption[] = [
  { type: 'happy', emoji: '😊', label: 'Happy', color: '#f7ebc3' },
  { type: 'calm', emoji: '😌', label: 'Calm', color: '#d8e5d8' },
  { type: 'neutral', emoji: '😐', label: 'Neutral', color: '#f2ebe1' },
  { type: 'sad', emoji: '😔', label: 'Sad', color: '#dbe2ea' },
  { type: 'anxious', emoji: '😰', label: 'Anxious', color: '#fae3d9' },
  { type: 'angry', emoji: '😡', label: 'Angry', color: '#f7d2cb' },
  { type: 'tired', emoji: '😴', label: 'Tired', color: '#e5e1ea' },
  { type: 'excited', emoji: '🤩', label: 'Excited', color: '#fbe8cb' },
];

export const DAILY_PROMPTS = [
  'What was the busiest or hardest part of your day?',
  'What went well today, even something small?',
  'What is on your mind the most right now?',
  'What is making you feel tired or stressed today?',
  'What is one small thing that made you smile today?',
  'What would make tomorrow feel a little easier?',
  'What thought keeps coming back in your head?',
  'Did you get any time to rest or take a break today?',
  'What is something you feel proud of today?',
  'What do you wish someone would tell you right now?',
];

export const QUICK_PROMPTS = [
  'Help me think about this',
  'Ask me one good question',
  'Summarize this simply',
  'What do you notice?',
  'Give me 1 simple thing to try',
  'How else can I look at this?',
];

export const BRAINSTORM_QUICK_ACTIONS = [
  'Give me 3 simple ideas',
  'Make it even simpler',
  'What should I do first?',
];
