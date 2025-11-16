
import { GoogleGenAI, Chat } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This chat instance is stateful and maintains conversation history for the session.
// For a stateless approach (e.g., managing history client-side), you might create
// a new chat session for each request or pass the history manually.
const chat: Chat = ai.chats.create({
  model: 'gemini-2.5-flash',
  config: {
    systemInstruction: '당신은 친절하고 도움이 되는 어시스턴트입니다. 정보에 입각하여 간결하게 답변해주세요. 필요한 경우, 마크다운을 사용하여 텍스트 서식을 지정할 수 있습니다 (예: **굵게**, *기울임꼴*, `코드`).',
  },
});

export const streamChat = async (message: string) => {
  try {
    const result = await chat.sendMessageStream({ message });
    return result;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
        throw new Error("잘못된 API 키입니다. 설정을 확인해주세요.");
    }
    throw new Error("봇으로부터 응답을 받지 못했습니다. 다시 시도해주세요.");
  }
};
