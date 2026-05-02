import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatWidget from "@/components/ChatWidget";

interface Store {
  slug: string; name: string; greeting: string; primary_color: string;
}

/**
 * Public widget page. Loaded standalone OR inside an iframe from /widget.js.
 * URL: /embed/:slug
 */
const EmbedView = () => {
  const { slug } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    supabase.from("stores").select("slug,name,greeting,primary_color").eq("slug", slug).maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else {
          setStore(data as Store);
          try { window.parent?.postMessage({ type: "shopassist:color", color: (data as Store).primary_color }, "*"); } catch {}
        }
      });
  }, [slug]);

  if (notFound) {
    return <div className="grid h-screen place-items-center bg-background p-6 text-center text-sm text-muted-foreground">Store not found.</div>;
  }
  if (!store) return <div className="grid h-screen place-items-center bg-background text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="h-screen w-screen bg-transparent">
      <ChatWidget
        embedded
        storeSlug={store.slug}
        storeName={store.name}
        greeting={store.greeting}
        primaryColor={store.primary_color}
      />
    </div>
  );
};

export default EmbedView;