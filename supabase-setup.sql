    -- MASTERUANG SUPABASE SETUP (V2: CODE-ONLY AUTH + ADMIN SYSTEM)

-- 1. Profiles Table (User Sessions)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin')),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Redeem Codes Table (License Keys)
CREATE TABLE IF NOT EXISTS public.redeem_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'premium' CHECK (role IN ('premium', 'admin')),
  duration_value INTEGER DEFAULT 30, -- The numerical value
  duration_unit TEXT DEFAULT 'days' CHECK (duration_unit IN ('minutes', 'hours', 'days')), -- The unit of time
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notifications Table (Broadcast)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'alert')),
  role_target TEXT DEFAULT 'premium', -- Broadcast to specific level
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Transactions Table (Re-setup for new DB)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_code TEXT NOT NULL REFERENCES public.profiles(code) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Disable for internal demo simplification if needed, but here we keep it basic)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeem_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Simple Policies (Granting full access for demo/simplified admin features)
CREATE POLICY "Enable All for Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All for Codes" ON public.redeem_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All for Notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All for Transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable All for AdminVault" ON public.admin_vault FOR ALL USING (true) WITH CHECK (true);

-- 5. Admin Vault (Special for Admin Auth)
CREATE TABLE IF NOT EXISTS public.admin_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- In production, use hashed passwords
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Seed Data
-- Default Admin Access Key
INSERT INTO public.redeem_codes (code, role, duration_days, description)
VALUES ('MASTER-ADMIN-2026', 'admin', 9999, 'Super Admin Access')
ON CONFLICT (code) DO NOTHING;

-- Default Premium Key
INSERT INTO public.redeem_codes (code, role, duration_days, description)
VALUES ('ZEN-PREMIUM-77', 'premium', 30, 'Standard 30 Days License')
ON CONFLICT (code) DO NOTHING;

-- Requested Admin Login
INSERT INTO public.admin_vault (username, password)
VALUES ('admin', '0721')
ON CONFLICT (username) DO NOTHING;
