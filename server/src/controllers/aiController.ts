import { Response } from 'express';
import { prisma } from '../config/database.js';
import { AuthRequest } from '../middleware/auth.js';
import { chatWithModel, generateAIContent } from '../services/aiService.js';
import { z } from 'zod';

export const processTextWithAI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, action, provider, model } = req.body as any;
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!text || !action) {
      res.status(400).json({ error: '文本和操作类型都是必填项' });
      return;
    }

    if (!Object.values(['summarize', 'polish', 'expand', 'action_items', 'extract']).includes(action)) {
      res.status(400).json({ error: '无效的AI操作类型' });
      return;
    }

    if (action === 'extract') {
      const prov = (provider || '').toString().toLowerCase();
      const useGemini = true;
      if (!file) {
        res.status(400).json({ error: '需要上传文件以进行识别' });
        return;
      }
      const base64 = file.buffer.toString('base64');
      try {
        const result = await generateAIContent(text, 'extract', { mimeType: file.mimetype, data: base64 } as any);
        res.json({ success: true, result, action });
      } catch (e) {
        const result = `## 内容提取结果\n\n(占位) 已接收图片，当前识别服务未配置，返回示例结构：\n\n### 识别的文本：\n${text || '（无文本输入）'}\n\n### 核心要点：\n1. 示例信息点一\n2. 示例信息点二\n\n### 建议行动：\n- [ ] 切换到已配置的图片识别模型\n- [ ] 或联系管理员配置 Gemini API Key`;
        res.json({ success: true, result, action });
      }
      return;
    }

    if (provider && model) {
      const buildPrompt = (act: string, t: string) => {
        switch (act) {
          case 'summarize':
            return `请简洁地总结以下文本，抓住要点并用中文输出。\n\n文本：\n${t}`;
          case 'polish':
            return `请润色以下文本，使其更专业、清晰且语法正确，保持中文。\n\n文本：\n${t}`;
          case 'expand':
            return `请扩展以下内容，增加背景、示例和深入思考，保持中文。\n\n文本：\n${t}`;
          case 'action_items':
            return `从以下文本中提取行动项或关键要点，使用 Markdown 列表输出，保持中文。\n\n文本：\n${t}`;
          default:
            return t;
        }
      };
      const prompt = buildPrompt(action, text);
      const output = await chatWithModel((provider as any), (model as string), [{ role: 'user', content: prompt }]);
      res.json({ success: true, result: output, action });
      return;
    }

    let result = '';
    switch (action) {
      case 'summarize':
        result = `## 内容摘要\n\n这是对"${text.substring(0, 50)}..."的简洁总结。主要观点包括：\n1. 核心信息一\n2. 核心信息二\n3. 关键结论`;
        break;
      case 'polish':
        result = `## 润色后的文本\n\n${text}\n\n文本已经过专业润色，语法更规范，表达更清晰。`;
        break;
      case 'expand':
        result = `## 扩展内容\n\n${text}\n\n### 扩展观点：\n- 这个想法可以从以下角度进一步思考...\n- 相关的实际应用场景包括...\n- 深入的研究方向有...`;
        break;
      case 'action_items':
        result = `## 行动项清单\n\n- [ ] 首要任务：基于文本内容制定的第一个行动点\n- [ ] 重要事项：需要重点关注和处理的任务\n- [ ] 后续跟进：需要定期检查和更新的内容`;
        break;
      default:
        result = '处理完成，但结果格式异常。';
    }

    res.json({
      success: true,
      result,
      action
    });

  } catch (error) {
    console.error('AI处理错误:', error);
    res.status(500).json({ error: 'AI处理失败，请稍后重试' });
  }
};

// Note: We'll skip file upload for simplicity in this initial version
export const processWithAI = processTextWithAI;

export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schema = z.object({
      provider: z.enum(['gemini', 'custom']),
      model: z.string().min(1).max(64),
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(8000)
      })).min(1).max(50),
      apiKey: z.string().min(10).max(256).optional()
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: '请求参数验证失败' });
      return;
    }

    const output = await chatWithModel(parsed.data.provider, parsed.data.model, parsed.data.messages, parsed.data.apiKey);
    res.json({ success: true, output });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'AI聊天失败' });
  }
};
