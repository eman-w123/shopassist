import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildSystemPrompt(store: any, products: any[]) {
  const currency = store.currency || "USD";
  const lines = products.length
    ? products
        .map((p, i) => {
          const parts = [`${i + 1}. ${p.name}`];
          parts.push(`${currency} ${Number(p.price).toLocaleString()}`);
          if (p.sizes) parts.push(`Sizes: ${p.sizes}`);
          parts.push(p.stock_status || "In stock");
          if (p.category) parts.push(`Category: ${p.category}`);
          if (p.description) parts.push(p.description);
          if (p.product_url) parts.push(`Link: ${p.product_url}`);
          return parts.join(" — ");
        })
        .join("\n")
    : "(No products configured yet.)";

  return `You are ShopAssist, the AI shopping assistant for ${store.name}.
${store.description ? `About the store: ${store.description}\n` : ""}
Catalog (prices in ${currency}):
${lines}

Guidelines:
- Be warm, concise (2–3 sentences). Use light markdown (bold prices, bullets when comparing).
- Only recommend products from the catalog above. Never invent products, prices, sizes, discounts, or links.
- If a product is "Low stock", gently note urgency without being pushy.
- If asked something off-catalog, answer briefly then steer back to a relevant product.
- When the shopper wants to buy, confirm size and share the product link if available.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, storeSlug, conversationId: incomingConversationId } =
      await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!storeSlug || typeof storeSlug !== "string") {
      return new Response(JSON.stringify({ error: "storeSlug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", storeSlug)
      .maybeSingle();
    if (storeErr || !store) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: true });

    const SYSTEM_PROMPT = buildSystemPrompt(store, products ?? []);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Too many requests right now. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI usage credits exhausted. Please add credits in your Lovable workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply: string =
      data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";

    // Persist conversation/messages best-effort
    let conversationId = incomingConversationId as string | undefined;
    try {
      if (!conversationId) {
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ store_id: store.id })
          .select("id")
          .single();
        conversationId = conv?.id;
      }
      if (conversationId) {
        const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
        const rows = [];
        if (lastUser) rows.push({ conversation_id: conversationId, role: "user", content: lastUser.content });
        rows.push({ conversation_id: conversationId, role: "assistant", content: reply });
        await supabase.from("messages").insert(rows);
      }
    } catch (e) {
      console.error("persist error", e);
    }

    return new Response(JSON.stringify({ reply, conversationId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});