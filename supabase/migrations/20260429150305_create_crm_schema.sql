/*
  # Wander Breeze Exim CRM - Initial Schema

  ## Overview
  Complete CRM schema for an export business including customers, suppliers,
  proforma invoices, invoices, expenses, pricing calculations, and documents.

  ## Tables Created

  1. **customers** - Customer records with domestic/international classification
  2. **suppliers** - Supplier records
  3. **proforma_invoices** - PI records linked to customers
  4. **pi_line_items** - Individual product lines on a PI
  5. **invoices** - Final invoices linked to customers and optional PI
  6. **invoice_line_items** - Individual product lines on an invoice
  7. **expenses** - Expense tracking records
  8. **pricing_calculations** - FOB/CIF price calculator saved results
  9. **documents** - Order-linked document storage metadata

  ## Security
  - RLS enabled on all tables
  - Policies allow all operations for anonymous users (single-tenant app with no auth)
    using a permissive but consistent pattern
*/

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'International' CHECK (type IN ('Domestic', 'International')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON customers FOR SELECT TO anon USING (true);
CREATE POLICY "customers_insert" ON customers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "customers_update" ON customers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "customers_delete" ON customers FOR DELETE TO anon USING (true);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'Domestic' CHECK (type IN ('Domestic', 'International')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suppliers_select" ON suppliers FOR SELECT TO anon USING (true);
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE TO anon USING (true);

-- PROFORMA INVOICES
CREATE TABLE IF NOT EXISTS proforma_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_number text NOT NULL DEFAULT '',
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  valid_until date,
  incoterms text DEFAULT 'FOB' CHECK (incoterms IN ('FOB', 'CIF', 'EXW', 'CFR', 'DDP')),
  currency text DEFAULT 'USD' CHECK (currency IN ('INR', 'USD', 'AED')),
  country_of_origin text DEFAULT 'India',
  port_of_loading text DEFAULT '',
  port_of_discharge text DEFAULT '',
  payment_terms text DEFAULT '',
  notes text DEFAULT '',
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Cancelled')),
  subtotal numeric(15,2) DEFAULT 0,
  total numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE proforma_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pi_select" ON proforma_invoices FOR SELECT TO anon USING (true);
CREATE POLICY "pi_insert" ON proforma_invoices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "pi_update" ON proforma_invoices FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "pi_delete" ON proforma_invoices FOR DELETE TO anon USING (true);

-- PI LINE ITEMS
CREATE TABLE IF NOT EXISTS pi_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pi_id uuid NOT NULL REFERENCES proforma_invoices(id) ON DELETE CASCADE,
  product_name text NOT NULL DEFAULT '',
  hs_code text DEFAULT '',
  description text DEFAULT '',
  quantity numeric(15,3) DEFAULT 0,
  unit text DEFAULT 'KG',
  unit_price numeric(15,4) DEFAULT 0,
  total_price numeric(15,2) DEFAULT 0,
  sort_order integer DEFAULT 0
);

ALTER TABLE pi_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pi_items_select" ON pi_line_items FOR SELECT TO anon USING (true);
CREATE POLICY "pi_items_insert" ON pi_line_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "pi_items_update" ON pi_line_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "pi_items_delete" ON pi_line_items FOR DELETE TO anon USING (true);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL DEFAULT '',
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  pi_id uuid REFERENCES proforma_invoices(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  incoterms text DEFAULT 'FOB' CHECK (incoterms IN ('FOB', 'CIF', 'EXW', 'CFR', 'DDP')),
  currency text DEFAULT 'USD' CHECK (currency IN ('INR', 'USD', 'AED')),
  country_of_origin text DEFAULT 'India',
  port_of_loading text DEFAULT '',
  port_of_discharge text DEFAULT '',
  payment_terms text DEFAULT '',
  notes text DEFAULT '',
  status text DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled')),
  subtotal numeric(15,2) DEFAULT 0,
  total numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select" ON invoices FOR SELECT TO anon USING (true);
CREATE POLICY "invoices_insert" ON invoices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "invoices_update" ON invoices FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "invoices_delete" ON invoices FOR DELETE TO anon USING (true);

-- INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_name text NOT NULL DEFAULT '',
  hs_code text DEFAULT '',
  description text DEFAULT '',
  quantity numeric(15,3) DEFAULT 0,
  unit text DEFAULT 'KG',
  unit_price numeric(15,4) DEFAULT 0,
  total_price numeric(15,2) DEFAULT 0,
  sort_order integer DEFAULT 0
);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inv_items_select" ON invoice_line_items FOR SELECT TO anon USING (true);
CREATE POLICY "inv_items_insert" ON invoice_line_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "inv_items_update" ON invoice_line_items FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "inv_items_delete" ON invoice_line_items FOR DELETE TO anon USING (true);

-- EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL DEFAULT '',
  category text DEFAULT 'General',
  amount numeric(15,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON expenses FOR SELECT TO anon USING (true);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE TO anon USING (true);

-- PRICING CALCULATIONS (FOB/CIF)
CREATE TABLE IF NOT EXISTS pricing_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  purchasing_price_per_kg numeric(15,4) DEFAULT 0,
  total_quantity_kg numeric(15,3) DEFAULT 0,
  local_transportation numeric(15,2) DEFAULT 0,
  logistics_cost numeric(15,2) DEFAULT 0,
  miscellaneous_expenses numeric(15,2) DEFAULT 0,
  profit_percentage numeric(6,2) DEFAULT 0,
  usd_rate numeric(10,4) DEFAULT 0,
  aed_rate numeric(10,4) DEFAULT 0,
  -- calculated outputs
  total_expense_inr numeric(15,2) DEFAULT 0,
  total_bill_inr numeric(15,2) DEFAULT 0,
  profit_amount_inr numeric(15,2) DEFAULT 0,
  fob_per_kg_inr numeric(15,4) DEFAULT 0,
  fob_per_kg_usd numeric(15,6) DEFAULT 0,
  fob_per_kg_aed numeric(15,6) DEFAULT 0,
  cif_per_kg_inr numeric(15,4) DEFAULT 0,
  cif_per_kg_usd numeric(15,6) DEFAULT 0,
  cif_per_kg_aed numeric(15,6) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pricing_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_select" ON pricing_calculations FOR SELECT TO anon USING (true);
CREATE POLICY "pricing_insert" ON pricing_calculations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "pricing_update" ON pricing_calculations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "pricing_delete" ON pricing_calculations FOR DELETE TO anon USING (true);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref text NOT NULL DEFAULT '',
  order_type text DEFAULT 'PI' CHECK (order_type IN ('PI', 'Invoice', 'General')),
  order_id uuid,
  document_type text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  file_size integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_select" ON documents FOR SELECT TO anon USING (true);
CREATE POLICY "docs_insert" ON documents FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "docs_update" ON documents FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "docs_delete" ON documents FOR DELETE TO anon USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pi_customer ON proforma_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_pi_status ON proforma_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_documents_order ON documents(order_id);
