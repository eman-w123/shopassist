import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Store as StoreIcon, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  primary_color: string;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("stores").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
        else setStores((data ?? []) as Store[]);
      });
  }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const finalSlug = slug || slugify(name);
    const { data, error } = await supabase.from("stores").insert({
      owner_id: user.id,
      name,
      slug: finalSlug,
      description: desc || null,
    }).select().single();
    setBusy(false);
    if (error) {
      toast({ title: "Couldn't create store", description: error.message, variant: "destructive" });
      return;
    }
    setOpen(false);
    setName(""); setSlug(""); setDesc("");
    navigate(`/dashboard/stores/${data.id}`);
  };

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your stores</h1>
          <p className="text-muted-foreground">Manage your AI assistants and embed them on any site.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-gradient-hero shadow-glow"><Plus className="h-4 w-4" /> New store</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create a store</DialogTitle></DialogHeader>
            <form onSubmit={create} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="n">Store name</Label>
                <Input id="n" required value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s">URL slug</Label>
                <Input id="s" required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
                <p className="text-xs text-muted-foreground">Public URL: /embed/{slug || "your-slug"}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="d">Description</Label>
                <Textarea id="d" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What do you sell?" />
              </div>
              <Button disabled={busy} className="rounded-full bg-gradient-hero">Create store</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-gradient-soft p-12 text-center">
          <StoreIcon className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h2 className="text-xl font-semibold">No stores yet</h2>
          <p className="mt-1 text-muted-foreground">Create your first store to start adding products.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <Link key={s.id} to={`/dashboard/stores/${s.id}`} className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl" style={{ backgroundColor: s.primary_color }} />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{s.name}</div>
                  <div className="truncate text-xs text-muted-foreground">/{s.slug}</div>
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{s.description || "No description yet."}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Manage <ExternalLink className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;