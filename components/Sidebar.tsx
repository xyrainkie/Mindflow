import React from 'react';
import { Category } from '../types';
import { CATEGORY_LABELS, CATEGORY_BADGES } from '../constants';
import { LayoutGridIcon, BriefcaseIcon, BookOpenIcon, CoffeeIcon, StickyNoteIcon, PlusIcon } from './Icons';

interface SidebarProps {
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  onNewNote: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  selectedCategory, 
  onSelectCategory, 
  onNewNote,
  isOpen,
  onCloseMobile
}) => {
  
  const getIcon = (cat: Category) => {
    switch (cat) {
      case Category.ALL: return <LayoutGridIcon className="w-5 h-5" />;
      case Category.WORK: return <BriefcaseIcon className="w-5 h-5" />;
      case Category.KNOWLEDGE: return <BookOpenIcon className="w-5 h-5" />;
      case Category.LIFE: return <CoffeeIcon className="w-5 h-5" />;
      case Category.MEMO: return <StickyNoteIcon className="w-5 h-5" />;
      default: return <LayoutGridIcon className="w-5 h-5" />;
    }
  };

  const categories = [
    Category.ALL,
    Category.WORK,
    Category.KNOWLEDGE,
    Category.LIFE,
    Category.MEMO
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-md border-r-2 border-black transform transition-transform duration-300 ease-in-out
    md:translate-x-0 md:static md:inset-auto md:w-64 md:flex-shrink-0 shadow-xl
    ${isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm z-30 md:hidden"
          onClick={onCloseMobile}
        ></div>
      )}

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          {/* Logo Area */}
          <div className="p-6 border-b-2 border-black bg-yellow-50">
            <div className="flex items-center justify-center">
               <h1 className="text-3xl font-black tracking-tighter font-sans select-none hover:scale-105 transition-transform duration-300">
                <span className="text-primary">o</span>
                <span className="text-secondary">R</span>
                <span className="text-accent">A</span>
                <span className="text-highlight">I</span>
                <span className="text-fresh">N</span>
                <span className="text-fun-blue">ginal</span>
              </h1>
            </div>
          </div>

          <div className="p-4 space-y-6">
            <button
              onClick={() => {
                onNewNote();
                if(window.innerWidth < 768) onCloseMobile();
              }}
              className="w-full bg-black text-white font-bold py-3 px-4 rounded-xl shadow-dopamine hover:shadow-dopamine-hover hover:translate-y-[-2px] hover:bg-gray-900 transition-all flex items-center justify-center gap-2 border-2 border-black group"
            >
              <div className="bg-fun-pink rounded-full p-1 group-hover:rotate-90 transition-transform">
                <PlusIcon className="w-5 h-5 text-white" />
              </div>
              新建笔记
            </button>

            <nav className="space-y-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    onSelectCategory(cat);
                    if(window.innerWidth < 768) onCloseMobile();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 font-bold rounded-xl transition-all border-2
                    ${selectedCategory === cat 
                      ? 'bg-fun-yellow border-black text-black shadow-dopamine-sm translate-x-[-2px] translate-y-[-2px]' 
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-black hover:border-gray-200'}
                  `}
                >
                  <span className={`
                    p-1.5 rounded-lg border-2 border-black
                    ${selectedCategory === cat ? 'bg-white text-black' : CATEGORY_BADGES[cat]}
                  `}>
                    {getIcon(cat)}
                  </span>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto p-4 border-t-2 border-black bg-fun-blue/10">
            <div className="text-xs font-bold text-fun-blue text-center">
              Made for You ✨
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;