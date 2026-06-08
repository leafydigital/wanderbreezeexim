import type { Lead, SearchMode } from './types';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ─────────────────────────────────────────────────────────────
// Primary search — Edge Function handles all sources
// ─────────────────────────────────────────────────────────────
export async function runSearch(params: {
  query: string;
  location: string;
  limit: number;
  mode: SearchMode;
  onProgress?: (src: string, done: boolean) => void;
}): Promise<Lead[]> {
  const { query, location, limit, mode, onProgress } = params;

  onProgress?.('google', false);
  onProgress?.('claude', false);
  onProgress?.('web',    false);

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/lead-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ query, location, limit, mode }),
    });

    onProgress?.('google', true);
    onProgress?.('claude', true);
    onProgress?.('web',    true);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[lead-search edge]', err);
      return [];
    }

    const data = await res.json();
    return (data.results || []) as Lead[];
  } catch (e) {
    console.error('[lead-search edge]', e);
    onProgress?.('google', true);
    onProgress?.('claude', true);
    onProgress?.('web',    true);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// ENRICH BATCH — send leads to Edge Function for email + socials
// Processes in batches of 5 for faster throughput
// ─────────────────────────────────────────────────────────────
export async function enrichBatch(
  leads: { name: string; website: string | null }[],
  location: string,
): Promise<{ email: string | null; emails: string[]; linkedin: string | null; facebook: string | null; instagram: string | null; twitter: string | null; tiktok: string | null; youtube: string | null }[]> {
  const empty = { email: null, emails: [], linkedin: null, facebook: null, instagram: null, twitter: null, tiktok: null, youtube: null };
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/lead-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({
        action:   'enrich-batch',
        leads:    leads.map(l => ({ name: l.name, website: l.website })),
        location,
      }),
    });
    if (!res.ok) return leads.map(() => empty);
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      email:     r.email     || null,
      emails:    Array.isArray(r.emails) ? r.emails : (r.email ? [r.email] : []),
      linkedin:  r.linkedin  || null,
      facebook:  r.facebook  || null,
      instagram: r.instagram || null,
      twitter:   r.twitter   || null,
      tiktok:    r.tiktok    || null,
      youtube:   r.youtube   || null,
    }));
  } catch {
    return leads.map(() => empty);
  }
}
