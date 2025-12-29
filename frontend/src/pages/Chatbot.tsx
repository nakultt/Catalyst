/**
 * Chatbot Page - Sahayak AI
 * GraphRAG-powered chatbot with source citations
 */
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, Loader2, Sparkles } from 'lucide-react';
import { sendChatMessage, type ChatResponse } from '../lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
}

function formatMessageContent(content: string): React.ReactNode {
  // Parse and highlight source citations
  const parts = content.split(/(\[Source:.*?\])/g);
  return parts.map((part, index) => {
    if (part.match(/\[Source:.*?\]/)) {
      return (
        <span key={index} className="source-citation">
          <BookOpen className="w-3 h-3" />
          {part.replace('[Source: ', '').replace(']', '')}
        </span>
      );
    }
    return part;
  });
}

const EXAMPLE_QUESTIONS = [
  "Who invests in AgriTech in Tamil Nadu?",
  "What government schemes am I eligible for?",
  "What are the best hackathons for AI startups?",
  "How do I get DPIIT recognition?",
];

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm **Sahayak**, your AI-powered funding assistant. 🚀

I can help you with:
• Finding investors matching your profile
• Discovering government schemes and grants
• Identifying relevant hackathons and accelerators
• Understanding eligibility requirements

All my answers include **source citations** so you can verify the information. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response: ChatResponse = await sendChatMessage(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please make sure the backend server is running and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleExampleClick(question: string) {
    setInput(question);
    inputRef.current?.focus();
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse-glow">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Sahayak AI</h1>
          <p className="text-dark-400 text-sm">GraphRAG-powered funding intelligence with citations</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="pulse-dot" />
          <span className="text-sm text-dark-400">Online</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 glass-card overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-primary-600' 
                    : 'bg-gradient-to-br from-primary-500 to-accent-500'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`chat-message ${message.role}`}>
                  <div className="whitespace-pre-wrap">
                    {formatMessageContent(message.content)}
                  </div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dark-600">
                      <p className="text-xs text-dark-400 mb-2">Sources:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.slice(0, 3).map((source, idx) => (
                          <span key={idx} className="source-citation">
                            <BookOpen className="w-3 h-3" />
                            {source}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="chat-message assistant">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-dark-400">Searching knowledge base...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Example Questions */}
        {messages.length === 1 && (
          <div className="px-6 py-4 border-t border-dark-700">
            <p className="text-sm text-dark-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(q)}
                  className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-sm text-dark-300 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about investors, schemes, or opportunities..."
              className="input-dark flex-1"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="btn-gradient px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Send
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
