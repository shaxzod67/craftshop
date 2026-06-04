-- ============================================================
-- CraftShop Supabase Schema
-- ============================================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  bio TEXT,
  address TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SELLER PROFILES (extra data for sellers)
-- ============================================================
CREATE TABLE public.seller_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_description TEXT,
  shop_banner_url TEXT,
  shop_logo_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  bank_account TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_uz TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES public.categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, name_uz, slug, icon) VALUES
  ('Ceramics', 'Keramika', 'ceramics', '🏺'),
  ('Textiles', 'To''qimachilik', 'textiles', '🧵'),
  ('Woodwork', 'Yog''och o''ymakorligi', 'woodwork', '🪵'),
  ('Embroidery', 'Kashtachilik', 'embroidery', '🪡'),
  ('Jewelry', 'Zargarlik', 'jewelry', '💍'),
  ('Paintings', 'Rassomchilik', 'paintings', '🎨'),
  ('Leather', 'Charm buyumlar', 'leather', '👜'),
  ('Metalwork', 'Metallarga ishlov berish', 'metalwork', '⚒️'),
  ('Calligraphy', 'Xattotlik', 'calligraphy', '✍️'),
  ('Miniature', 'Miniatyura', 'miniature', '🖼️');

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  discount_price DECIMAL(12,2),
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  weight DECIMAL(8,2),
  dimensions TEXT,
  material TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCT REVIEWS
-- ============================================================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, buyer_id)
);

-- ============================================================
-- CART
-- ============================================================
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)
);

-- ============================================================
-- WISHLIST
-- ============================================================
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, product_id)
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id),
  total_amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  shipping_address JSONB NOT NULL,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  notes TEXT,
  tracking_number TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES (Buyer <-> Seller chat)
-- ============================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, self write
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Seller profiles: public read
CREATE POLICY "seller_profiles_select" ON public.seller_profiles FOR SELECT USING (true);
CREATE POLICY "seller_profiles_insert" ON public.seller_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "seller_profiles_update" ON public.seller_profiles FOR UPDATE USING (auth.uid() = id);

-- Products: public read, seller write own
CREATE POLICY "products_select" ON public.products FOR SELECT USING (is_active = true OR seller_id = auth.uid());
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- Reviews: buyers write their own
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (auth.uid() = buyer_id);

-- Cart: own only
CREATE POLICY "cart_select" ON public.cart_items FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "cart_insert" ON public.cart_items FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "cart_update" ON public.cart_items FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "cart_delete" ON public.cart_items FOR DELETE USING (auth.uid() = buyer_id);

-- Wishlist: own only
CREATE POLICY "wishlist_select" ON public.wishlists FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "wishlist_insert" ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "wishlist_delete" ON public.wishlists FOR DELETE USING (auth.uid() = buyer_id);

-- Orders: buyer sees own, seller sees items for their products
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "order_items_select" ON public.order_items FOR SELECT
  USING (auth.uid() = seller_id OR order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid()));
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_update" ON public.order_items FOR UPDATE USING (auth.uid() = seller_id);

-- Messages
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Notifications
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update product rating after review
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET
    rating = (SELECT AVG(rating) FROM public.reviews WHERE product_id = NEW.product_id),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = NEW.product_id)
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_rating();

-- Categories public read (no RLS needed)
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
