import React, { useState, useEffect, useCallback, useRef } from 'react';
import Quill from 'quill';
import 'emoji-picker-element';
import { Note, Category, AIActionType, AIState } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_BADGES } from '../constants';
import { generateAIContent } from '../services/geminiService';
import { apiService } from '../services/apiService';
import { 
  SaveIcon, TrashIcon, SparklesIcon, ChevronLeftIcon, UploadIcon,
  BoldIcon, ItalicIcon, UnderlineIcon, ListIcon, AlignCenterIcon, EmojiIcon,
  LinkIcon, VideoIcon, ImageIcon
} from './Icons';

// Register fonts in Quill
const Font = Quill.import('formats/font') as any;
(Font as any).whitelist = ['inter', 'mashanzheng', 'longcang', 'zhimangxing', 'patrickhand'];
(Quill as any).register(Font, true);

interface NoteEditorProps {
  note: Note;
  onUpdate: (updatedNote: Note) => void;
  onDelete: (noteId: string) => void;
  onBack: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onUpdate, onDelete, onBack }) => {
  const [title, setTitle] = useState(note.title);
  const [category, setCategory] = useState(note.category);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Quill Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);
  const emojiPickerRef = useRef<any>(null);

  const [aiState, setAiState] = useState<AIState>({
    isLoading: false,
    result: null,
    error: null,
    actionType: null,
  });
  const [model, setModel] = useState<string>(() => localStorage.getItem('custom_ai_model') || 'google/gemini-2.5-pro');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('custom_ai_token') || '');
  const [saved, setSaved] = useState<boolean>(false);

  const normalizeModel = (v: string) => {
    const m = v.trim().toLowerCase();
    if (m === 'openai/gpt-5' || m === 'gpt-5') return 'openai/gpt-4.1';
    if (m.startsWith('deepseek/deepseek-v3')) return 'deepseek/deepseek-chat';
    if (m.includes('gemini') && m.includes('2.5') && m.includes('pro')) return 'google/gemini-2.5-pro';
    if (m === 'gemini-2.5-pro') return 'google/gemini-2.5-pro';
    return v;
  };
  const deriveProvider = (v: string): 'gemini' | 'custom' => {
    if (v.startsWith('gemini-') || v.startsWith('google/gemini')) return 'gemini';
    return 'custom';
  };
  const buildPrompt = (action: AIActionType, text: string) => {
    switch (action) {
      case 'summarize':
        return `请简洁地总结以下文本，抓住要点并用中文输出。\n\n文本：\n${text}`;
      case 'polish':
        return `请润色以下文本，使其更专业、清晰且语法正确，保持中文。\n\n文本：\n${text}`;
      case 'expand':
        return `请扩展以下内容，增加背景、示例和深入思考，保持中文。\n\n文本：\n${text}`;
      case 'action_items':
        return `从以下文本中提取行动项或关键要点，使用 Markdown 列表输出，保持中文。\n\n文本：\n${text}`;
      default:
        return text;
    }
  };
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('recent_emojis');
      if (raw) return JSON.parse(raw);
    } catch {}
    return ['😊','👍','🔥','🎉','✨','❤️','💡','📌'];
  });
  const presetEmojis: string[] = ['😀','😁','😂','🤣','😊','😍','😎','🤔','😴','🥳','👍','👎','🙏','✍️','💡','🔥','✨','🎉','❤️','💯'];

  // Initialize Quill
  useEffect(() => {
    if (editorRef.current && !quillInstanceRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: '#custom-toolbar',
        },
        placeholder: '写下你的奇思妙想...',
      });
      
      quillInstanceRef.current = quill;
      quill.root.innerHTML = note.content;
    }
  }, []);

  // Sync content when note prop changes
  useEffect(() => {
    setTitle(note.title);
    setCategory(note.category);
    setAiState({ isLoading: false, result: null, error: null, actionType: null });
    
    if (quillInstanceRef.current && quillInstanceRef.current.root.innerHTML !== note.content) {
      quillInstanceRef.current.root.innerHTML = note.content;
    }
  }, [note.id]);

  // Handle Emoji Selection
  useEffect(() => {
    const picker = emojiPickerRef.current;
    if (picker) {
      const handleEmoji = (event: any) => {
        if (quillInstanceRef.current) {
          const range = quillInstanceRef.current.getSelection(true);
          quillInstanceRef.current.insertText(range.index, event.detail.unicode);
          quillInstanceRef.current.setSelection(range.index + event.detail.unicode.length);
          setShowEmojiPicker(false);
          quillInstanceRef.current.focus();
          const emoji = event.detail.unicode as string;
          setRecentEmojis(prev => {
            const arr = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 8);
            try { localStorage.setItem('recent_emojis', JSON.stringify(arr)); } catch {}
            return arr;
          });
        }
      };
      picker.addEventListener('emoji-click', handleEmoji);
      return () => picker.removeEventListener('emoji-click', handleEmoji);
    }
  }, [showEmojiPicker]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        if (quillInstanceRef.current) quillInstanceRef.current.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showEmojiPicker]);

  const handleSave = useCallback(() => {
    if (!quillInstanceRef.current) return;
    
    setIsSaving(true);
    const htmlContent = quillInstanceRef.current.root.innerHTML;
    
    onUpdate({
      ...note,
      title,
      content: htmlContent,
      category,
      updatedAt: Date.now(),
    });
    setTimeout(() => setIsSaving(false), 500);
  }, [note, title, category, onUpdate]);

  const handleAIAction = async (action: AIActionType, file?: File) => {
    if (!quillInstanceRef.current) return;
    const plainText = quillInstanceRef.current.getText();
    if (action !== 'extract' && (!plainText || plainText.trim().length === 0)) return;

    setAiState({ isLoading: true, result: null, error: null, actionType: action });

    try {
      if (action === 'extract') {
        const result = await generateAIContent(plainText, action, file);
        setAiState({ isLoading: false, result, error: null, actionType: action });
        return;
      }
      const modelNormalized = normalizeModel(model);
      const provider = deriveProvider(modelNormalized);
      const prompt = buildPrompt(action, plainText);
      const res = await apiService.chatWithAI({ provider, model: modelNormalized, messages: [{ role: 'user', content: prompt }], apiKey: apiKey || undefined });
      const output = (res.output || '').trim();
      if (!output) {
        setAiState({ isLoading: false, result: null, error: '模型未返回内容', actionType: action });
      } else {
        setAiState({ isLoading: false, result: output, error: null, actionType: action });
      }
    } catch (err: any) {
      setAiState({ isLoading: false, result: null, error: err?.message || 'AI Error', actionType: action });
    }
  };

  const readFileAsBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve({ mimeType: file.type, data: base64Data });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("目前仅支持图片文件 (JPG, PNG, WEBP)");
        return;
      }
      handleAIAction('extract', file);
    }
    if (event.target) event.target.value = '';
  };

  const applyAIResult = () => {
    if (aiState.result && quillInstanceRef.current) {
      const quill = quillInstanceRef.current;
      quill.focus();

      if (aiState.actionType === 'polish') {
        if (confirm("是否用润色后的文本替换当前全部内容？取消则追加到末尾。")) {
            quill.setText(aiState.result);
        } else {
            const range = quill.getSelection(true);
            quill.insertText(range.index, "\n" + aiState.result);
        }
      } else {
        const range = quill.getSelection(true);
        const textToInsert = aiState.actionType === 'extract' 
          ? `\n\n📝 文件提取内容:\n${aiState.result}\n----------------------\n`
          : `\n\n💡 AI 生成内容:\n${aiState.result}\n`;
        quill.insertText(range.index, textToInsert);
      }
      setAiState(prev => ({ ...prev, result: null, actionType: null }));
    }
  };

  const discardAIResult = () => {
    setAiState(prev => ({ ...prev, result: null, actionType: null }));
  };

  const insertEmojiDirect = (emoji: string) => {
    if (!quillInstanceRef.current) return;
    const quill = quillInstanceRef.current;
    const current = quill.getSelection(true) || { index: quill.getLength(), length: 0 } as any;
    quill.insertText(current.index, emoji);
    quill.setSelection(current.index + emoji.length);
    setShowEmojiPicker(false);
    quill.focus();
    setRecentEmojis(prev => {
      const arr = [emoji, ...prev.filter(e => e !== emoji)].slice(0, 8);
      try { localStorage.setItem('recent_emojis', JSON.stringify(arr)); } catch {}
      return arr;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#FFF0F5] relative bg-opacity-50">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        className="hidden" 
        accept="image/*"
      />

      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black bg-white z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="md:hidden p-2 -ml-2 text-black hover:text-fun-pink">
             <ChevronLeftIcon />
           </button>
           <div className="relative">
             <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={`text-xs font-bold px-4 py-2 rounded-lg border-2 border-black cursor-pointer appearance-none shadow-dopamine-sm focus:shadow-dopamine focus:translate-y-[-2px] transition-all outline-none ${CATEGORY_BADGES[category]}`}
              style={{ backgroundImage: 'none' }} 
            >
              {Object.values(Category).filter(c => c !== Category.ALL).map(c => (
                <option key={c} value={c} className="bg-white text-black font-sans">
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
           </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => { if(confirm('确定删除吗？')) onDelete(note.id); }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <TrashIcon />
          </button>
          <button
            onClick={handleSave}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold border-2 border-black transition-all
              ${isSaving 
                ? 'bg-fun-green text-white shadow-none translate-y-0' 
                : 'bg-black text-white shadow-dopamine hover:shadow-dopamine-hover hover:translate-y-[-2px] hover:bg-gray-900'}
            `}
          >
            <SaveIcon className="w-4 h-4" />
            {isSaving ? '已保存' : '保存'}
          </button>
        </div>
      </div>

      {/* Rich Text Toolbar (Custom) */}
      <div id="custom-toolbar" className="flex flex-wrap items-center gap-2 px-4 py-3 bg-white border-b-2 border-black text-gray-700 sticky top-[74px] z-10 shadow-sm">
        
        {/* Fonts */}
        <select className="ql-font w-28 h-9 text-sm border-2 border-gray-200 rounded-lg px-1 focus:outline-none focus:border-black font-medium">
          <option value="inter" selected>标准字体</option>
          <option value="mashanzheng">马善政毛笔</option>
          <option value="longcang">龙藏草书</option>
          <option value="zhimangxing">志莽行书</option>
          <option value="patrickhand">手写英文</option>
        </select>

        {/* Size */}
        <select className="ql-size w-20 h-9 text-sm border-2 border-gray-200 rounded-lg px-1 focus:outline-none focus:border-black font-medium">
          <option value="small">小号</option>
          <option selected>正文</option>
          <option value="large">标题</option>
          <option value="huge">大标题</option>
        </select>

        <div className="w-0.5 h-6 bg-gray-200 mx-1"></div>

        <button className="ql-bold p-1.5 hover:bg-fun-yellow hover:text-black rounded-lg transition-colors" title="加粗"><BoldIcon /></button>
        <button className="ql-italic p-1.5 hover:bg-fun-pink hover:text-white rounded-lg transition-colors" title="斜体"><ItalicIcon /></button>
        <button className="ql-underline p-1.5 hover:bg-fun-blue hover:text-white rounded-lg transition-colors" title="下划线"><UnderlineIcon /></button>
        
        <div className="w-0.5 h-6 bg-gray-200 mx-1"></div>

        <button className="ql-list p-1.5 hover:bg-gray-100 rounded-lg" value="ordered"><ListIcon /></button>
        <button className="ql-list p-1.5 hover:bg-gray-100 rounded-lg" value="bullet"><ListIcon className="transform rotate-180" /></button>
        <button className="ql-align p-1.5 hover:bg-gray-100 rounded-lg" value="center"><AlignCenterIcon /></button>

        <div className="w-0.5 h-6 bg-gray-200 mx-1"></div>

        {/* Media Buttons */}
        <button className="ql-link p-1.5 hover:bg-fun-purple hover:text-white rounded-lg transition-colors"><LinkIcon /></button>
        <button className="ql-image p-1.5 hover:bg-fun-green hover:text-white rounded-lg transition-colors"><ImageIcon /></button>
        <button className="ql-video p-1.5 hover:bg-red-500 hover:text-white rounded-lg transition-colors"><VideoIcon /></button>

        <div className="w-0.5 h-6 bg-gray-200 mx-1"></div>

        {/* Color Pickers */}
        <select className="ql-color p-1 w-8 h-8" title="文字颜色"></select>
        <select className="ql-background p-1 w-8 h-8" title="背景颜色"></select>

        <div className="w-0.5 h-6 bg-gray-200 mx-1"></div>
        
        {/* Emoji Trigger */}
        <button 
          className="p-1.5 hover:bg-yellow-100 text-yellow-500 rounded-lg relative transform hover:scale-110 transition-transform" 
          title="插入表情"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <EmojiIcon />
        </button>

        {(() => {
          const combined = Array.from(new Set([...recentEmojis, ...presetEmojis]));
          return (
            <div className="flex items-center gap-1 ml-2 overflow-x-auto max-w-[50vw]">
              {combined.map((e) => (
                <button
                  key={`emoji-${e}`}
                  onClick={() => insertEmojiDirect(e)}
                  className="px-2 py-1 text-sm border-2 border-black rounded-lg bg-white hover:bg-yellow-50"
                >{e}</button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute top-40 left-4 z-50 shadow-dopamine rounded-xl border-2 border-black overflow-hidden">
          {/* @ts-ignore */}
          <emoji-picker ref={emojiPickerRef}></emoji-picker>
          <div className="absolute top-2 right-2">
            <button
              onClick={() => { setShowEmojiPicker(false); if (quillInstanceRef.current) quillInstanceRef.current.focus(); }}
              className="px-2 py-1 text-xs border-2 border-black bg-white rounded-lg"
            >关闭</button>
          </div>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowEmojiPicker(false)}
          ></div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto w-full relative p-4 md:p-8">
        <div className="max-w-4xl mx-auto p-8 min-h-[calc(100vh-300px)] bg-[#FFFBEB] border-2 border-black shadow-dopamine rounded-xl relative">
           {/* Title Input outside Quill */}
           <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="无标题"
            className="w-full text-4xl md:text-5xl font-black text-black placeholder-gray-300 border-none focus:outline-none focus:ring-0 bg-transparent mb-8 font-hand1 leading-normal"
            style={{ fontFamily: '"Ma Shan Zheng", cursive' }}
          />
          {/* Quill Container */}
          <div ref={editorRef} className="h-full min-h-[500px]"></div>
        </div>
      </div>

      {/* AI Toolbar (Bottom) */}
      <div className="p-4 border-t-2 border-black bg-white z-20">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-black font-bold text-sm mr-2 bg-fun-yellow px-3 py-1 rounded-full border-2 border-black shadow-dopamine-sm">
            <SparklesIcon className="w-4 h-4" />
            <span className="hidden sm:inline">AI Magic</span>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="text-xs font-bold px-3 py-2 border-2 border-black rounded-lg bg-white"
          >
            <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="openai/gpt-4.1">GPT-4.1</option>
            <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
          </select>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="输入API Key"
            className="text-xs px-3 py-2 border-2 border-black rounded-lg w-52"
          />
          <button
            onClick={() => { localStorage.setItem('custom_ai_token', apiKey); localStorage.setItem('custom_ai_model', model); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className="px-3 py-2 text-xs font-bold bg-black text-white border-2 border-black rounded-lg"
          >保存</button>
          {saved && (
            <span className="text-xs font-bold text-green-600 bg-green-50 border-2 border-green-200 rounded-lg px-2 py-1">已保存</span>
          )}

          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={aiState.isLoading || deriveProvider(model) !== 'gemini'}
            title={deriveProvider(model) !== 'gemini' ? '当前模型不支持图片识别，请切换到 Gemini 2.5 Pro' : ''}
            className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-white border-2 border-black text-black rounded-lg shadow-dopamine-sm hover:shadow-dopamine hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
          >
            <UploadIcon className="w-4 h-4" />
            识别文件
          </button>

          <div className="w-0.5 h-6 bg-gray-200 mx-1"></div>

          <button onClick={() => handleAIAction('polish')} disabled={aiState.isLoading} className="px-4 py-2 text-xs font-bold bg-fun-pink text-white border-2 border-black rounded-lg shadow-dopamine-sm hover:shadow-dopamine hover:translate-y-[-2px] transition-all">
            润色
          </button>
          <button onClick={() => handleAIAction('summarize')} disabled={aiState.isLoading} className="px-4 py-2 text-xs font-bold bg-fun-blue text-white border-2 border-black rounded-lg shadow-dopamine-sm hover:shadow-dopamine hover:translate-y-[-2px] transition-all">
            摘要
          </button>
          <button onClick={() => handleAIAction('expand')} disabled={aiState.isLoading} className="px-4 py-2 text-xs font-bold bg-fun-purple text-white border-2 border-black rounded-lg shadow-dopamine-sm hover:shadow-dopamine hover:translate-y-[-2px] transition-all">
            发散
          </button>
          <button onClick={() => handleAIAction('action_items')} disabled={aiState.isLoading} className="px-4 py-2 text-xs font-bold bg-fun-green text-white border-2 border-black rounded-lg shadow-dopamine-sm hover:shadow-dopamine hover:translate-y-[-2px] transition-all">
            待办
          </button>
        </div>
        
        {/* AI Result Area */}
        {aiState.isLoading && (
          <div className="max-w-4xl mx-auto mt-4 p-4 bg-black text-white rounded-xl animate-pulse flex items-center gap-3 border-2 border-white shadow-xl absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold">
              {aiState.actionType === 'extract' ? 'AI 正在阅读图片...' : 'AI 正在头脑风暴...'}
            </span>
          </div>
        )}

        {aiState.result && (
          <div className="max-w-4xl mx-auto mt-4 p-0 bg-white border-2 border-black rounded-xl shadow-dopamine absolute bottom-24 left-4 right-4 md:left-20 md:right-20 z-50 overflow-hidden">
             <div className="flex justify-between items-center p-3 bg-fun-yellow border-b-2 border-black">
               <h4 className="text-sm font-black text-black flex items-center gap-2">
                 <span className="text-lg">💡</span> AI 灵感
               </h4>
               <div className="flex gap-2">
                 <button onClick={discardAIResult} className="text-xs font-bold text-black hover:bg-black/10 px-3 py-1 rounded-md transition-colors">放弃</button>
                 <button onClick={applyAIResult} className="text-xs font-bold bg-black text-white px-4 py-1 rounded-md hover:bg-gray-800 transition-colors shadow-sm">
                   插入笔记
                 </button>
               </div>
             </div>
             <div className="text-sm text-gray-800 p-4 max-h-60 overflow-y-auto leading-relaxed">
               {aiState.result}
             </div>
          </div>
        )}

        {aiState.error && (
           <div className="max-w-4xl mx-auto mt-4 p-3 bg-red-500 text-white text-sm font-bold rounded-lg border-2 border-black shadow-dopamine absolute bottom-24 left-1/2 transform -translate-x-1/2">
             {aiState.error}
           </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
