'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TripFullData, ChatMessage } from '../types/trip';
import { Send, Sparkles, Bot, User, Check, X, Loader2, ArrowDownCircle } from 'lucide-react';

interface AiChatDrawerProps {
  tripData: TripFullData;
  onApplyAction: (actionName: string, args: any) => void;
  isOpen?: boolean;
  onClose?: () => void;
  isStandaloneTab?: boolean;
  initialPrompt?: string;
}

export function AiChatDrawer({
  tripData,
  onApplyAction,
  isOpen = true,
  onClose,
  isStandaloneTab = false,
  initialPrompt = '',
}: AiChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(tripData.chatMessages || []);
  const [input, setInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickSuggestions = [
    'תוסיף טיסה לרומא ב-10 במאי ב-06:15 באל על',
    'הוסף ליום 2 ארוחת ערב בטרסטוורה בשעה 20:00',
    'תוסיף לרשימת האריזה מטען נייד חזק עבורה',
    'הוסף לתקציב הוצאה של 250 ש״ח על סיור בגלריה',
    'תציע לנו תוכנית ליום חופשי של רומנטיקה ופנאי',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          currentTripData: tripData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.reply || 'שגיאה בשרת ה-AI');
      }

      const actionsPerformed: Array<{ type: string; details: string }> = [];

      // Execute returned function calls
      if (data.actions && Array.isArray(data.actions)) {
        for (const action of data.actions) {
          onApplyAction(action.name, action.args);
          actionsPerformed.push({
            type: action.name,
            details: formatActionSummary(action.name, action.args),
          });
        }
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        actionsPerformed: actionsPerformed.length > 0 ? actionsPerformed : undefined,
        createdAt: new Date().toISOString(),
      };

      setMessages([...newMessages, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `סליחה, אירעה שגיאה: ${err.message || 'לא ניתן היה לקבל מענה מה-AI'}`,
        createdAt: new Date().toISOString(),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatActionSummary = (name: string, args: any) => {
    switch (name) {
      case 'add_activity':
        return `נוספה פעילות: ${args.title} (${args.activityDate || ''})`;
      case 'delete_activity':
        return `נמחקה פעילות: ${args.title}`;
      case 'add_flight':
        return `נוספה טיסה: ${args.airline} ${args.flightNumber} (${args.departureAirport} ➔ ${args.arrivalAirport})`;
      case 'add_lodging':
        return `נוסף מקום לינה: ${args.name} (${args.address})`;
      case 'add_budget_item':
        return `נוספה הוצאה: ${args.title} (₪${args.estimatedCost || args.actualCost || 0})`;
      case 'add_packing_item':
        return `נוסף לרשימת האריזה: ${args.title} (${args.assignedTo || 'שנינו'})`;
      case 'toggle_packing_item':
        return `עודכן פריט: ${args.title} (${args.isPacked ? 'נארז' : 'לא נארז'})`;
      case 'update_trip_info':
        return `עודכנו פרטי הטיול`;
      default:
        return `בוצעה פעולה במערכת: ${name}`;
    }
  };

  if (!isOpen && !isStandaloneTab) return null;

  const content = (
    <div className="flex flex-col h-full bg-stone-50 text-stone-900">
      {/* Header (Only if popup drawer) */}
      {!isStandaloneTab && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-600 text-white p-4 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">עוזר הטיול שלכם (Gemini AI)</h3>
              <p className="text-[11px] text-teal-100">יודע לעדכן את המערכת בזמן אמת לפי בקשתכם</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-2.5 max-w-[88%] ${isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isUser ? 'bg-teal-600 text-white' : 'bg-gradient-to-tr from-amber-400 to-orange-500 text-stone-950 shadow-2xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1.5">
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-teal-600 text-white rounded-tl-xs shadow-xs'
                      : 'bg-white text-stone-800 border border-stone-200/90 rounded-tr-xs shadow-2xs'
                  }`}
                >
                  {m.content}
                </div>

                {/* Actions Performed Badges */}
                {m.actionsPerformed && m.actionsPerformed.length > 0 && (
                  <div className="space-y-1">
                    {m.actionsPerformed.map((act, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/80 animate-in fade-in"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{act.details}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 max-w-[85%] ml-auto">
            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-stone-950 animate-spin" />
            </div>
            <div className="bg-white p-3 rounded-2xl border border-stone-200/90 rounded-tr-xs shadow-2xs flex items-center gap-2 text-xs text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>ה-AI מעבד את הבקשה ומעדכן את המערכת...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions Chips */}
      <div className="px-4 py-2 border-t border-stone-200/70 bg-white/70 backdrop-blur-xs flex gap-1.5 overflow-x-auto scrollbar-none">
        {quickSuggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(suggestion)}
            className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-stone-100 hover:bg-teal-50 hover:text-teal-700 text-stone-600 border border-stone-200/60 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-stone-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="כתבו הוראה או שאלה ל-AI (למשל: תוסיף למסלול...)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-stone-50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 text-white rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );

  if (isStandaloneTab) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs h-[72vh] overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40 backdrop-blur-2xs animate-in fade-in">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left">
        {content}
      </div>
    </div>
  );
}
