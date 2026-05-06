import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Check, Plus, Trash2, ExternalLink, MessageSquare } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

interface Store {
  id: string; name: string; slug: string; description: string | null;
  primary_color: string; greeting: string; currency: string; owner_id: string;
}
interface Product {
  id: string; store_id: string; name: string; description: string | null;
  price: number; sizes: string | null; stock_status: string; category: string | null;
  image_url: string | null; product_url: string | null; tags: string[];
}

export default function StoreEditor() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const [{ data: s }, { data: p }, { data: c }] = await Promise.all([
        supabase.from("stores").select("*").eq("id", id).single(),
        supabase.from("products").select("*").eq("store_id", id).order("created_at", { ascending: false }),
        supabase.from("conversations").select("*").eq("store_id", id).order("created_at", { ascending: false }).limit(20),
      ]);
      setStore(s as Store);
      setProducts((p as Product[]) ?? []);
      setConversations(c ?? []);
      setLoading(false);
    })();
  }, [user, id]);

  if (authLoading || loading || !store) return <div className="container py-12 text-muted-foreground">Loading…</div>;

  const saveStore = async () => {
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      name: store.name, description: store.description, primary_color: store.primary_color,
      greeting: store.greeting, currency: store.currency,
    }).eq("id", store.id);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: "Store updated." });
  };

  const deleteStore = async () => {
    if (!confirm("Delete this store and all its data?")) return;
    await supabase.from("stores").delete().eq("id", store.id);
    navigate("/dashboard");
  };

  const origin = window.location.origin;
  const snippet = `<script src="${origin}/widget.js" data-store="${store.slug}" defer></script>`;

  const copy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="container py-8">
      <Link to="/dashboard" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">/{store.slug}</p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link to={`/c/${store.slug}`} target="_blank"><ExternalLink className="mr-1 h-4 w-4" />Open chat</Link>
        </Button>
      </div>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
            <div><Label>Store name</Label><Input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={3} value={store.description ?? ""} onChange={(e) => setStore({ ...store, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Currency code</Label><Input value={store.currency} onChange={(e) => setStore({ ...store, currency: e.target.value.toUpperCase() })} /></div>
              <div>
                <Label>Primary color</Label>
                <div className="flex gap-2">
                  <Input type="color" className="h-10 w-16 p-1" value={store.primary_color} onChange={(e) => setStore({ ...store, primary_color: e.target.value })} />
                  <Input value={store.primary_color} onChange={(e) => setStore({ ...store, primary_color: e.target.value })} />
                </div>
              </div>
            </div>
            <div><Label>Greeting message</Label><Textarea rows={2} value={store.greeting} onChange={(e) => setStore({ ...store, greeting: e.target.value })} /></div>
            <div className="flex justify-between">
              <Button onClick={saveStore} disabled={saving} className="rounded-full">{saving ? "Saving…" : "Save changes"}</Button>
              <Button variant="destructive" onClick={deleteStore} className="rounded-full"><Trash2 className="mr-1 h-4 w-4" />Delete store</Button>
            </div>
          </div>
          <div ref={previewRef} className="h-[560px]">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</div>
            <ChatWidget
              embedded
              storeId={store.id}
              storeSlug={store.slug}
              storeName={store.name}
              greeting={store.greeting}
              primaryColor={store.primary_color}
              storageKey={`shopassist:preview:${store.id}`}
            />
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsManager storeId={store.id} products={products} setProducts={setProducts} currency={store.currency} />
        </TabsContent>

        <TabsContent value="embed" className="mt-6 max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h3 className="mb-2 font-semibold">Embed snippet</h3>
            <p className="mb-4 text-sm text-muted-foreground">Paste this just before <code className="rounded bg-muted px-1">&lt;/body&gt;</code> on any website.</p>
            <pre className="overflow-x-auto rounded-xl bg-foreground p-4 text-xs text-background">
              <code>{snippet}</code>
            </pre>
            <Button onClick={copy} variant="outline" size="sm" className="mt-3 rounded-full">
              {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              {copied ? "Copied" : "Copy snippet"}
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">Or share the standalone chat URL: <a className="text-primary hover:underline" href={`/c/${store.slug}`} target="_blank">{origin}/c/{store.slug}</a></p>
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="mt-6">
          {conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-8 w-8" />
              No conversations yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {conversations.map((c) => (
                <ConversationRow key={c.id} conv={c} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConversationRow({ conv }: { conv: any }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const load = async () => {
    if (open) return setOpen(false);
    if (!messages.length) {
      const { data } = await supabase.from("messages").select("*").eq("conversation_id", conv.id).order("created_at");
      setMessages(data ?? []);
    }
    setOpen(true);
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <button onClick={load} className="flex w-full items-center justify-between text-left">
        <div>
          <div className="text-sm font-medium">Visitor {conv.visitor_id?.slice(0, 8) || "anon"}</div>
          <div className="text-xs text-muted-foreground">{new Date(conv.created_at).toLocaleString()}</div>
        </div>
        <span className="text-xs text-primary">{open ? "Hide" : "View"}</span>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "mr-auto bg-muted"}`}>
              {m.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductsManager({ storeId, products, setProducts, currency }: {
  storeId: string; products: Product[]; setProducts: (p: Product[]) => void; currency: string;
}) {
  const [showNew, setShowNew] = useState(false);
  const blank = (): Partial<Product> => ({
    name: "", description: "", price: 0, sizes: "", stock_status: "In stock",
    category: "", image_url: "", product_url: "", tags: [],
  });
  const [draft, setDraft] = useState<Partial<Product>>(blank());
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = async () => {
    if (!draft.name || draft.price == null) return;
    if (editingId) {
      const { data, error } = await supabase.from("products").update({
        name: draft.name, description: draft.description, price: Number(draft.price),
        sizes: draft.sizes, stock_status: draft.stock_status ?? "In stock",
        category: draft.category, image_url: draft.image_url, product_url: draft.product_url,
        tags: draft.tags ?? [],
      }).eq("id", editingId).select().single();
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setProducts(products.map((p) => p.id === editingId ? (data as Product) : p));
    } else {
      const { data, error } = await supabase.from("products").insert({
        store_id: storeId, name: draft.name, description: draft.description, price: Number(draft.price),
        sizes: draft.sizes, stock_status: draft.stock_status ?? "In stock",
        category: draft.category, image_url: draft.image_url, product_url: draft.product_url,
        tags: draft.tags ?? [],
      }).select().single();
      if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
      setProducts([data as Product, ...products]);
    }
    setShowNew(false); setEditingId(null); setDraft(blank());
  };

  const remove = async (pid: string) => {
    if (!confirm("Delete this product?")) return;
    await supabase.from("products").delete().eq("id", pid);
    setProducts(products.filter((p) => p.id !== pid));
  };

  const edit = (p: Product) => { setEditingId(p.id); setDraft(p); setShowNew(true); };

  return (
    <div>
      <div className="mb-4 flex justify-between">
        <h3 className="text-lg font-semibold">Catalog</h3>
        <Button onClick={() => { setShowNew(true); setEditingId(null); setDraft(blank()); }} className="rounded-full">
          <Plus className="mr-1 h-4 w-4" />Add product
        </Button>
      </div>

      {showNew && (
        <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-card md:grid-cols-2">
          <div className="md:col-span-2"><Label>Name</Label><Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Description</Label><Textarea rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
          <div><Label>Price ({currency})</Label><Input type="number" step="0.01" value={draft.price ?? 0} onChange={(e) => setDraft({ ...draft, price: parseFloat(e.target.value) })} /></div>
          <div><Label>Sizes (e.g. S, M, L)</Label><Input value={draft.sizes ?? ""} onChange={(e) => setDraft({ ...draft, sizes: e.target.value })} /></div>
          <div><Label>Category</Label><Input value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
          <div>
            <Label>Stock status</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.stock_status ?? "In stock"} onChange={(e) => setDraft({ ...draft, stock_status: e.target.value })}>
              <option>In stock</option><option>Low stock</option><option>Out of stock</option>
            </select>
          </div>
          <div><Label>Image URL</Label><Input value={draft.image_url ?? ""} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} /></div>
          <div><Label>Product URL</Label><Input value={draft.product_url ?? ""} onChange={(e) => setDraft({ ...draft, product_url: e.target.value })} /></div>
          <div className="md:col-span-2 flex gap-2">
            <Button onClick={save} className="rounded-full">{editingId ? "Update" : "Add"} product</Button>
            <Button variant="outline" onClick={() => { setShowNew(false); setEditingId(null); }} className="rounded-full">Cancel</Button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No products yet. Add one to teach the assistant about your catalog.
        </div>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
              <div className="min-w-0">
                <div className="font-medium">{p.name} <span className="text-sm text-muted-foreground">— {currency} {p.price}</span></div>
                <div className="text-xs text-muted-foreground">{p.stock_status}{p.category ? ` · ${p.category}` : ""}{p.sizes ? ` · ${p.sizes}` : ""}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(p)} className="rounded-full">Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)} className="rounded-full text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
