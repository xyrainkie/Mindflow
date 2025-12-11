export enum Category {
  ALL = 'ALL',
  WORK = 'WORK',
  KNOWLEDGE = 'KNOWLEDGE', // Professional Knowledge
  LIFE = 'LIFE', // Life Insights
  MEMO = 'MEMO', // Quick Memo
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  _count?: {
    notes: number;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category;
  createdAt: number;
  updatedAt: number;
  tags: Tag[];
  userId?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface NotesResponse {
  notes: Note[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type AIActionType = 'summarize' | 'polish' | 'expand' | 'action_items' | 'extract';

export interface AIState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
  actionType: AIActionType | null;
}

// App Navigation and UI Types
export enum AppModule {
  DASHBOARD = 'DASHBOARD',
  NOTES = 'NOTES',
  TODOS = 'TODOS',
  AI_CHAT = 'AI_CHAT',
  POMODORO = 'POMODORO'
}

export interface DashboardModule {
  id: AppModule;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
}

// To-Do List Types
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TodoPriority;
  category?: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

export enum TodoPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface TodoResponse {
  todos: Todo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// AI Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  userId?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  userId?: string;
}

export interface ChatResponse {
  sessions: ChatSession[];
  currentSession?: ChatSession;
}

// Pomodoro Timer Types
export interface PomodoroSession {
  id: string;
  type: PomodoroType;
  duration: number; // in seconds
  startTime: number;
  endTime?: number;
  status: PomodoroStatus;
  taskDescription?: string;
  completedPomodoros?: number;
  targetPomodoros?: number;
  userId?: string;
}

export enum PomodoroType {
  WORK = 'WORK',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK'
}

export enum PomodoroStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // pomodoros before long break
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
}