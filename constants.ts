import { Category } from './types';

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.ALL]: '全部笔记',
  [Category.WORK]: '工作要点',
  [Category.KNOWLEDGE]: '专业知识',
  [Category.LIFE]: '生活感悟',
  [Category.MEMO]: '备忘录',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.ALL]: 'text-gray-700 bg-white border-gray-200 hover:border-gray-300',
  [Category.WORK]: 'text-blue-700 bg-blue-100 border-blue-200 hover:border-blue-300', // Bright Blue
  [Category.KNOWLEDGE]: 'text-purple-700 bg-purple-100 border-purple-200 hover:border-purple-300', // Electric Purple
  [Category.LIFE]: 'text-green-700 bg-green-100 border-green-200 hover:border-green-300', // Fresh Green
  [Category.MEMO]: 'text-orange-700 bg-orange-100 border-orange-200 hover:border-orange-300', // Vivid Orange
};

// Specific dopamine style mapping for tags/badges
export const CATEGORY_BADGES: Record<Category, string> = {
  [Category.ALL]: 'bg-gray-100 text-gray-700',
  [Category.WORK]: 'bg-fun-blue text-white',
  [Category.KNOWLEDGE]: 'bg-fun-purple text-white',
  [Category.LIFE]: 'bg-fun-green text-white',
  [Category.MEMO]: 'bg-fun-yellow text-gray-900',
};