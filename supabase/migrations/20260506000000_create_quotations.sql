/*
  # Quotations — quick manual price quotes (export side, INR only)

  Fully manual: customer details and product/price/quantity are typed in
  directly (no lookup against customers/products tables) — this is for
  fast responses to "what's your price for X" enquiries, not tied to a
  formal customer or catalog record.

  Line items are stored as jsonb on the row itself (not a separate table)
  since a quotation here is never edited line-by-line elsewhere — it's
  written once, previewed, printed, done.

  ## Security
  Same anon-permissive RLS pattern as the rest of this schema.
*/

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number text NOT NULL DEFAULT '',

  customer_name text NOT NULL DEFAULT '',
  company_name text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  address text DEFAULT '',

  -- [{ product_name, price_per_kg, quantity_kg, total }]
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric(14,2) NOT NULL DEFAULT 0,

  validity_days integer NOT NULL DEFAULT 3,
  valid_until date,
  validity_time_of_day text NOT NULL DEFAULT 'evening',

  notes text DEFAULT '',

  issue_date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotations_select" ON quotations FOR SELECT TO anon USING (true);
CREATE POLICY "quotations_insert" ON quotations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "quotations_update" ON quotations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "quotations_delete" ON quotations FOR DELETE TO anon USING (true);