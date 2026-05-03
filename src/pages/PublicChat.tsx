import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatWidget from "@/components/ChatWidget";

export default function PublicChat() {
  const { slug } = useParams();
  const [store, setStore] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
      if (!data) setNotFound(true); else setStore(data);
    })();
  }, [slug]);

  if (notFound) return <div className="grid min-h-screen place-items-center text-muted-foreground">Store not found.</div>;
  if (!store) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;

  return (
    <div className="h-screen w-screen">
      <ChatWidget
        embedded
        storeId={store.id}
        storeSlug={store.slug}
        storeName={store.name}
        greeting={store.greeting}
        primaryColor={store.primary_color}
      />
    </div>
  );
}
