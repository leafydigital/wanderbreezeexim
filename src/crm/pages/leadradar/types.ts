export type LeadSource  = 'google' | 'osm' | 'ai';
export type LeadStage   = 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed';
export type SearchMode  = 'leads' | 'suppliers';

export interface Lead {
  id?: string;
  user_id?: string;
  name: string;
  email: string | null;       // primary email (first / best)
  emails?: string[];          // all unique emails found (website + Facebook)
  phone: string | null;
  website: string | null;
  address: string | null;
  country: string | null;
  category: string | null;
  rating: string | null;
  source: LeadSource;
  stage?: LeadStage;
  notes?: string | null;
  created_at?: string;
  // Social media links
  linkedin?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  // Supplier-specific fields
  products?: string | null;
  min_order?: string | null;
  certifications?: string | null;
  // joined from users table
  saved_by?: string;
}

export interface SearchParams {
  query: string;
  location: string;
  limit: number;
  useOSM: boolean;
  useGoogle: boolean;
  useClaude: boolean;
  mode: SearchMode;
}

export interface SearchLog {
  id: string;
  user_id: string;
  query: string;
  location: string;
  result_count: number;
  created_at: string;
}

export type SortDir = 'asc' | 'desc';
export type LRPage  = 'search' | 'leads' | 'analytics' | 'outreach';
