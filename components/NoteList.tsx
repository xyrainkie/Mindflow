import React from 'react';
import { Note, Category } from '../types';
import { CATEGORY_BADGES, CATEGORY_LABELS } from '../constants';
import { SearchIcon } from './Icons';

interface NoteListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  category: Category;
  onCreateNote?: () => void;
}

const NoteList: React.FC<NoteListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  searchQuery,
  onSearchChange,
  category,
  onCreateNote,
}) => {
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const getPreview = (content: string) => {
    if (!content) return "无内容...";
    const plainText = stripHtml(content);
    return plainText.length > 60 ? plainText.substring(0, 60) + "..." : plainText;
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur border-r-2 border-black w-full md:w-80 lg:w-96 flex-shrink-0">
      <div className="p-4 border-b-2 border-black bg-white">
        <h2 className="text-xl font-black text-black mb-4 tracking-tight flex items-center gap-2">
          <span className="text-2xl">📂</span> {CATEGORY_LABELS[category]}
        </h2>
        <div className="relative group">
          <input
            type="text"
            placeholder="搜索灵感..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-black focus:shadow-dopamine-sm transition-all placeholder-gray-400 text-gray-800"
          />
          <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5 group-focus-within:text-fun-pink transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {notes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-60 text-gray-400 cursor-pointer hover:text-gray-500"
            onClick={() => { if (onCreateNote) onCreateNote(); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' && onCreateNote) onCreateNote(); }}
          >
            <span className="text-4xl mb-2">🌵</span>
            <p className="font-medium mb-3">这里空空如也</p>
            {onCreateNote && (
              <button onClick={onCreateNote} className="px-4 py-2 text-sm font-bold bg-black text-white rounded-lg border-2 border-black">
                立即创建一条笔记
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-2">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`
                  p-4 cursor-pointer rounded-xl border-2 transition-all dopamine-trans
                  ${selectedNoteId === note.id 
                    ? 'bg-white border-black shadow-dopamine translate-x-[-2px] translate-y-[-2px] z-10' 
                    : 'bg-white border-gray-200 hover:border-black hover:shadow-dopamine-sm hover:translate-y-[-2px]'}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-base truncate pr-2 ${selectedNoteId === note.id ? 'text-black' : 'text-gray-700'}`}>
                    {note.title || "✨ 未命名灵感"}
                  </h3>
                </div>
                
                <p className="text-xs text-gray-500 line-clamp-2 mb-3 h-8 font-medium leading-relaxed">
                  {getPreview(note.content)}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border border-black/10 ${CATEGORY_BADGES[note.category]}`}>
                    {CATEGORY_LABELS[note.category]}
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {formatDate(note.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;