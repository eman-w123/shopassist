import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Store as StoreIcon, ExternalLink, Settings } from "lucide-react";

interface Store {
  id: string; name: string; slug: string; description: string | null;
  primary_color: string; greeting: string; currency: string;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("stores").select("*").eq("owner_id", user.id).order("created_at", { ascending: false });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      setStores(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    let baseSlug = slugify(newName) || "store";
    let slug = baseSlug;
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    }
    const { data, error } = await supabase.from("stores").insert({
      owner_id: user.id, name: newName, slug, description: newDesc,
    }).select().single();
    setCreating(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setStores((s) => [data as Store, ...s]);
    setShowNew(false); setNewName(""); setNewDesc("");
    navigate(`/dashboard/stores/${data.id}`);
  };

  if (authLoading || loading) return <div className="container py-12 text-muted-foreground">Loading…</div>;

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your stores</h1>
          <p className="text-muted-foreground">Manage shop assistants for each of your businesses.</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> New store
        </Button>
      </div>

      {showNew && (
        <form onSubmit={create} className="mb-8 grid gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div>
            <Label>Store name</Label>
            <Input required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Acme Coffee" />
          </div>
          <div>
            <Label>Short description</Label>
            <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="What you sell, your vibe…" rows={3} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={creating} className="rounded-full">{creating ? "Creating…" : "Create store"}</Button>
            <Button type="button" variant="outline" onClick={() => setShowNew(false)} className="rounded-full">Cancel</Button>
          </div>
        </form>
      )}

      {stores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-gradient-soft p-16 text-center">
          <StoreIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">No stores yet. Create your first one to get started.</p>
          <Button onClick={() => setShowNew(true)} className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> Create store
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((s) => (
            <div key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">/{s.slug}</p>
                </div>
                <span className="h-6 w-6 rounded-full" style={{ background: s.primary_color }} />
              </div>
              <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{s.description || "No description"}</p>
              <div className="mt-auto flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1 rounded-full">
                  <Link to={`/dashboard/stores/${s.id}`}><Settings className="mr-1 h-3.5 w-3.5" />Manage</Link>
                </Button>
                <Button asChild size="sm" variant="ghost" className="rounded-full">
                  <Link to={`/c/${s.slug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
