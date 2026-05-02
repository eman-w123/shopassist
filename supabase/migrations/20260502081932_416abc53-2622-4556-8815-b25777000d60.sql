-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Stores
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  primary_color TEXT NOT NULL DEFAULT '#7c3aed',
  greeting TEXT NOT NULL DEFAULT 'Hi! How can I help you today?',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stores_owner ON public.stores(owner_id);
CREATE INDEX idx_stores_slug ON public.stores(slug);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores are viewable by everyone"
  ON public.stores FOR SELECT USING (true);
CREATE POLICY "Owners can insert their own stores"
  ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own stores"
  ON public.stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own stores"
  ON public.stores FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sizes TEXT,
  stock_status TEXT NOT NULL DEFAULT 'In stock',
  category TEXT,
  image_url TEXT,
  product_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_store ON public.products(store_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT USING (true);
CREATE POLICY "Owners can insert products in their stores"
  ON public.products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Owners can update products in their stores"
  ON public.products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "Owners can delete products in their stores"
  ON public.products FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  visitor_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_conversations_store ON public.conversations(store_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create conversations"
  ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view their store conversations"
  ON public.conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert messages"
  ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view messages in their store conversations"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.stores s ON s.id = c.store_id
    WHERE c.id = conversation_id AND s.owner_id = auth.uid()
  ));