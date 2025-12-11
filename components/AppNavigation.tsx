import React from 'react';
import { AppModule } from '../types';
import {
  HomeIcon,
  StickyNoteIcon,
  CheckSquareIcon,
  MessageCircleIcon,
  ClockIcon
} from './Icons';

interface AppNavigationProps {
  activeModule: AppModule;
  onModuleChange: (module: AppModule) => void;
  user?: { username: string } | null;
  onLogout?: () => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onCloseMobile?: () => void;
}

const AppNavigation: React.FC<AppNavigationProps> = ({
  activeModule,
  onModuleChange,
  user,
  onLogout,
  isMobile = false,
  isOpen = true,
  onCloseMobile
}) => {
  const navigationItems = [
    {
      id: AppModule.DASHBOARD,
      label: '主页面',
      icon: HomeIcon,
      color: 'text-blue-600'
    },
    {
      id: AppModule.NOTES,
      label: '智能笔记',
      icon: StickyNoteIcon,
      color: 'text-pink-600'
    },
    {
      id: AppModule.TODOS,
      label: '待办清单',
      icon: CheckSquareIcon,
      color: 'text-green-600'
    },
    {
      id: AppModule.AI_CHAT,
      label: 'AI对话',
      icon: MessageCircleIcon,
      color: 'text-purple-600'
    },
    {
      id: AppModule.POMODORO,
      label: '番茄时钟',
      icon: ClockIcon,
      color: 'text-orange-600'
    }
  ];

  const sidebarClasses = `
    ${isMobile ? `
      fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ` : `
      hidden md:flex md:flex-col md:w-64 md:flex-shrink-0
    `}
    bg-white/90 backdrop-blur-md border-r-2 border-black shadow-xl
  `;

  const handleNavClick = (module: AppModule) => {
    onModuleChange(module);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={sidebarClasses}>
        {/* Logo Area */}
        <div className="p-6 border-b-2 border-black bg-white/80">
          <h1 className="text-2xl font-black text-gray-800 tracking-tighter text-center">
            <span className="text-primary">o</span>
            <span className="text-secondary">R</span>
            <span className="text-accent">A</span>
            <span className="text-highlight">I</span>
            <span className="text-fresh">N</span>
            <span className="text-fun-blue">ginal</span>
          </h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center px-4 py-3 rounded-2xl font-medium
                  transform transition-all duration-200 hover:scale-105
                  border-2 ${isActive
                    ? 'bg-gray-100 border-black shadow-dopamine'
                    : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${isActive ? item.color : 'text-gray-600'}`} />
                <span className={`ml-3 ${isActive ? 'text-gray-900 font-black' : 'text-gray-700'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer spacing only; user/logout removed for pure entry */}
        <div className="p-4 border-t-2 border-black bg-white/80"></div>
      </div>
    </>
  );
};

export default AppNavigation;
