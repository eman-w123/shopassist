import { useEffect, useMemo, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { MessageCircle, Send, X, RotateCcw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { sendChat, ChatMessage } from "@/lib/gemini";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export interface ChatWidgetHandle {
  open: () => void;
  sendUserMessage: (text: string) => void;
}

interface Props {
  storeSlug: string;
  storeId?: string;
  storeName?: string;
  greeting?: string;
  primaryColor?: string;
  storageKey?: string;
  embedded?: boolean; // when true, render inline (no floating bubble)
}

const SUGGESTIONS = [
  "What's in stock?",
  "Show me your bestsellers",
  "Help me pick a size",
];

export const ChatWidget = forwardRef<ChatWidgetHandle, Props>(
  ({ storeSlug, storeId, storeName = "ShopAssist", greeting, primaryColor, storageKey, embedded = false }, ref) => {
    const key = storageKey ?? `shopassist:${storeSlug}:history`;
    const convKey = `shopassist:${storeSlug}:conv`;
    const greet = greeting ?? `Hi! I'm here to help you shop at **${storeName}** 👋`;

    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | undefined>(() => {
      try { return localStorage.getItem(convKey) ?? undefined; } catch { return undefined; }
    });
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length) return parsed;
        }
      } catch {}
      return [{ role: "assistant", content: greet }];
    });
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const colorVars = useMemo(() => {
      if (!primaryColor) return undefined as React.CSSProperties | undefined;
      return { ["--brand" as any]: primaryColor } as React.CSSProperties;
    }, [primaryColor]);

    useEffect(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, [messages, loading, open]);

    useEffect(() => {
      try { localStorage.setItem(key, JSON.stringify(messages)); } catch {}
    }, [messages, key]);

    useEffect(() => {
      try {
        if (conversationId) localStorage.setItem(convKey, conversationId);
      } catch {}
    }, [conversationId, convKey]);

    useEffect(() => {
      if (open || embedded) setTimeout(() => inputRef.current?.focus(), 150);
    }, [open, embedded]);

    const send = async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      const next = [...messages, { role: "user", content: trimmed } as ChatMessage];
      setMessages(next);
      setInput("");
      setLoading(true);
      try {
        const { reply, conversationId: cid } = await sendChat(next, { storeSlug, storeId, conversationId });
        if (cid) setConversationId(cid);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : String(e);
        const friendly =
          msg === "RATE_LIMIT"
            ? "I'm getting a lot of questions right now — please try again in a few seconds."
            : msg === "PAYMENT_REQUIRED"
            ? "AI usage credits have run out. Please add credits in your workspace."
            : "Sorry, I couldn't reach the assistant. Please check your connection and try again.";
        toast({ title: "Chat error", description: friendly, variant: "destructive" });
        setMessages((m) => [...m, { role: "assistant", content: friendly }]);
      } finally {
        setLoading(false);
      }
    };

    const reset = () => {
      setMessages([{ role: "assistant", content: greet }]);
      setConversationId(undefined);
      try { localStorage.removeItem(convKey); } catch {}
    };

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      sendUserMessage: (text: string) => { if (!embedded) setOpen(true); send(text); },
    }));

    const showSuggestions = messages.length <= 1 && !loading;
    const headerBg = primaryColor
      ? { background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }
      : undefined;
    const userBubbleStyle = primaryColor ? { backgroundColor: primaryColor, color: "#fff" } : undefined;

    const panel = (
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-glow",
            embedded ? "h-full w-full" : cn(
              "fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right transition-all duration-200",
              open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
            ),
          )}
          style={colorVars}
        >
          <div className="flex items-center justify-between gap-3 p-4 text-white" style={headerBg ?? undefined}>
            {!headerBg && <div className="absolute inset-0 -z-10 bg-gradient-hero" />}
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur-sm">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold leading-tight">{storeName}</div>
                <div className="flex items-center gap-1.5 text-xs text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online · replies instantly
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              aria-label="Clear chat"
              title="Clear chat"
              className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className={cn("overflow-y-auto bg-gradient-soft p-4", embedded ? "flex-1" : "h-[26rem]")}>
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                      : "mr-auto rounded-bl-sm bg-bot-bubble text-bot-bubble-foreground"
                  )}
                  style={m.role === "user" ? userBubbleStyle : undefined}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-strong:text-bot-bubble-foreground">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              ))}
              {loading && (
                <div className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-sm bg-bot-bubble px-4 py-3">
                  <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0s" }} />
                  <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
                  <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
                </div>
              )}

              {showSuggestions && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                      <Sparkles className="h-3 w-3" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-full"
              style={primaryColor ? { backgroundColor: primaryColor, color: "#fff" } : undefined}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
    );

    if (embedded) return panel;

    return (
      <>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close chat" : "Open chat"}
          style={primaryColor ? { backgroundColor: primaryColor, color: "#fff" } : undefined}
          className={cn(
            "fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95",
            open && "rotate-90"
          )}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
        {panel}
      </>
    );
  }
);

ChatWidget.displayName = "ChatWidget";
export default ChatWidget;
