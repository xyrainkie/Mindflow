import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

const ai = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

export type AIActionType = 'summarize' | 'polish' | 'expand' | 'action_items' | 'extract';

interface FileData {
  mimeType: string;
  data: string;
}

export const generateAIContent = async (
  text: string,
  action: AIActionType,
  fileData?: FileData
): Promise<string> => {

  if (action !== 'extract' && (!text || text.trim().length === 0)) {
    throw new Error("内容为空");
  }

  let prompt = "";

  switch (action) {
    case 'summarize':
      prompt = `请简洁地总结以下文本，抓住要点。语言：中文。\n\n文本：\n${text}`;
      break;
    case 'polish':
      prompt = `请润色以下文本，使其更专业、清晰且语法正确。保持中文。\n\n文本：\n${text}`;
      break;
    case 'expand':
      prompt = `请扩展以下想法，增加更多深度、背景和相关思考。保持洞察性语调。语言：中文。\n\n文本：\n${text}`;
      break;
    case 'action_items':
      prompt = `从以下文本中提取行动项清单或关键要点。格式化为markdown列表。语言：中文。\n\n文本：\n${text}`;
      break;
    case 'extract':
      prompt = `请分析这张图片或文件中的内容。
      1. 首先，识别并提取文件中的主要文字信息。
      2. 然后，基于提取的内容，整理出一份核心要点摘要。
      3. 如果有需要执行的待办事项，也请列出来。

      请使用清晰的 Markdown 格式返回结果（例如使用标题、项目符号等）。语言：中文。`;
      break;
  }

  try {
    let contents: any;

    if (fileData) {
      contents = {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: fileData.mimeType,
              data: fileData.data,
            },
          },
        ],
      };
    } else {
      contents = prompt;
    }

    if (!ai) throw new Error('AI服务未配置');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: contents,
    });

    return response.text || "无法生成内容，请重试。";
  } catch (error) {
    console.error("Gemini API错误:", error);
    throw new Error("AI处理失败，请检查网络或稍后重试。");
  }
};

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

const ALLOWED_GEMINI_MODELS = ['gemini-2.0-flash-exp', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-pro'];

export const chatWithModel = async (
  provider: 'gemini' | 'custom',
  model: string,
  messages: ChatMessage[],
  customToken?: string
): Promise<string> => {
  const totalLen = messages.reduce((sum, m) => sum + m.content.length, 0);
  if (totalLen > 16000) throw new Error('输入过长');

  if (provider === 'gemini') {
    if (!ai) throw new Error('Gemini未配置');
    if (!ALLOWED_GEMINI_MODELS.includes(model)) throw new Error('模型未在允许列表');

    const joined = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const response = await ai.models.generateContent({
      model,
      contents: joined,
    });
    return response.text || '';
  }

  if (provider === 'custom') {
    const token = customToken || env.CUSTOM_AI_TOKEN;
    if (!env.CUSTOM_AI_BASE_URL || !token) throw new Error('自定义AI未配置');
    if (!env.CUSTOM_AI_MODELS.includes(model)) throw new Error('模型未在允许列表');

    const base = env.CUSTOM_AI_BASE_URL.replace(/\/$/, '');
    const urlResponses = `${base}/responses`;
    const urlCompletions = `${base}/chat/completions`;
    const joinedInput = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const res = await fetch(urlResponses, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        input: joinedInput,
        temperature: 0.7,
        max_tokens: 1024,
        max_output_tokens: 1024,
        stream: false,
      }),
    });
    let text = '';
    if (res.ok) {
      const data: any = await res.json().catch(() => ({}));
      const msgContent = data?.choices?.[0]?.message?.content;
      const msgDelta = data?.choices?.[0]?.delta?.content;
      const toText = (val: any) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (Array.isArray(val)) return val.map((p: any) => (typeof p === 'string' ? p : (p?.text || p?.content || ''))).filter(Boolean).join('\n');
        if (typeof val === 'object') return val.text || val.content || '';
        return '';
      };
      const contentArray = Array.isArray(data?.content) ? data.content : [];
      const mergedArray = contentArray.map((p: any) => toText(p)).filter(Boolean);
      const candidates = [
        toText(msgContent),
        toText(msgDelta),
        data?.choices?.[0]?.text,
        data?.output_text,
        data?.output,
        data?.result,
        data?.text,
        mergedArray.join('\n')
      ];
      text = candidates.find((v: any) => typeof v === 'string' && v.trim().length > 0) || '';
    }

    if (!text) {
      const res2 = await fetch(urlCompletions, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ model, messages }),
      });
      if (!res2.ok) {
        const err2 = await res2.text().catch(() => '');
        throw new Error(err2 || '上游模型接口错误');
      }
      const data2: any = await res2.json().catch(() => ({}));
      text = data2?.choices?.[0]?.message?.content || data2?.output_text || data2?.text || '';
    }
    if (!text) throw new Error('模型未返回内容');
    return text;
  }

  throw new Error('不支持的提供商');
};
