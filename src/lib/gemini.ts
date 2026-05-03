import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SendChatOptions {
  storeId?: string;
  storeSlug?: string;
  conversationId?: string;
  visitorId?: string;
}

export interface SendChatResult {
  reply: string;
  conversationId?: string;
}

export async function sendChat(
  history: ChatMessage[],
  opts: SendChatOptions = {},
): Promise<SendChatResult> {
  const messages = history.map((m) => ({ role: m.role, content: m.content }));

  const { data, error } = await supabase.functions.invoke("chat", {
    body: { messages, ...opts },
  });

  if (error) {
    const status = (error as any)?.context?.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(error.message || "Network error");
  }

  if (data?.error) throw new Error(data.error);
  if (!data?.reply) throw new Error("Empty reply");
  return { reply: data.reply as string, conversationId: data.conversationId };
}
