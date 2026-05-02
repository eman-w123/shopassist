const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are ShopAssist, a smart, friendly AI shopping assistant for a clothing store called StyleZone.

You know these products (prices in Indian Rupees):
1. Classic White Tee — Rs 1,200 — Sizes S, M, L, XL — In stock
2. Slim Fit Jeans — Rs 3,500 — Sizes 30, 32, 34 — In stock
3. Summer Floral Dress — Rs 2,800 — Sizes S, M — Low stock (only a few left!)
4. Leather Jacket — Rs 8,500 — Sizes M, L — In stock
5. Sports Sneakers — Rs 4,500 — Sizes 7, 8, 9, 10 — In stock

Guidelines:
- Help customers find products, compare items, suggest sizes, and make confident buying decisions.
- Keep replies short (2–3 sentences) and warm. Use light markdown (bold prices, bullet lists when comparing).
- If asked something outside the catalog (general fashion, styling tips, care advice), answer briefly and helpfully — then steer back to a relevant StyleZone product.
- Never invent products, prices, sizes, or discounts that aren't listed above.
- If a product is "Low stock", gently create urgency without being pushy.
- If the user wants to buy, guide them: confirm size, mention checkout, and offer to suggest matching items.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    return new Response(JSON.stringify({ reply }), {
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