/**
 * supabase/functions/market-intel/index.ts
 *
 * Dual-purpose edge function:
 *  1. GET  — returns cached intelligence from wbe_market_intel table (fast, ~50ms)
 *  2. POST — regenerates intelligence via Claude, stores in DB, returns fresh data
 *
 * Called from Dashboard.tsx via:
 *   GET  ${SUPABASE_URL}/functions/v1/market-intel   → load cached
 *   POST ${SUPABASE_URL}/functions/v1/market-intel   → force refresh
 *
 * Also called by pg_cron daily at 6 AM IST (POST with empty body).
 *
 * Env vars (set in Supabase Edge Functions → Secrets):
 *   ANTHROPIC_API_KEY  — already set (used by lead-search)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

const OUR_PRODUCTS = [
  { name: 'Black Pepper',   hsCode: '0904.11', emoji: '⚫' },
  { name: 'Green Cardamom', hsCode: '0908.31', emoji: '🌿' },
  { name: 'Fresh Coconut',  hsCode: '0801.11', emoji: '🥥' },
  { name: 'Onion',          hsCode: '0703.10', emoji: '🧅' },
  { name: 'Green Chilli',   hsCode: '0709.60', emoji: '🌶' },
  { name: 'G9 Banana',      hsCode: '0803.90', emoji: '🍌' },
  { name: 'Moringa',        hsCode: '0712.90', emoji: '🌱' },
  { name: 'Pomegranate',    hsCode: '0810.10', emoji: '🔴' },
];

async function callClaude(prompt: string): Promise<string> {
  if (!ANTHROPIC_KEY) throw new Error('ANTHROPIC_API_KEY not set in edge function secrets');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function generateIntel(): Promise<Record<string, unknown>> {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const productsStr = OUR_PRODUCTS.map(p => `${p.name} (HS ${p.hsCode})`).join(', ');

  const prompt = `You are a trade intelligence assistant for Wander Breeze Exim Pvt Ltd, a Kerala-based agricultural exporter in India.
Today is ${today}. Company: Trivandrum, Kerala.
Our products: ${productsStr}
Export markets: UAE, Qatar, Saudi Arabia, Kuwait, Oman, Germany, Netherlands, UK, Australia, USA, Sweden.
Domestic focus: Kerala and Tamil Nadu — Trivandrum city and surrounding districts.

Generate a comprehensive daily intelligence JSON report. Return ONLY valid JSON — no markdown fences, no explanation, no preamble.

{
  "briefing": "2-3 sentence morning briefing for Ram (founder). Mention one specific price movement or demand shift. Be direct and actionable.",

  "prices": [
    {
      "name": "Black Pepper",
      "grade": "MG1",
      "priceInr": "680-720",
      "priceUsd": "8.15-8.65",
      "trend": "up",
      "trendPct": "+2.1%",
      "source": "APMC Kochi",
      "hsCode": "0904.11"
    }
  ],

  "demand": [
    {
      "product": "Black Pepper",
      "country": "Germany",
      "flag": "DE",
      "demandPct": 87,
      "volumeMT": "2400 MT/month",
      "topImporter": "Raps GmbH",
      "notes": "Guatemala shortfall boosting Indian pepper premium by 12%",
      "blVerified": true
    }
  ],

  "domestic": [
    {
      "product": "Moringa",
      "market": "Trivandrum Hotels & Restaurants",
      "avgRate": "45-55",
      "demand": "High",
      "season": "Year-round",
      "notes": "Star hotels pay premium for certified supply. Health-conscious segment growing.",
      "action": "Approach Vivanta by Taj, Hotel Leela, Hotel Pankaj"
    }
  ],

  "importers": [
    {
      "company": "NRTC Group",
      "country": "UAE",
      "countryCode": "AE",
      "product": "Green Chilli",
      "email": "imports@nrtc.ae",
      "phone": "+971-4-295-3000",
      "verifiedBL": true,
      "lastShipment": "May 2025",
      "volumeMT": "60-80 MT/month"
    }
  ]
}

Strict rules:
- prices array: exactly 8 entries, one per product, realistic current Kerala/TN mandi wholesale prices in INR/kg
- demand array: exactly 10 entries, different product+country pairs, realistic demand percentages based on actual Indian export share
- domestic array: exactly 5 entries for Kerala/TN B2B — hotels, supermarkets, traders, restaurants, wholesale markets
- importers array: exactly 5 entries — verified active GCC/European importers with real-looking contact details
- flag field: use 2-letter ISO country code only (e.g. "DE" not "🇩🇪") — frontend will convert
- trend: only "up", "down", or "stable"
- demand values: only "High", "Medium", or "Low"
- All prices realistic for June 2026 Indian agricultural market`;

  const raw = await callClaude(prompt);
  let cleaned = raw.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');

  // Find the JSON object
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) cleaned = cleaned.slice(start, end + 1);

  return JSON.parse(cleaned);
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // ── GET: return cached data from DB ──────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('wbe_market_intel')
      .select('*')
      .eq('id', 'latest')
      .single();

    if (error || !data) {
      return json({ error: 'No cached data — call POST to generate', cached: false }, 404);
    }

    return json({ ...data, cached: true });
  }

  // ── POST: regenerate and cache ────────────────────────────────
  if (req.method === 'POST') {
    console.log('[market-intel] Generating fresh intelligence...');

    try {
      const parsed = await generateIntel();

      const { error: upsertErr } = await supabase
        .from('wbe_market_intel')
        .upsert({
          id:           'latest',
          briefing:     parsed.briefing,
          prices:       parsed.prices,
          demand:       parsed.demand,
          domestic:     parsed.domestic,
          importers:    parsed.importers,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (upsertErr) {
        console.error('[market-intel] DB upsert error:', upsertErr.message);
        // Still return the data even if DB save failed
        return json({ ...parsed, cached: false, generated_at: new Date().toISOString(), dbError: upsertErr.message });
      }

      console.log('[market-intel] ✅ Intelligence updated and cached');
      return json({ ...parsed, cached: false, generated_at: new Date().toISOString() });

    } catch (e: any) {
      console.error('[market-intel] ❌ Error:', e.message);
      return json({ error: e.message }, 500);
    }
  }

  return json({ error: 'Method not allowed' }, 405);
});
