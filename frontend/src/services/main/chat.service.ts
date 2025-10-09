import { ChatRequest, ChatApiResponse } from '@/types/main/chat';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

class ChatService {
  async sendMessage(question: string): Promise<ChatApiResponse> {
    try {
      const payload: ChatRequest = {
        question
      };

      const response = await fetch(`${API_BASE_URL}/Chatbot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Có lỗi xảy ra'
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          answer: data.answer || ''
        }
      };
    } catch (error) {
      console.error('Chat service error:', error);
      return {
        success: false,
        error: 'Không thể kết nối tới chatbot'
      };
    }
  }
}

export const chatService = new ChatService();