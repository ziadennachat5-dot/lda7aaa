-- DLA7A Supabase Database Schema & Storage Setup
-- 1. CREATORS TABLE
CREATE TABLE IF NOT EXISTS public.creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  handle text,
  platform text DEFAULT 'instagram',
  followers text,
  url text,
  role_ar text,
  role_en text,
  photo_path text,
  visible boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. ORDERS TABLE (with length checks)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  phone text NOT NULL,
  service text NOT NULL,
  notes text,
  lang text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'done', 'cancelled')),
  admin_note text,
  CONSTRAINT orders_name_len CHECK (char_length(name) <= 100),
  CONSTRAINT orders_phone_len CHECK (char_length(phone) <= 30),
  CONSTRAINT orders_notes_len CHECK (notes IS NULL OR char_length(notes) <= 1000)
);

-- 3. ENABLE RLS
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES: CREATORS
DROP POLICY IF EXISTS "Public creators visible" ON public.creators;
CREATE POLICY "Public creators visible" ON public.creators FOR SELECT TO public USING (visible = true);
DROP POLICY IF EXISTS "Admin select all creators" ON public.creators;
CREATE POLICY "Admin select all creators" ON public.creators FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin insert creators" ON public.creators;
CREATE POLICY "Admin insert creators" ON public.creators FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admin update creators" ON public.creators;
CREATE POLICY "Admin update creators" ON public.creators FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin delete creators" ON public.creators;
CREATE POLICY "Admin delete creators" ON public.creators FOR DELETE TO authenticated USING (true);

-- 5. RLS POLICIES: ORDERS
DROP POLICY IF EXISTS "Anon insert orders" ON public.orders;
CREATE POLICY "Anon insert orders" ON public.orders FOR INSERT TO public WITH CHECK (
  char_length(name) <= 100 AND char_length(phone) <= 30 AND (notes IS NULL OR char_length(notes) <= 1000)
);
DROP POLICY IF EXISTS "Admin select orders" ON public.orders;
CREATE POLICY "Admin select orders" ON public.orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin delete orders" ON public.orders;
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE TO authenticated USING (true);

-- 6. STORAGE BUCKET: creators (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('creators', 'creators', true) ON CONFLICT (id) DO NOTHING;

-- 7. STORAGE POLICIES
DROP POLICY IF EXISTS "Public read creators bucket" ON storage.objects;
CREATE POLICY "Public read creators bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'creators');
DROP POLICY IF EXISTS "Admin upload creators bucket" ON storage.objects;
CREATE POLICY "Admin upload creators bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'creators');
DROP POLICY IF EXISTS "Admin update creators bucket" ON storage.objects;
CREATE POLICY "Admin update creators bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'creators');
DROP POLICY IF EXISTS "Admin delete creators bucket" ON storage.objects;
CREATE POLICY "Admin delete creators bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'creators');

-- 8. RECOVERED ACCOUNTS (UNBAN GALLERY) TABLE
CREATE TABLE IF NOT EXISTS public.recovered_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caption_ar text,
  caption_en text,
  photo_path text NOT NULL,
  visible boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.recovered_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view visible recovered accounts" ON public.recovered_accounts;
CREATE POLICY "Public view visible recovered accounts" ON public.recovered_accounts FOR SELECT TO public USING (visible = true);
DROP POLICY IF EXISTS "Admin select all recovered accounts" ON public.recovered_accounts;
CREATE POLICY "Admin select all recovered accounts" ON public.recovered_accounts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin insert recovered accounts" ON public.recovered_accounts;
CREATE POLICY "Admin insert recovered accounts" ON public.recovered_accounts FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admin update recovered accounts" ON public.recovered_accounts;
CREATE POLICY "Admin update recovered accounts" ON public.recovered_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Admin delete recovered accounts" ON public.recovered_accounts;
CREATE POLICY "Admin delete recovered accounts" ON public.recovered_accounts FOR DELETE TO authenticated USING (true);

-- 9. STORAGE BUCKET: unban (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('unban', 'unban', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read unban bucket" ON storage.objects;
CREATE POLICY "Public read unban bucket" ON storage.objects FOR SELECT TO public USING (bucket_id = 'unban');
DROP POLICY IF EXISTS "Admin upload unban bucket" ON storage.objects;
CREATE POLICY "Admin upload unban bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'unban');
DROP POLICY IF EXISTS "Admin update unban bucket" ON storage.objects;
CREATE POLICY "Admin update unban bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'unban');
DROP POLICY IF EXISTS "Admin delete unban bucket" ON storage.objects;
CREATE POLICY "Admin delete unban bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'unban');

