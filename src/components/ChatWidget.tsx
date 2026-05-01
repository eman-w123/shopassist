import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendToGemini, ChatMessage } from "@/lib/gemini";
import { cn } from "@/lib/utils";

export interface ChatWidgetHandle {
  open: () => void;
  sendUserMessage: (text: string) => void;
}

interface Props {
  greeting?: string;
}

export const ChatWidget = forwardRef<ChatWidgetHandle, Props>(({ greeting }, ref) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        greeting ?? "Hi! I'm ShopAssist 👋 Ask me about any StyleZone product — sizes, prices, or what suits you.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next = [...messages, { role: "user", content: trimmed } as ChatMessage];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendToGemini(next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Oops — I couldn't reach the assistant right now. Please check your connection or API key and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    sendUserMessage: (text: string) => {
      setOpen(true);
      send(text);
    },
  }));

  return (
    <>
      {/* Floating button */}
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

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right overflow-hidden rounded-2xl border border-border bg-card shadow-glow transition-all duration-200",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-hero p-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/20 backdrop-blur-sm">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold">ShopAssist</div>
              <div className="text-xs text-primary-foreground/80">Usually replies instantly</div>
            </div>
          </div>
        </div>

        {/* Messages */}
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
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-sm bg-bot-bubble px-4 py-3">
                <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0s" }} />
                <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.15s" }} />
                <span className="dot-bounce h-2 w-2 rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border bg-card p-3"
        >
          <input
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
});

ChatWidget.displayName = "ChatWidget";
export default ChatWidget;