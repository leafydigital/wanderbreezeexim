/*
  # Update pricing_calculations table for v2 calculator

  Adds new columns to support:
  - Detailed vs lump-sum origin cost modes
  - Individual origin cost line items (CHA, CFS, THC, docs, misc, fumigation)
  - CIF-specific costs (ocean freight, marine insurance)
  - THC-in-freight toggle flag
  - Output fields for CIF totals with profit
  - Keeps all existing columns for backward compatibility
*/

DO $$ BEGIN
  -- Origin cost mode flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='origin_cost_mode') THEN
    ALTER TABLE pricing_calculations ADD COLUMN origin_cost_mode text NOT NULL DEFAULT 'lump_sum' CHECK (origin_cost_mode IN ('detailed', 'lump_sum'));
  END IF;

  -- Detailed origin cost fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='local_transport') THEN
    ALTER TABLE pricing_calculations ADD COLUMN local_transport numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='cha_charges') THEN
    ALTER TABLE pricing_calculations ADD COLUMN cha_charges numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='cfs_charges') THEN
    ALTER TABLE pricing_calculations ADD COLUMN cfs_charges numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='thc_charges') THEN
    ALTER TABLE pricing_calculations ADD COLUMN thc_charges numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='documentation_charges') THEN
    ALTER TABLE pricing_calculations ADD COLUMN documentation_charges numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='misc_charges') THEN
    ALTER TABLE pricing_calculations ADD COLUMN misc_charges numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='fumigation_charges') THEN
    ALTER TABLE pricing_calculations ADD COLUMN fumigation_charges numeric DEFAULT 0;
  END IF;

  -- Lump sum origin cost
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='total_origin_charges') THEN
    ALTER TABLE pricing_calculations ADD COLUMN total_origin_charges numeric DEFAULT 0;
  END IF;

  -- CIF costs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='ocean_freight') THEN
    ALTER TABLE pricing_calculations ADD COLUMN ocean_freight numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='marine_insurance') THEN
    ALTER TABLE pricing_calculations ADD COLUMN marine_insurance numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='insurance_auto_calc') THEN
    ALTER TABLE pricing_calculations ADD COLUMN insurance_auto_calc boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='thc_in_freight') THEN
    ALTER TABLE pricing_calculations ADD COLUMN thc_in_freight boolean DEFAULT false;
  END IF;

  -- Additional output fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='product_cost') THEN
    ALTER TABLE pricing_calculations ADD COLUMN product_cost numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='origin_cost_total') THEN
    ALTER TABLE pricing_calculations ADD COLUMN origin_cost_total numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='fob_total_inr') THEN
    ALTER TABLE pricing_calculations ADD COLUMN fob_total_inr numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='fob_with_profit_inr') THEN
    ALTER TABLE pricing_calculations ADD COLUMN fob_with_profit_inr numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='cif_total_inr') THEN
    ALTER TABLE pricing_calculations ADD COLUMN cif_total_inr numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='cif_with_profit_inr') THEN
    ALTER TABLE pricing_calculations ADD COLUMN cif_with_profit_inr numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='fob_per_bag_inr') THEN
    ALTER TABLE pricing_calculations ADD COLUMN fob_per_bag_inr numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='cif_per_bag_inr') THEN
    ALTER TABLE pricing_calculations ADD COLUMN cif_per_bag_inr numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='cif_per_kg_usd') THEN
    ALTER TABLE pricing_calculations ADD COLUMN cif_per_kg_usd numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='pricing_calculations' AND column_name='cif_per_kg_aed') THEN
    ALTER TABLE pricing_calculations ADD COLUMN cif_per_kg_aed numeric DEFAULT 0;
  END IF;
END $$;
