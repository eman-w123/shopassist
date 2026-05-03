import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function buildSystemPrompt(store: any, products: any[]) {
  const currency = store.currency || "USD";
  const lines = products.map((p, i) => {
    const parts = [
      `${i + 1}. ${p.name} — ${currency} ${p.price}`,
      p.sizes ? `Sizes ${p.sizes}` : null,
      p.stock_status,
      p.category ? `Category: ${p.category}` : null,
      p.description ? `Description: ${p.description}` : null,
      p.product_url ? `Link: ${p.product_url}` : null,
    ].filter(Boolean);
    return parts.join(" — ");
  });
  return `You are ShopAssist, a friendly AI shopping assistant for ${store.name}.
${store.description ? `About the store: ${store.description}\n` : ""}
Catalog (prices in ${currency}):
${lines.length ? lines.join("\n") : "(no products listed yet)"}

Guidelines:
- Help shoppers find products, compare items, suggest sizes, and make confident decisions.
- Keep replies short (2–3 sentences) and warm. Use light markdown.
- Link to product URLs when available using markdown links.
- Never invent products, prices, sizes, or discounts that aren't listed above.
- If "Low stock", gently create urgency without being pushy.
- If asked something outside the catalog, answer briefly then steer back to a relevant product.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, storeId, storeSlug, conversationId, visitorId } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
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

    // Resolve store
    let storeQuery = supabase.from("stores").select("*").limit(1);
    if (storeId) storeQuery = storeQuery.eq("id", storeId);
    else if (storeSlug) storeQuery = storeQuery.eq("slug", storeSlug);
    else {
      return new Response(JSON.stringify({ error: "storeId or storeSlug required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: stores, error: storeErr } = await storeQuery;
    if (storeErr || !stores?.length) {
      return new Response(JSON.stringify({ error: "Store not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const store = stores[0];

    const { data: products } = await supabase
      .from("products").select("*").eq("store_id", store.id).limit(200);

    const systemPrompt = buildSystemPrompt(store, products ?? []);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
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
        JSON.stringify({ error: "AI usage credits exhausted. Please add credits in your workspace." }),
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

    // Persist conversation + last user msg + assistant reply
    let convId = conversationId as string | undefined;
    try {
      if (!convId) {
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ store_id: store.id, visitor_id: visitorId ?? null })
          .select("id").single();
        convId = conv?.id;
      }
      if (convId) {
        const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
        const rows: any[] = [];
        if (lastUser) rows.push({ conversation_id: convId, role: "user", content: lastUser.content });
        rows.push({ conversation_id: convId, role: "assistant", content: reply });
        await supabase.from("messages").insert(rows);
      }
    } catch (logErr) {
      console.error("Persistence error:", logErr);
    }

    return new Response(JSON.stringify({ reply, conversationId: convId }), {
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