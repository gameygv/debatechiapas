-- Schema completo para debatechiapas Supabase
-- Ejecutar con: ssh supabase-poesis "docker exec -i debatechiapas-db psql -U supabase_admin -d postgres" < scripts/schema.sql

BEGIN;

-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'editor',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  display_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE,
  excerpt text,
  content text,
  featured_image text,
  category_id uuid REFERENCES public.categories(id),
  author_id uuid REFERENCES public.profiles(id),
  status text DEFAULT 'draft',
  is_featured boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_social_push timestamptz
);

CREATE TABLE IF NOT EXISTS public.article_categories (
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.article_tags (
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.ads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text,
  image_url text,
  link_url text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  views integer DEFAULT 0,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.home_banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  position integer,
  image_url text,
  link_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  filename text,
  original_url text,
  sftp_url text,
  file_type text,
  folder text,
  size_bytes bigint,
  transferred_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_editions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  edition_date date NOT NULL UNIQUE,
  pdf_url text NOT NULL,
  cover_image_url text,
  page_count integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- FUNCIONES
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_ad_views(ad_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.ads SET views = views + 1 WHERE id = ad_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.ads SET clicks = clicks + 1 WHERE id = ad_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ad_views(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_ad_clicks(uuid) TO anon, authenticated, service_role;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_editions ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY pub_read_prof ON public.profiles FOR SELECT USING (true);
CREATE POLICY auth_all_prof ON public.profiles FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- articles
CREATE POLICY pub_read_art ON public.articles FOR SELECT USING (status = 'published' OR auth.uid() IS NOT NULL);
CREATE POLICY auth_ins_art ON public.articles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_upd_art ON public.articles FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY auth_del_art ON public.articles FOR DELETE USING (auth.uid() IS NOT NULL);

-- categories
CREATE POLICY pub_read_cat ON public.categories FOR SELECT USING (true);
CREATE POLICY auth_all_cat ON public.categories FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- tags
CREATE POLICY pub_read_tags ON public.tags FOR SELECT USING (true);
CREATE POLICY auth_all_tags ON public.tags FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- article_categories
CREATE POLICY pub_read_ac ON public.article_categories FOR SELECT USING (true);
CREATE POLICY auth_all_ac ON public.article_categories FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- article_tags
CREATE POLICY pub_read_at ON public.article_tags FOR SELECT USING (true);
CREATE POLICY auth_all_at ON public.article_tags FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ads
CREATE POLICY pub_read_ads ON public.ads FOR SELECT USING (is_active = true);
CREATE POLICY auth_all_ads ON public.ads FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- home_banners
CREATE POLICY pub_read_hb ON public.home_banners FOR SELECT USING (true);
CREATE POLICY auth_all_hb ON public.home_banners FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- media_files
CREATE POLICY pub_read_mf ON public.media_files FOR SELECT USING (true);
CREATE POLICY auth_all_mf ON public.media_files FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- daily_editions
CREATE POLICY pub_read_de ON public.daily_editions FOR SELECT USING (is_active = true);
CREATE POLICY auth_all_de ON public.daily_editions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('media', 'media', true, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read media" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Auth upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth update media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);

-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

COMMIT;
