import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiService } from '../services/apiService';

type Role = 'user' | 'assistant' | 'system';

interface ChatMessage {
  role: Role;
  content: string;
}

const MODEL_OPTIONS = [
  { value: 'deepseek/deepseek-v3.1', label: 'DeepSeek: DeepSeek V3.1' },
  { value: 'openai/gpt-5', label: 'OpenAI: GPT-5' },
  { value: 'google/gemini-2.5-pro', label: 'Google: Gemini 2.5 Pro' },
];

interface Props { onBack?: () => void }
const AiChat: React.FC<Props> = ({ onBack }) => {
  const [model, setModel] = useState<string>(MODEL_OPTIONS[2].value);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('custom_ai_token') || '');
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const modelValid = useMemo(() => model.trim().length > 0, [model]);
  const canSend = useMemo(() => input.trim().length > 0 && !sending && modelValid, [input, sending, modelValid]);

  const normalizeModel = (v: string) => {
    const m = v.trim().toLowerCase();
    if (m === 'openai/gpt-5' || m === 'gpt-5') return 'openai/gpt-4.1';
    if (m.startsWith('deepseek/deepseek-v3')) return 'deepseek/deepseek-chat';
    if (m.includes('gemini') && m.includes('2.5') && m.includes('pro')) return 'google/gemini-2.5-pro';
    if (m === 'gemini-2.5-pro') return 'gemini-2.5-pro';
    return v;
  };

  const deriveProvider = (v: string): 'gemini' | 'custom' => {
    if (v.startsWith('gemini-')) return 'gemini';
    return 'custom';
  };

  const send = async () => {
    if (!canSend) return;
    setError(null);
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg].slice(-20);
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const modelNormalized = normalizeModel(model);
      const provider = deriveProvider(modelNormalized);
      if (modelNormalized !== model) {
        setModel(modelNormalized);
        setError('所选模型已替换为可用的近似版本');
      }
      const res = await apiService.chatWithAI({ provider, model: modelNormalized, messages: next, apiKey: apiKey || undefined });
      const output = (res.output || '').trim();
      if (!output) {
        setError('模型未返回内容');
      } else {
        const assistantMsg: ChatMessage = { role: 'assistant', content: output };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (e: any) {
      setError(e?.message || '请求失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white/80">
      <div className="flex-1 flex flex-col">
        <div className="border-b-2 border-black p-4 bg-white flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="px-3 py-2 border-2 border-black rounded-lg bg-white">返回</button>
          )}
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="text-sm px-3 py-2 border-2 border-black rounded-lg"
          >
            {MODEL_OPTIONS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="输入API Key"
            className="text-sm px-3 py-2 border-2 border-black rounded-lg w-64"
          />
          <button
            onClick={() => { localStorage.setItem('custom_ai_token', apiKey); setError(null); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
            className="px-3 py-2 border-2 border-black rounded-lg bg-black text-white"
          >保存</button>
          {saved && (
            <span className="text-xs font-bold text-green-600 bg-green-50 border-2 border-green-200 rounded-lg px-2 py-1">已保存</span>
          )}

          {!modelValid && (
            <div className="text-xs text-red-600 font-bold">请选择模型</div>
          )}

          {error && (
            <div className="ml-auto text-red-600 text-sm font-bold bg-red-50 border-2 border-red-200 rounded-lg px-3 py-1">
              {error}
            </div>
          )}
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">💬</div>
                <div className="font-bold">开始你的对话</div>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div key={idx} className={`max-w-3xl ${m.role === 'user' ? 'ml-auto' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl border-2 ${m.role === 'user' ? 'bg-fun-yellow border-black' : 'bg-white border-black'}`}>
                  <div className="text-xs font-bold mb-1 text-gray-500">{m.role === 'user' ? '你' : m.role === 'assistant' ? 'AI' : '系统'}</div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="max-w-3xl">
              <div className="px-4 py-3 rounded-2xl border-2 bg-white border-black flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm">思考中...</div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t-2 border-black p-4 bg-white flex items-center gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="请输入内容..."
            className="flex-1 px-4 py-3 border-2 border-black rounded-xl"
          />
          <button
            onClick={send}
            disabled={!canSend}
            className="px-6 py-3 font-bold rounded-xl border-2 border-black text-white bg-black disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;
