import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
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
  storeId?: string;
  storeSlug?: string;
  storeName?: string;
  greeting?: string;
  primaryColor?: string;
  suggestions?: string[];
  storageKey?: string;
  embedded?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  "What do you have in stock?",
  "Recommend something popular",
  "Help me pick a size",
];

function getVisitorId() {
  try {
    let id = localStorage.getItem("shopassist:visitor");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("shopassist:visitor", id);
    }
    return id;
  } catch {
    return undefined;
  }
}

function hslFromHex(hex: string): string | null {
  const m = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${h.toFixed(0)} ${(s * 100).toFixed(0)}% ${(l * 100).toFixed(0)}%`;
}

export const ChatWidget = forwardRef<ChatWidgetHandle, Props>(
  ({ storeId, storeSlug, storeName = "ShopAssist", greeting, primaryColor, suggestions = DEFAULT_SUGGESTIONS, storageKey, embedded = false }, ref) => {
    const key = storageKey ?? `shopassist:history:${storeSlug ?? storeId ?? "default"}`;
    const convKey = `${key}:conv`;

    const initialGreeting = greeting || `Hi! I'm your ${storeName} assistant 👋 How can I help?`;
    const [open, setOpen] = useState(embedded);
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
      return [{ role: "assistant", content: initialGreeting }];
    });
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const styleVars = primaryColor
      ? ({ ["--primary" as any]: hslFromHex(primaryColor) ?? undefined } as React.CSSProperties)
      : undefined;

    useEffect(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, loading, open]);

    useEffect(() => {
      try { localStorage.setItem(key, JSON.stringify(messages)); } catch {}
    }, [messages, key]);

    useEffect(() => {
      try {
        if (conversationId) localStorage.setItem(convKey, conversationId);
      } catch {}
    }, [conversationId, convKey]);

    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150); }, [open]);

    const send = async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      if (!storeId && !storeSlug) {
        toast({ title: "Not configured", description: "Missing store identifier.", variant: "destructive" });
        return;
      }
      const next = [...messages, { role: "user", content: trimmed } as ChatMessage];
      setMessages(next);
      setInput("");
      setLoading(true);
      try {
        const { reply, conversationId: cid } = await sendChat(next, {
          storeId, storeSlug, conversationId, visitorId: getVisitorId(),
        });
        if (cid) setConversationId(cid);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        const friendly =
          msg === "RATE_LIMIT" ? "I'm getting many questions right now — try again in a moment."
          : msg === "PAYMENT_REQUIRED" ? "AI credits exhausted. The store owner needs to add credits."
          : "Sorry, I couldn't reach the assistant. Please try again.";
        toast({ title: "Chat error", description: friendly, variant: "destructive" });
        setMessages((m) => [...m, { role: "assistant", content: friendly }]);
      } finally {
        setLoading(false);
      }
    };

    const reset = () => {
      setMessages([{ role: "assistant", content: initialGreeting }]);
      setConversationId(undefined);
      try { localStorage.removeItem(convKey); } catch {}
    };

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      sendUserMessage: (text: string) => { setOpen(true); send(text); },
    }));

    const showSuggestions = messages.length <= 1 && !loading;

    const panel = (
      <div
        style={styleVars}
        className={cn(
          "flex h-full w-full flex-col overflow-hidden bg-card",
          !embedded && "rounded-2xl border border-border shadow-glow",
        )}
      >
        <div className="flex items-center justify-between gap-3 bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold leading-tight">{storeName}</div>
              <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={reset} aria-label="Clear chat" title="Clear chat"
              className="rounded-full p-1.5 text-primary-foreground/80 hover:bg-primary-foreground/15">
              <RotateCcw className="h-4 w-4" />
            </button>
            {!embedded && (
              <button onClick={() => setOpen(false)} aria-label="Close"
                className="rounded-full p-1.5 text-primary-foreground/80 hover:bg-primary-foreground/15">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div ref={scrollRef} className={cn("flex-1 overflow-y-auto bg-background p-4", !embedded && "h-[26rem]")}>
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                m.role === "user"
                  ? "ml-auto rounded-br-sm bg-primary text-primary-foreground"
                  : "mr-auto rounded-bl-sm bg-muted text-foreground"
              )}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-a:text-primary">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0s" }} />
                <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
                <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
            {showSuggestions && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">
                    <Sparkles className="h-3 w-3" />{s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 border-t border-border bg-card p-3">
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <Button type="submit" size="icon" className="h-10 w-10 rounded-full" disabled={loading || !input.trim()}>
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
          style={styleVars}
          className={cn(
            "fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95",
            open && "rotate-90",
          )}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
        <div className={cn(
          "fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right transition-all duration-200",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}>
          {panel}
        </div>
      </>
    );
  },
);

ChatWidget.displayName = "ChatWidget";
export default ChatWidget;
