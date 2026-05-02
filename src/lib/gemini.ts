import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChat(history: ChatMessage[]): Promise<string> {
  // Convert to OpenAI-style roles for the gateway
  const messages = history.map((m) => ({ role: m.role, content: m.content }));

  const { data, error } = await supabase.functions.invoke("chat", {
    body: { messages },
  });

  if (error) {
    // supabase-js throws FunctionsHttpError; try to extract status/message
    const status = (error as any)?.context?.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("PAYMENT_REQUIRED");
    throw new Error(error.message || "Network error");
  }

  if (data?.error) throw new Error(data.error);
  if (!data?.reply) throw new Error("Empty reply");
  return data.reply as string;
}
