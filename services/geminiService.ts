import { AIActionType } from "../types";
import { apiService } from "./apiService";

export const generateAIContent = async (
  text: string,
  action: AIActionType,
  file?: File
): Promise<string> => {

  // For standard text actions, validate text presence
  if (action !== 'extract' && (!text || text.trim().length === 0)) {
    throw new Error("内容为空");
  }

  try {
    const payloadText = (action === 'extract' && (!text || text.trim().length === 0)) ? '图片或文件内容识别' : text;
    const localModel = (localStorage.getItem('custom_ai_model') || '').trim();
    const m = localModel.toLowerCase();
    let provider: 'gemini' | 'custom' = (m.startsWith('gemini-') || m.startsWith('google/gemini')) ? 'gemini' : 'custom';
    const response = await apiService.processTextWithAI(
      payloadText,
      action,
      file,
      provider,
      localModel || undefined
    );

    return response.result;
  } catch (error) {
    console.error("AI处理错误:", error);
    throw new Error(error instanceof Error ? error.message : "AI处理失败，请检查网络或稍后重试。");
  }
};
