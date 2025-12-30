import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Loader2, BookOpen } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  context_used?: boolean;
}

export default function SahayakAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m Sahayak, your AI funding assistant. I can help you find investors, check eligibility for schemes, and guide you through the startup ecosystem. How can I assist you today?'
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        context_used: data.context_used
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please check your connection and try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedPrompts = [
    'Which investors match my HealthTech startup?',
    'Am I eligible for SISFS scheme?',
    'What documents do I need for DPIIT?',
  ];

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-6rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Catalyst AI
          </h1>
          <p className="text-slate-500 mt-1">Your intelligent funding ecosystem guide</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-700">Online</span>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col shadow-lg ring-1 ring-black/5">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl flex gap-4 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>

                <div className={`space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`px-6 py-4 rounded-2xl shadow-sm border ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white border-blue-500 rounded-tr-sm'
                        : 'bg-white text-slate-700 border-slate-100 rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                       {/* Basic rendering, strictly text for now to avoid complexity with markdown parsing libraries if not installed */}
                       {message.content.split('\n').map((line, i) => (
                         <p key={i} className="min-h-[1rem]">{line}</p>
                       ))}
                    </div>
                  </div>

                  {message.sources && message.sources.length > 0 && (
                    <div className="bg-white/80 p-3 rounded-xl border border-slate-100 text-xs shadow-sm max-w-xl">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-2 font-medium uppercase tracking-wider">
                        <BookOpen className="w-3 h-3" />
                        Sources Verified
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {message.sources.map((source, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200 truncate max-w-[200px]">
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
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div className="px-6 py-4 bg-white rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="text-sm text-slate-500 font-medium">Analyzing ecosystem...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {suggestedPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setInput(prompt)}
                className="whitespace-nowrap px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-white hover:border-blue-200 hover:text-blue-600 hover:shadow-sm transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
          
          <div className="flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about investors, schemes, or eligibility..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-inner"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
