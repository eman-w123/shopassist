import { useRef } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import ChatWidget, { ChatWidgetHandle } from "@/components/ChatWidget";

const Demo = () => {
  const widgetRef = useRef<ChatWidgetHandle>(null);

  const ask = (name: string) => {
    widgetRef.current?.sendUserMessage(`Tell me about ${name}`);
  };

  return (
    <div className="container py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="mb-2 text-4xl font-bold">StyleZone Demo Store</h1>
        <p className="text-muted-foreground">
          Click the chat bubble in the corner — or tap <span className="font-medium text-foreground">Ask</span> on any product to see ShopAssist in action.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Product panel */}
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Package className="h-4 w-4" /> Products
          </div>
          <div className="flex flex-col gap-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Rs {p.price.toLocaleString()} ·{" "}
                    <span className={p.stock === "Low stock" ? "text-destructive" : "text-primary"}>
                      {p.stock}
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={() => ask(p.name)} className="rounded-full">
                  Ask
                </Button>
              </div>
            ))}
          </div>
        </aside>

        {/* Right helper panel */}
        <section className="rounded-2xl border border-dashed border-border bg-gradient-soft p-10 text-center">
          <div className="mx-auto max-w-md">
            <h2 className="mb-3 text-2xl font-semibold">Your storefront, supercharged</h2>
            <p className="mb-6 text-muted-foreground">
              The widget you see at the bottom-right is exactly what shoppers will see when ShopAssist is embedded on your store.
            </p>
            <div className="grid grid-cols-3 gap-3 text-left text-sm">
              {["Knows your catalog", "Remembers context", "Friendly tone"].map((t) => (
                <div key={t} className="rounded-xl border border-border bg-card p-3 text-xs font-medium">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <ChatWidget ref={widgetRef} storeSlug={DEMO_SLUG} storeName={storeName} />
    </div>
  );
};

export default Demo;