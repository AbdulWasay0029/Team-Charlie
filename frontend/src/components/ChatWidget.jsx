import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, SendHorizontal, Loader2, ArrowRight, Mic } from 'lucide-react';

export default function ChatWidget({ 
  chatMessages, 
  chatLoading, 
  chatInput, 
  setChatInput, 
  onSendMessage, 
  onChatAction,
  showToast 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom on new message
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  const handleOpenToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
    }
  };

  const handleChipClick = (text) => {
    setChatInput(text);
    // Submit message automatically after setting input state
    setTimeout(() => {
      const mockEvent = { preventDefault: () => {} };
      onSendMessage(mockEvent, text);
    }, 50);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(e, chatInput.trim());
  };

  const showChips = chatMessages.length === 1 && !chatLoading;

  const SUGGESTIONS = [
    { label: "📍 Pothole near me", text: "There's a pothole near my house" },
    { label: "🔍 Track status", text: "How do I check my report status?" },
    { label: "⚡ Priority threshold", text: "What happens after 25 votes?" },
    { label: "🕳️ Open drain issue", text: "Report an open drain" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[1100] font-body select-none">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={handleOpenToggle}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 text-white flex items-center justify-center shadow-xl hover:shadow-orange-500/20 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer animate-bounce"
          style={{ animationDuration: '3s' }}
          title="AI Grievance Assistant"
        >
          <MessageSquare className="w-6 h-6" />
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500 text-[8px] font-mono font-bold items-center justify-center">1</span>
            </span>
          )}
        </button>
      )}

      {/* Expanded Chat Widget */}
      {isOpen && (
        <div className="w-[360px] md:w-[380px] h-[520px] max-h-[80vh] bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform scale-100 translate-y-0 opacity-100 animate-in slide-in-from-bottom-5 fade-in-50">
          
          {/* Chat Widget Header */}
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-orange-500 to-red-600 p-2 rounded-xl text-white shadow-md shadow-orange-500/10">
                <MessageSquare className="h-4.5 w-4.5" />
              </div>
              <div className="text-left">
                <h3 className="font-display font-black text-sm text-slate-100 leading-tight">AI Grievance Assistant</h3>
                <p className="text-[9px] text-slate-400 font-mono tracking-wider uppercase font-bold mt-0.5">Municipal Helpdesk</p>
              </div>
            </div>
            
            <button
              onClick={handleOpenToggle}
              className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
            {chatMessages.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs text-left ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-orange-500 to-red-650 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200/80 text-slate-700 rounded-tl-none'
                }`}>
                  {msg.text}

                  {/* Render Chat Actions */}
                  {msg.action && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          onChatAction(msg.action.category, msg.action.type, msg.action.targetReport);
                          setIsOpen(false); // Auto collapse chat to show map
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[9px] font-mono tracking-widest uppercase px-3.5 py-1.5 rounded-xl transition shadow flex items-center gap-1 cursor-pointer"
                      >
                        {msg.action.label}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200/60 px-4 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-xs">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-orange-500" />
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest animate-pulse font-bold">Assistant is typing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion Chips Panel */}
          {showChips && (
            <div className="px-4 py-2 border-t border-slate-100 bg-white/80 shrink-0">
              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 text-left mb-1.5 ml-1">Try asking</p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChipClick(s.text)}
                    className="w-full text-left py-1.5 px-3 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:text-orange-600 transition cursor-pointer text-left font-sans truncate shadow-2xs"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <form 
            onSubmit={handleFormSubmit} 
            className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2.5 shrink-0"
          >
            <button
              type="button"
              onClick={() => showToast("Microphone requires browser permissions", "info")}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 p-2.5 rounded-xl transition cursor-pointer shrink-0 shadow-2xs"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>
            
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your civic issue here..."
              className="flex-1 bg-slate-50 border border-slate-250 rounded-xl py-2.5 px-3.5 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-transparent focus:bg-white transition shadow-2xs"
            />

            <button
              type="submit"
              disabled={!chatInput.trim() || chatLoading}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white p-2.5 rounded-xl transition shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-orange-500/10"
            >
              <SendHorizontal className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
