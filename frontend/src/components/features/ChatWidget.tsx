'use client';

import { useState, useRef, useEffect, JSX } from 'react';
import { chatService } from '@/services/main/chat.service';
import { ChatMessage } from '@/types/main/chat';
import { MessageCircle, X, Send, Loader } from 'lucide-react';

// Markdown Parser Component
function MarkdownMessage({ content }: { content: string }) {
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Headers (### Title)
      if (line.match(/^###\s+(.+)/)) {
        const match = line.match(/^###\s+(.+)/);
        elements.push(
          <h3 key={key++} className="text-base font-bold text-gray-800 mt-3 mb-1.5">
            {match![1]}
          </h3>
        );
        continue;
      }

      // Images ![alt](url)
      if (line.match(/^!\[([^\]]*)\]\(([^)]+)\)/)) {
        const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
        let imageUrl = match![2];
        
        // Fix localhost URL
        if (imageUrl.includes('localhost:7527')) {
          imageUrl = imageUrl.replace('https://localhost:7527', 'http://localhost:7527');
        }
        
        elements.push(
          <img
            key={key++}
            src={imageUrl}
            alt={match![1]}
            className="w-full h-32 object-cover rounded-lg my-2 shadow-sm"
            onError={(e) => {
              console.error('Image failed to load:', imageUrl);
              e.currentTarget.src = '/images/default-property.jpg';
            }}
          />
        );
        continue;
      }

      // Links [text](url) - Check FIRST before bold text
      if (line.includes('[') && line.includes('](')) {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let lastIndex = 0;
        let match;
        const parts: (string | JSX.Element)[] = [];

        while ((match = linkRegex.exec(line)) !== null) {
          // Add text before link
          if (match.index > lastIndex) {
            parts.push(line.substring(lastIndex, match.index));
          }

          const linkText = match[1];
          const linkUrl = match[2];

          // Check if it's a property link
          if (linkUrl.includes('/properties/')) {
            parts.push(
              <a
                key={key++}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-4 py-2 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center gap-1.5 my-1.5">
                  <span>{linkText}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </a>
            );
          } else {
            // Regular link
            parts.push(
              <a
                key={key++}
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 underline text-sm"
              >
                {linkText}
              </a>
            );
          }

          lastIndex = linkRegex.lastIndex;
        }

        // Add remaining text after last link
        if (lastIndex < line.length) {
          parts.push(line.substring(lastIndex));
        }

        if (parts.length > 0) {
          elements.push(
            <p key={key++} className="text-sm text-gray-700 leading-relaxed">
              {parts}
            </p>
          );
          continue;
        }
      }

      // Bold text (**text**)
      if (line.match(/\*\*(.+?)\*\*/)) {
        const parts = line.split(/(\*\*.+?\*\*)/g);
        elements.push(
          <p key={key++} className="text-sm text-gray-700">
            {parts.map((part, idx) => {
              if (part.match(/^\*\*(.+)\*\*$/)) {
                const text = part.replace(/\*\*/g, '');
                return <strong key={idx} className="font-semibold text-gray-900">{text}</strong>;
              }
              return <span key={idx}>{part}</span>;
            })}
          </p>
        );
        continue;
      }

      // Empty line
      if (line.trim() === '' || line === '---') {
        elements.push(<div key={key++} className="h-1" />);
        continue;
      }

      // Regular text with emoji icons
      if (line.trim()) {
        elements.push(
          <p key={key++} className="text-sm text-gray-700 leading-relaxed">
            {line}
          </p>
        );
      }
    }

    return elements;
  };

  return <div className="space-y-0.5">{parseMarkdown(content)}</div>;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Xin chào! 👋 Tôi là Qui, trợ lý tư vấn đặt phòng của QBooking. Tôi có thể giúp bạn tìm khách sạn, resort hoặc homestay phù hợp nhất. Bạn muốn tìm gì?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(input);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.success 
          ? response.data?.answer || 'Xin lỗi, tôi không thể trả lời lúc này.'
          : response.error || 'Có lỗi xảy ra, vui lòng thử lại.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:absolute sm:inset-auto sm:bottom-20 sm:right-0 bg-white sm:rounded-2xl shadow-2xl flex flex-col sm:w-96 sm:h-[600px] h-full w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-3.5 sm:rounded-t-2xl flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">Qui - QBooking Chat</h3>
                <p className="text-xs text-purple-100">Trực tuyến</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-3 space-y-3 min-h-0">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3.5 py-2.5 rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 shadow-sm px-3.5 py-2.5 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  ) : (
                    <MarkdownMessage content={msg.content} />
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-2 shadow-sm">
                  <Loader size={16} className="animate-spin text-purple-500" />
                  <span className="text-sm">Đang tìm kiếm...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-3 sm:rounded-b-2xl flex-shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={isLoading}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full p-2.5 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 flex-shrink-0"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-400 hover:bg-gray-500'
            : 'bg-gradient-to-r from-purple-600 to-pink-500 hover:shadow-2xl hover:scale-110 text-white'
        }`}
      >
        {isOpen ? (
          <X size={24} className="sm:w-[26px] sm:h-[26px]" />
        ) : (
          <MessageCircle size={24} className="sm:w-[26px] sm:h-[26px]" />
        )}
      </button>
    </div>
  );
}