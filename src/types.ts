export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export type ReflectionMode = 'reflect' | 'summarize' | 'brainstorm';

export type MoodType =
  | 'happy'
  | 'calm'
  | 'neutral'
  | 'sad'
  | 'anxious'
  | 'angry'
  | 'tired'
  | 'excited';

export interface MoodOption {
  type: MoodType;
  emoji: string;
  label: string;
  color: string;
}

export interface MicroHabit {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  reminderTime?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  initialPrompt: string;
  mode: ReflectionMode;
  mood?: MoodType | null;
  favorite?: boolean;
  messages: ChatMessage[];
  microHabit?: MicroHabit | null;
  summary?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isArchived?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type AppView = 'dashboard' | 'editor' | 'insights' | 'history' | 'favorites' | 'privacy';

export interface AIInsightsSummary {
  frequentTopics: string[];
  commonEmotions: { mood: MoodType; count: number }[];
  recurringConcerns: string[];
  positivePatterns: string[];
  productivityPatterns: string[];
  observations: string[];
  streakDays: number;
  totalReflections: number;
  mostActiveTime: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

