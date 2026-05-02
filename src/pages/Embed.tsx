import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const Embed = () => {
  const [storeName, setStoreName] = useState("");
  const [storeDesc, setStoreDesc] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = `<!-- ShopAssist widget -->
<script
  src="https://cdn.shopassist.ai/widget.js"
  data-store="${storeName || "your-store"}"
  data-description="${(storeDesc || "Your store description").replace(/"/g, "&quot;")}"
  defer
></script>`;

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="container grid gap-10 py-12 lg:grid-cols-2">
      <section>
        <h1 className="mb-2 text-4xl font-bold">Embed ShopAssist</h1>
        <p className="mb-8 text-muted-foreground">
          Tell us about your store and we'll generate the embed snippet you can drop into any HTML page.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-card"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Store name</Label>
            <Input
              id="name"
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="StyleZone"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="desc">Store description</Label>
            <Textarea
              id="desc"
              required
              value={storeDesc}
              onChange={(e) => setStoreDesc(e.target.value)}
              placeholder="A modern clothing brand with curated essentials for everyday wear."
              rows={4}
            />
          </div>
          <Button type="submit" size="lg" className="rounded-full bg-gradient-hero shadow-glow">
            Generate embed code
          </Button>
        </form>

        {submitted && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Your embed snippet</div>
              <Button size="sm" variant="outline" onClick={copy} className="rounded-full">
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-foreground p-4 text-xs leading-relaxed text-background">
              <code>{snippet}</code>
            </pre>
            <p className="mt-3 text-xs text-muted-foreground">
              Paste this just before <code className="rounded bg-muted px-1 py-0.5">&lt;/body&gt;</code> on every page.
            </p>
          </div>
        )}
      </section>

      {/* Widget preview */}
      <section>
        <div className="sticky top-24">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Live preview
          </div>
          <div className="relative h-[520px] overflow-hidden rounded-2xl border border-border bg-gradient-soft p-6 shadow-card">
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Your store page
            </div>

            {/* Mock floating widget */}
            <div className="absolute bottom-20 right-5 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-glow">
              <div className="bg-gradient-hero p-3 text-primary-foreground">
                <div className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-primary-foreground/20">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-semibold">{storeName || "Your store"}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-3">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-bot-bubble px-3 py-2 text-xs">
                  Hi! Looking for something specific today?
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground">
                  Do you have summer dresses?
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-bot-bubble px-3 py-2 text-xs">
                  Yes! Our Summer Floral Dress is Rs 2800, sizes S & M (low stock!).
                </div>
              </div>
            </div>

            <div className="absolute bottom-5 right-5 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow">
              <MessageCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Embed;