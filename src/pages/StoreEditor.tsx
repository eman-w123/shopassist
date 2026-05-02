import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Copy, ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Store {
  id: string; name: string; slug: string; description: string | null;
  primary_color: string; greeting: string; currency: string;
}
interface Product {
  id: string; store_id: string; name: string; description: string | null;
  price: number; sizes: string | null; stock_status: string;
  category: string | null; image_url: string | null; product_url: string | null; tags: string[];
}

const empty: Omit<Product, "id" | "store_id"> = {
  name: "", description: "", price: 0, sizes: "", stock_status: "In stock",
  category: "", image_url: "", product_url: "", tags: [],
};

const StoreEditor = () => {
  const { id } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // product form
  const [pOpen, setPOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pf, setPf] = useState({ ...empty });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const reload = async () => {
    if (!id) return;
    const { data: s } = await supabase.from("stores").select("*").eq("id", id).maybeSingle();
    setStore(s as Store | null);
    const { data: p } = await supabase.from("products").select("*").eq("store_id", id).order("created_at");
    setProducts((p ?? []) as Product[]);
  };
  useEffect(() => { reload(); }, [id]);

  if (!store) return <div className="container py-10 text-muted-foreground">Loading…</div>;

  const saveStore = async () => {
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      name: store.name, description: store.description, primary_color: store.primary_color,
      greeting: store.greeting, currency: store.currency,
    }).eq("id", store.id);
    setSaving(false);
    toast({ title: error ? "Save failed" : "Saved", description: error?.message });
  };

  const openNewProduct = () => { setEditing(null); setPf({ ...empty }); setPOpen(true); };
  const openEditProduct = (p: Product) => {
    setEditing(p);
    setPf({
      name: p.name, description: p.description ?? "", price: Number(p.price),
      sizes: p.sizes ?? "", stock_status: p.stock_status, category: p.category ?? "",
      image_url: p.image_url ?? "", product_url: p.product_url ?? "", tags: p.tags ?? [],
    });
    setPOpen(true);
  };
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...pf,
      description: pf.description || null,
      sizes: pf.sizes || null,
      category: pf.category || null,
      image_url: pf.image_url || null,
      product_url: pf.product_url || null,
      store_id: store.id,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    setPOpen(false); reload();
  };
  const delProduct = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    await supabase.from("products").delete().eq("id", p.id);
    reload();
  };
  const delStore = async () => {
    if (!confirm(`Delete store "${store.name}" and all its products?`)) return;
    await supabase.from("stores").delete().eq("id", store.id);
    navigate("/dashboard");
  };

  const embedUrl = `${window.location.origin}/widget.js`;
  const snippet = `<script src="${embedUrl}" data-store="${store.slug}" defer></script>`;
  const copy = async () => { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="container py-10">
      <Link to="/dashboard" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All stores
      </Link>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">/{store.slug}</p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link to={`/embed/${store.slug}`} target="_blank">Preview <ExternalLink className="h-4 w-4" /></Link>
        </Button>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="settings">Branding</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button onClick={openNewProduct} className="rounded-full"><Plus className="h-4 w-4" /> Add product</Button>
          </div>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No products yet.</div>
          ) : (
            <div className="grid gap-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  ) : <div className="h-14 w-14 rounded-lg bg-muted" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {store.currency} {Number(p.price).toLocaleString()} · {p.stock_status}
                      {p.sizes && ` · ${p.sizes}`}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEditProduct(p)}>Edit</Button>
                  <Button variant="ghost" size="icon" onClick={() => delProduct(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}

          <Dialog open={pOpen} onOpenChange={setPOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
              <form onSubmit={saveProduct} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input required value={pf.name} onChange={(e) => setPf({ ...pf, name: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Price ({store.currency})</Label>
                  <Input type="number" step="0.01" min="0" required value={pf.price} onChange={(e) => setPf({ ...pf, price: parseFloat(e.target.value || "0") })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Stock</Label>
                  <Select value={pf.stock_status} onValueChange={(v) => setPf({ ...pf, stock_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In stock">In stock</SelectItem>
                      <SelectItem value="Low stock">Low stock</SelectItem>
                      <SelectItem value="Out of stock">Out of stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Sizes</Label>
                  <Input value={pf.sizes} onChange={(e) => setPf({ ...pf, sizes: e.target.value })} placeholder="S, M, L" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Category</Label>
                  <Input value={pf.category} onChange={(e) => setPf({ ...pf, category: e.target.value })} placeholder="Tops" />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <Label>Image URL</Label>
                  <Input value={pf.image_url} onChange={(e) => setPf({ ...pf, image_url: e.target.value })} placeholder="https://…" />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <Label>Product URL</Label>
                  <Input value={pf.product_url} onChange={(e) => setPf({ ...pf, product_url: e.target.value })} placeholder="https://yourstore.com/products/…" />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <Label>Description</Label>
                  <Textarea rows={3} value={pf.description} onChange={(e) => setPf({ ...pf, description: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2">
                  <Label>Tags (comma separated)</Label>
                  <Input value={pf.tags.join(", ")} onChange={(e) => setPf({ ...pf, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" className="rounded-full">{editing ? "Save changes" : "Add product"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-5 rounded-2xl border border-border bg-card p-6 sm:max-w-xl">
            <div className="flex flex-col gap-2">
              <Label>Store name</Label>
              <Input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea rows={3} value={store.description ?? ""} onChange={(e) => setStore({ ...store, description: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Currency</Label>
                <Input value={store.currency} onChange={(e) => setStore({ ...store, currency: e.target.value.toUpperCase().slice(0, 5) })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Primary color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={store.primary_color} onChange={(e) => setStore({ ...store, primary_color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-md border border-border bg-background" />
                  <Input value={store.primary_color} onChange={(e) => setStore({ ...store, primary_color: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Welcome message</Label>
              <Textarea rows={2} value={store.greeting} onChange={(e) => setStore({ ...store, greeting: e.target.value })} />
            </div>
            <div className="flex justify-between gap-3">
              <Button variant="ghost" onClick={delStore} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" /> Delete store
              </Button>
              <Button onClick={saveStore} disabled={saving} className="rounded-full bg-gradient-hero">
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="embed" className="mt-6">
          <div className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:max-w-2xl">
            <div>
              <h3 className="font-semibold">Embed snippet</h3>
              <p className="text-sm text-muted-foreground">Paste this just before <code>&lt;/body&gt;</code> on any website.</p>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-foreground p-4 text-xs leading-relaxed text-background">
              <code>{snippet}</code>
            </pre>
            <div>
              <Button onClick={copy} variant="outline" className="rounded-full">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy snippet"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The widget loads in an iframe and works on any HTML site. The shopper's chat is private to your store.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoreEditor;