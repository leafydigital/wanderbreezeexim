import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CustomerType = 'Domestic' | 'International';
export type SupplierType = 'Domestic' | 'International';
export type Incoterms = 'FOB' | 'CIF' | 'EXW' | 'CFR' | 'DDP';
export type Currency = 'INR' | 'USD' | 'AED';
export type PIStatus = 'Draft' | 'Sent' | 'Accepted' | 'Cancelled';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
export type OrderType = 'PI' | 'Invoice' | 'General';

export interface Customer {
  id: string;
  customer_name: string;
  company_name: string;
  country: string;
  phone: string;
  email: string;
  address: string;
  type: CustomerType;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  company_name: string;
  location: string;
  phone: string;
  email: string;
  type: SupplierType;
  created_at: string;
  updated_at: string;
}

export interface PILineItem {
  id: string;
  pi_id: string;
  product_name: string;
  hs_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sort_order: number;
}

export interface ProformaInvoice {
  id: string;
  pi_number: string;
  customer_id: string | null;
  issue_date: string;
  valid_until: string | null;
  incoterms: Incoterms;
  currency: Currency;
  country_of_origin: string;
  port_of_loading: string;
  port_of_discharge: string;
  payment_terms: string;
  notes: string;
  status: PIStatus;
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  pi_line_items?: PILineItem[];
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  product_name: string;
  hs_code: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  pi_id: string | null;
  issue_date: string;
  due_date: string | null;
  incoterms: Incoterms;
  currency: Currency;
  country_of_origin: string;
  port_of_loading: string;
  port_of_discharge: string;
  payment_terms: string;
  notes: string;
  status: InvoiceStatus;
  subtotal: number;
  total: number;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  proforma_invoices?: ProformaInvoice;
  invoice_line_items?: InvoiceLineItem[];
}

export interface Expense {
  id: string;
  expense_date: string;
  description: string;
  category: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface PricingCalculation {
  id: string;
  name: string;
  purchasing_price_per_kg: number;
  total_quantity_kg: number;
  profit_percentage: number;
  usd_rate: number;
  aed_rate: number;
  origin_cost_mode: 'detailed' | 'lump_sum';
  // Detailed origin costs
  local_transport: number;
  cha_charges: number;
  cfs_charges: number;
  thc_charges: number;
  documentation_charges: number;
  misc_charges: number;
  fumigation_charges: number;
  // Lump sum
  total_origin_charges: number;
  // CIF costs
  ocean_freight: number;
  marine_insurance: number;
  insurance_auto_calc: boolean;
  thc_in_freight: boolean;
  // Outputs
  product_cost: number;
  origin_cost_total: number;
  profit_amount_inr: number;
  fob_total_inr: number;
  fob_with_profit_inr: number;
  fob_per_kg_inr: number;
  fob_per_kg_usd: number;
  fob_per_kg_aed: number;
  fob_per_bag_inr: number;
  cif_total_inr: number;
  cif_with_profit_inr: number;
  cif_per_kg_inr: number;
  cif_per_kg_usd: number;
  cif_per_kg_aed: number;
  cif_per_bag_inr: number;
  // Legacy fields kept for backward compat
  local_transportation?: number;
  logistics_cost?: number;
  miscellaneous_expenses?: number;
  total_expense_inr?: number;
  total_bill_inr?: number;
  created_at: string;
}

export interface Document {
  id: string;
  order_ref: string;
  order_type: OrderType;
  order_id: string | null;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
}
