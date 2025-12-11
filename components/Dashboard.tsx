import React from 'react';
import { AppModule, DashboardModule } from '../types';
import {
  HomeIcon,
  StickyNoteIcon,
  CheckSquareIcon,
  MessageCircleIcon,
  ClockIcon
} from './Icons';

interface DashboardProps {
  activeModule: AppModule;
  onModuleChange: (module: AppModule) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ activeModule, onModuleChange }) => {
  const modules: DashboardModule[] = [
    {
      id: AppModule.NOTES,
      title: '智能笔记',
      description: '创建、编辑和整理你的笔记',
      icon: '📝',
      color: 'bg-gradient-to-br from-pink-100 to-red-100 border-pink-300 hover:border-red-400',
      path: '/notes'
    },
    {
      id: AppModule.TODOS,
      title: '待办清单',
      description: '管理任务和追踪进度',
      icon: '✅',
      color: 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 hover:border-emerald-400',
      path: '/todos'
    },
    {
      id: AppModule.AI_CHAT,
      title: 'AI 对话',
      description: '与AI助手聊天获取帮助',
      icon: '🤖',
      color: 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-300 hover:border-indigo-400',
      path: '/ai-chat'
    },
    {
      id: AppModule.POMODORO,
      title: '番茄时钟',
      description: '专注工作和休息时间管理',
      icon: '🍅',
      color: 'bg-gradient-to-br from-orange-100 to-yellow-100 border-orange-300 hover:border-yellow-400',
      path: '/pomodoro'
    }
  ];

  const getModuleIcon = (moduleId: AppModule) => {
    switch (moduleId) {
      case AppModule.DASHBOARD:
        return <HomeIcon className="w-8 h-8 text-gray-700" />;
      case AppModule.NOTES:
        return <StickyNoteIcon className="w-8 h-8 text-gray-700" />;
      case AppModule.TODOS:
        return <CheckSquareIcon className="w-8 h-8 text-gray-700" />;
      case AppModule.AI_CHAT:
        return <MessageCircleIcon className="w-8 h-8 text-gray-700" />;
      case AppModule.POMODORO:
        return <ClockIcon className="w-8 h-8 text-gray-700" />;
      default:
        return <HomeIcon className="w-8 h-8 text-gray-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-center text-gray-800 mb-2 tracking-tight">
          <span className="text-primary">o</span>
          <span className="text-secondary">R</span>
          <span className="text-accent">A</span>
          <span className="text-highlight">I</span>
          <span className="text-fresh">N</span>
          <span className="text-fun-blue">ginal</span>
        </h1>
        <p className="text-center text-gray-700 text-lg font-medium">
          欢迎回来！选择一个功能开始你的高效工作
        </p>
      </div>

      {/* Module Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <div
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={`
              relative bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-6
              cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl
              ${activeModule === module.id ? 'ring-4 ring-offset-2 ring-offset-transparent ring-primary' : ''}
              ${module.color}
            `}
          >
            {/* Module Icon */}
            <div className="flex items-center mb-4">
              <div className="p-3 bg-white rounded-2xl border-2 border-black shadow-sm">
                {getModuleIcon(module.id)}
              </div>
              <div className="ml-4">
                <span className="text-3xl">{module.icon}</span>
              </div>
            </div>

            {/* Module Content */}
            <h3 className="text-xl font-black text-gray-800 mb-2 tracking-tight">
              {module.title}
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              {module.description}
            </p>

            {/* Hover Indicator */}
            <div className="mt-4 flex items-center text-gray-500 text-sm font-medium">
              <span>点击进入</span>
              <svg
                className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Active Module Indicator */}
            {activeModule === module.id && (
              <div className="absolute top-4 right-4 bg-primary text-white text-xs font-black px-3 py-1 rounded-full">
                当前
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats or Recent Activity */}
      <div className="max-w-7xl mx-auto mt-12">
        <div className="bg-white/90 backdrop-blur-lg border-4 border-black rounded-3xl shadow-dopamine p-6">
          <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            快速概览
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-blue-700 mb-1">📝</div>
              <div className="text-xl font-bold text-gray-800">笔记</div>
              <div className="text-sm text-gray-600">今日 +3</div>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-green-700 mb-1">✅</div>
              <div className="text-xl font-bold text-gray-800">待办</div>
              <div className="text-sm text-gray-600">5/12 完成</div>
            </div>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-purple-700 mb-1">🤖</div>
              <div className="text-xl font-bold text-gray-800">对话</div>
              <div className="text-sm text-gray-600">今日 8 次</div>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-orange-700 mb-1">🍅</div>
              <div className="text-xl font-bold text-gray-800">专注</div>
              <div className="text-sm text-gray-600">125 分钟</div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="max-w-7xl mx-auto mt-8 text-center">
        <div className="bg-white/60 backdrop-blur border-2 border-white/30 rounded-2xl p-4">
          <p className="text-gray-700 font-medium">
            <span className="text-2xl mr-2">🌟</span>
            今天也要加油！每一个小进步都是成功的积累
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
