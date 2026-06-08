/*
  # Auth, Roles, User Profiles, and Products - Part 1

  Creates roles (with open RLS initially), user_profiles, and products tables.
  Part 2 will tighten role policies once user_profiles exists.
*/

-- ROLES (open policies first, tightened in part 2)
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_insert" ON roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "roles_update" ON roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roles_delete" ON roles FOR DELETE TO authenticated USING (true);

-- USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow admin to see all profiles (using a simple helper approach)
CREATE POLICY "profiles_admin_select" ON user_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up2
      JOIN roles r ON r.id = up2.role_id
      WHERE up2.id = auth.uid() AND r.name = 'Admin'
    )
  );

CREATE POLICY "profiles_admin_update" ON user_profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up2
      JOIN roles r ON r.id = up2.role_id
      WHERE up2.id = auth.uid() AND r.name = 'Admin'
    )
  )
  WITH CHECK (true);

CREATE POLICY "profiles_admin_delete" ON user_profiles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up2
      JOIN roles r ON r.id = up2.role_id
      WHERE up2.id = auth.uid() AND r.name = 'Admin'
    )
  );

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  hs_code text DEFAULT '',
  description text DEFAULT '',
  category text DEFAULT 'General',
  unit text DEFAULT 'KG',
  purchase_price_per_kg numeric(15,4) DEFAULT 0,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_delete" ON products FOR DELETE TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Seed default roles
INSERT INTO roles (name, description, permissions)
VALUES (
  'Admin',
  'Full access to all modules',
  '{"dashboard":true,"customers":true,"suppliers":true,"proforma":true,"invoices":true,"expenses":true,"pricing":true,"documents":true,"products":true,"users":true,"roles":true}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description, permissions)
VALUES (
  'Staff',
  'Access to operational modules only',
  '{"dashboard":true,"customers":true,"suppliers":true,"proforma":true,"invoices":true,"expenses":false,"pricing":true,"documents":true,"products":true,"users":false,"roles":false}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description, permissions)
VALUES (
  'Viewer',
  'Read-only access to basic modules',
  '{"dashboard":true,"customers":true,"suppliers":false,"proforma":true,"invoices":true,"expenses":false,"pricing":false,"documents":true,"products":true,"users":false,"roles":false}'::jsonb
)
ON CONFLICT (name) DO NOTHING;
