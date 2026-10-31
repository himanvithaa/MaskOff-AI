import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Bot, 
  User, 
  ChevronDown, 
  HelpCircle,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';
import { chatbotAPI } from '../../services/api';

/**
 * MaskOff Assistant Chatbot
 * Floating assistant grounded in the official MaskOff AI knowledge base.
 * Accessible across the entire application at bottom-right.
 */
export default function MaskOffAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      content: (
        "Hello! I'm your MaskOff Assistant. " +
        "I can help you understand our 16:9 video interviewers (Arjun & Ananya), " +
        "explain frameworks like PREP or STAR, explain camera preflight, or guide your practice. What would you like to know?"
      )
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "How does the PREP framework work?",
    "Tell me about Arjun and Ananya.",
    "How is my camera delivery evaluated?",
    "What is Weakness DNA?"
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend = null) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || loading) return;

    const newMessages = [...messages, { sender: 'user', content: messageContent }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = newMessages.map((m) => ({
        sender: m.sender,
        content: m.content
      }));

      const res = await chatbotAPI.sendMessage({
        message: messageContent,
        history: historyPayload
      });

      const reply = res.data.reply || "I'm here to support your communication practice on MaskOff AI.";
      setMessages([...newMessages, { sender: 'assistant', content: reply }]);

      if (res.data.suggestions && res.data.suggestions.length > 0) {
        setSuggestions(res.data.suggestions);
      }
    } catch (err) {
      console.error("Chatbot request error:", err);
      setMessages([
        ...newMessages,
        {
          sender: 'assistant',
          content: "I'm having trouble connecting right now, but you can always practice with Arjun and Ananya in the Arenas, use the PREP framework (Point, Reason, Example, Point), or verify your camera in preflight!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'assistant',
        content: "Chat history cleared. How can I help you excel in your next interview or presentation?"
      }
    ]);
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center space-x-2.5 px-4 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl hover:shadow-2xl transition duration-200 border border-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20"
          aria-label="Open MaskOff Assistant"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block text-xs font-bold leading-tight">MaskOff Assistant</span>
            <span className="block text-[10px] text-slate-400 leading-tight">Platform & Skills Guide</span>
          </div>
        </button>
      )}

      {/* Slide-Up / Slide-Out Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-primary-600 flex items-center justify-center shadow-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center space-x-1.5">
                  <span>MaskOff Assistant</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </h3>
                <p className="text-[10px] text-slate-400">Communication Coach & System Guide</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2.5 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl max-w-[82%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary-600 text-white rounded-br-xs font-medium shadow-xs'
                      : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200/80 shadow-xs whitespace-pre-line'
                  }`}
                >
                  {m.content}
                </div>
                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs pt-1">
                <div className="w-6 h-6 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white p-2.5 px-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex-shrink-0 flex items-center space-x-1">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Suggestions:</span>
              </span>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(s)}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 text-[11px] whitespace-nowrap transition border border-slate-200/60"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center space-x-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about interviewers, PREP, camera..."
              disabled={loading}
              className="flex-1 p-2.5 px-3 rounded-xl clean-input text-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-40 transition shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

