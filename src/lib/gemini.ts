import { SYSTEM_PROMPT } from "@/data/products";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MODEL = "gemini-1.5-flash";

export async function sendToGemini(history: ChatMessage[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY. Add it to your environment.");
  }

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  const reply =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  if (!reply) throw new Error("Empty response from Gemini.");
  return reply.trim();
}