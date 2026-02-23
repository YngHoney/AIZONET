-- SUPABASE SCHEMA FOR AIZONET DIRECTORY

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TOOL CATEGORIES
CREATE TABLE IF NOT EXISTS public.tool_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TOOLS
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL,
  detailed_description TEXT,
  category_id UUID REFERENCES public.tool_categories(id),
  pricing_model TEXT NOT NULL CHECK (pricing_model IN ('Free', 'Freemium', 'Paid', 'Free Trial')),
  website_url TEXT NOT NULL,
  affiliate_url TEXT,
  tags TEXT[] DEFAULT '{}',
  logo TEXT,
  featured BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 5.0,
  views INTEGER DEFAULT 0,
  launch_date DATE DEFAULT CURRENT_DATE,
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  use_cases TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BLOG CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ARTICLES (BLOG POSTS)
CREATE TABLE IF NOT EXISTS public.articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL, -- HTML Content
  excerpt TEXT,
  category_id UUID REFERENCES public.categories(id),
  featured_image TEXT,
  author TEXT DEFAULT 'Aizonet Intelligence',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PAGES
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (ROW LEVEL SECURITY)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- HELEPR FUNCTION: CHECK IF USER IS ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- Profiles: Users can view all profiles, but only update their own.
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Tool Categories: Read-only for everyone, Write for Admins
CREATE POLICY "Tool categories are viewable by everyone" ON public.tool_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage tool categories" ON public.tool_categories
  FOR ALL USING (public.is_admin());

-- Tools: Read-only for everyone, Write for Admins
CREATE POLICY "Tools are viewable by everyone" ON public.tools
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage tools" ON public.tools
  FOR ALL USING (public.is_admin());

-- Categories: Read-only for everyone, Write for Admins
CREATE POLICY "Categories are viewable by everyone" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (public.is_admin());

-- Articles: Read-only for everyone, Write for Admins
CREATE POLICY "Articles are viewable by everyone" ON public.articles
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage articles" ON public.articles
  FOR ALL USING (public.is_admin());

-- 6. SITE SETTINGS
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'AIZONET',
  ga4_id TEXT,
  gsc_verification_tag TEXT,
  meta_title TEXT,
  meta_description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT one_row_only CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update site settings" ON public.site_settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can insert site settings" ON public.site_settings
  FOR INSERT WITH CHECK (public.is_admin());

-- Seed initial settings
INSERT INTO public.site_settings (id, site_name, meta_title, meta_description)
VALUES (1, 'AIZONET', 'AIZONET | The Ultimate AI Tools Directory', 'Discover the best AI tools and journals.')
ON CONFLICT (id) DO NOTHING;

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
