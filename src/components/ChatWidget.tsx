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
  greeting?: string;
  storageKey?: string;
}

const SUGGESTIONS = [
  "What's in stock?",
  "Suggest something under Rs 3000",
  "Help me pick a size",
];

const defaultGreeting =
  "Hi! I'm **ShopAssist** 👋 Ask me about any StyleZone product — sizes, prices, or styling tips.";

export const ChatWidget = forwardRef<ChatWidgetHandle, Props>(
  ({ greeting, storageKey = "shopassist:history" }, ref) => {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw) as ChatMessage[];
          if (Array.isArray(parsed) && parsed.length) return parsed;
        }
      } catch {}
      return [{ role: "assistant", content: greeting ?? defaultGreeting }];
    });
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, [messages, loading, open]);

    useEffect(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch {}
    }, [messages, storageKey]);

    useEffect(() => {
      if (open) setTimeout(() => inputRef.current?.focus(), 150);
    }, [open]);

    const send = async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      const next = [...messages, { role: "user", content: trimmed } as ChatMessage];
      setMessages(next);
      setInput("");
      setLoading(true);
      try {
        const reply = await sendChat(next);
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : String(e);
        const friendly =
          msg === "RATE_LIMIT"
            ? "I'm getting a lot of questions right now — please try again in a few seconds."
            : msg === "PAYMENT_REQUIRED"
            ? "AI usage credits have run out. Please add credits in your Lovable workspace."
            : "Sorry, I couldn't reach the assistant. Please check your connection and try again.";
        toast({ title: "Chat error", description: friendly, variant: "destructive" });
        setMessages((m) => [...m, { role: "assistant", content: friendly }]);
      } finally {
        setLoading(false);
      }
    };

    const reset = () => {
      const fresh: ChatMessage[] = [
        { role: "assistant", content: greeting ?? defaultGreeting },
      ];
      setMessages(fresh);
    };

    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      sendUserMessage: (text: string) => {
        setOpen(true);
        send(text);
      },
    }));

    const showSuggestions = messages.length <= 1 && !loading;

    return (
      <>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close chat" : "Open chat"}
          className={cn(
            "fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95",
            open && "rotate-90"
          )}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>

        <div
          className={cn(
            "fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right overflow-hidden rounded-2xl border border-border bg-card shadow-glow transition-all duration-200",
            open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
          )}
        >
          <div className="flex items-center justify-between gap-3 bg-gradient-hero p-4 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/20 backdrop-blur-sm">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold leading-tight">ShopAssist</div>
                <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online · replies instantly
                </div>
              </div>
            </div>
            <button
              onClick={reset}
              aria-label="Clear chat"
              title="Clear chat"
              className="rounded-full p-1.5 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="h-[26rem] overflow-y-auto bg-gradient-soft p-4">
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
              placeholder="Ask about a product…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <Button type="submit" size="icon" className="h-10 w-10 rounded-full" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </>
    );
  }
);

ChatWidget.displayName = "ChatWidget";
export default ChatWidget;
