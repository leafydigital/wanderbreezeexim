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

export type BuyerType = 'Exporter' | 'Normal Buyer' | 'Bulk Buyer';
export type CustomerSegment = 'General' | 'WBE-Fresh';

export interface Customer {
  id: string;
  customer_name: string;
  company_name: string;
  country: string;
  phone: string;
  email: string;
  address: string;
  type: CustomerType;
  gstin: string;
  tax_id: string;
  // WBE Fresh domestic-buyer fields — only meaningful when type === 'Domestic'.
  shop_name?: string;
  whatsapp_number?: string;
  city?: string;
  district?: string;
  map_location?: string;
  buyer_type?: BuyerType | null;
  // General = no login needed. WBE-Fresh = eligible for a portal login
  // (linked_user_id) that can view final prices and place orders.
  segment?: CustomerSegment;
  linked_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id?: string;
  bank_name: string;
  branch: string;
  account_name: string;
  account_number: string;
  ifsc_code: string;
  swift_code: string;
  qr_code_url?: string | null;
  is_active: boolean;
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
  gst_percentage: number;
  sort_order: number;
}

export type OrderStatus = 'Order Placed' | 'Invoice Generated' | 'Packed' | 'In Transit' | 'Delivered';
export type PaymentStatus = 'Pending' | 'Partial' | 'Paid';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | '';
export type PaymentTermsOption = 'Advance Payment' | 'Fully Paid' | 'On Delivery';

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
  delivery_date?: string | null;
  discount_amount?: number;
  order_status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  advance_amount?: number;
  bank_account_id?: string | null;
}

export type VegetableUnit = 'kg' | 'g' | 'bunch' | 'piece' | 'dozen';
export type PackingUnit = 'Bag' | 'Box' | 'Crate' | 'Sack';

export interface Vegetable {
  id: string;
  name_en: string;
  name_ta: string;
  name_ml: string;
  unit: string;
  image_url: string;
  supplier_price: number;
  margin: number;
  final_price: number;
  is_active: boolean;
  is_approved: boolean;
  suggested_by: string | null;
  sort_order: number;
  // Standard packing this vegetable is ordered in, e.g. "1 Box = 25kg".
  packing_unit: PackingUnit;
  packing_qty: number;
  // True while a supplier's submitted price is awaiting admin's margin review.
  price_locked: boolean;
  previous_final_price: number | null;
  // The published price customers/staff actually see — only changes when
  // Admin clicks "Go Live". supplier_price/margin/final_price above are the
  // working ("draft") numbers Admin/Supplier edit before that.
  live_final_price: number | null;
  previous_live_price: number | null;
  live_updated_at: string | null;
  supplier_updated_by: string | null;
  supplier_updated_at: string | null;
  margin_updated_by: string | null;
  margin_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WbeSettings {
  id: number;
  price_updated_at: string | null;
  valid_till: string | null;
  updated_by?: string | null;
  pending_admin_review?: boolean;
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

export interface QuotationItem {
  product_name: string;
  price_per_kg: number;
  quantity_kg: number;
  total: number;
}

export type QuotationModule = 'export' | 'wbe_fresh';
export type QuotationStatus = 'Created' | 'Sent to Customer' | 'Modified' | 'Approved';

export interface Quotation {
  id: string;
  quote_number: string;
  customer_id: string | null;
  customer_name: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  items: QuotationItem[];
  total_amount: number;
  validity_days: number;
  valid_until: string | null;
  validity_time_of_day: string;
  notes: string;
  payment_terms: string;
  gst_percentage: number;
  issue_date: string;
  created_at: string;
  // WBE Fresh workflow fields — unused by the export side (module stays 'export').
  module?: QuotationModule;
  status?: QuotationStatus;
  created_by?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  converted_to_invoice_id?: string | null;
  customers?: Customer;
  quotation_line_items?: QuotationLineItem[];
}

export interface QuotationLineItem {
  id: string;
  quotation_id: string;
  vegetable_id: string | null;
  product_name: string;
  packing_unit: PackingUnit;
  packing_qty: number;
  units_ordered: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
  vegetables?: Vegetable;
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