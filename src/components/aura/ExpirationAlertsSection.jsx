import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabaseClient";
import { Send, User, Package, AlertTriangle, Zap, ShoppingCart, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AuraChatSection() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm AuraAI — your intelligent store assistant. I have full visibility into your inventory, orders, and flash sales. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeContext, setStoreContext] = useState(null);
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setUser(data.user)).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const history = newMessages.slice(-8).map(m => ({ role: m.role, content: m.content }));

    const res = await Promise.resolve({ data: {} }) /* TODO: replace with Railway endpoint */;

    const data = res.data;
    if (data?.store_context) setStoreContext(data.store_context);

    setMessages(prev => [
      ...prev,
      { role: "assistant", content: data?.response || "Sorry, I couldn't process that." }
    ]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const contextStats = storeContext ? [
    { label: "Low Stock", value: storeContext.low_stock_count, icon: Package, color: "text-amber-500" },
    { label: "Expiring Soon", value: storeContext.expiring_count, icon: AlertTriangle, color: "text-red-500" },
    { label: "Active Sales", value: storeContext.active_flash_sales, icon: Zap, color: "text-purple-500" },
    { label: "Draft Orders", value: storeContext.draft_orders, icon: ShoppingCart, color: "text-blue-500" },
  ] : null;

  return (
    <div className="space-y-4">
      {/* Store Context Stats */}
      {contextStats && (
        <div className="grid grid-cols-4 gap-3">
          {contextStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-3 text-center">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Chat Window */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col" style={{ height: "520px" }}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <img src="/shelfsmart/aura-logo.png" alt="AuraAI" className="w-8 h-8 rounded-full object-cover" />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">AuraAI</p>
            <p className="text-xs text-green-500 font-medium">● Online</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <img src="/shelfsmart/aura-logo.png" alt="AuraAI" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-slate-800 dark:bg-slate-600 text-white rounded-tr-sm"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm"
              }`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                    components={{
                      p: ({ children }) => <p className="my-0.5 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                      li: ({ children }) => <li className="my-0.5">{children}</li>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <img src="/shelfsmart/aura-logo.png" alt="AuraAI" className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5" />
              <div className="bg-slate-100 dark:bg-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AuraAI anything about your store..."
              rows={1}
              className="flex-1 px-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400"
              style={{ maxHeight: "100px", overflowY: "auto" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 px-1">Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
