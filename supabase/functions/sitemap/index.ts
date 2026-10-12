// @ts-nocheck
// supabase/functions/sitemap/index.ts
//
// Live sitemap.xml: every active product in sc_product_categories is listed
// automatically the moment it is added in the CRM — no manual editing.
//
// Deploy:  supabase functions deploy sitemap --no-verify-jwt
// Served at https://www.wanderbreezeexim.com/sitemap.xml via public/_redirects

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE = "https://www.wanderbreezeexim.com";

// Hand-coded pages in src/App.tsx (not stored in the database)
const STATIC_PAGES = [
  { path: "/", priority: "1.00" },
  { path: "/terms-conditions", priority: "0.50" },
  { path: "/privacy-policy", priority: "0.50" },
];

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const day = (d?: string | null) => (d ? new Date(d) : new Date()).toISOString().slice(0, 10);

function entry(path: string, lastmod: string, priority: string) {
  return `  <url>
    <loc>${esc(SITE + path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data } = await supabase
    .from("sc_product_categories")
    .select("slug, updated_at, created_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const today = day();
  const seen = new Set<string>();
  const urls: string[] = [];
  const add = (path: string, lastmod: string, priority: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    urls.push(entry(path, lastmod, priority));
  };

  for (const p of STATIC_PAGES.slice(0, 1)) add(p.path, today, p.priority);
  for (const p of data || []) if (p.slug) add(`/products/${p.slug}`, day(p.updated_at || p.created_at), "0.80");
  for (const p of STATIC_PAGES.slice(1)) add(p.path, today, p.priority);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n\n")}
</urlset>
`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
});