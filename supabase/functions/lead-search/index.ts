// @ts-nocheck
// LeadRadar Edge Function — v3 (Fixed grid, email generation, location filter)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildGoogleQueries(query: string, location: string, mode: string): string[] {
  const q = query.trim();
  const loc = location.trim();
  const isSupplier = mode === "suppliers";
  const base: string[] = [];
  if (isSupplier) {
    base.push(
      `${q} importer ${loc}`, `${q} wholesaler ${loc}`, `${q} trader ${loc}`,
      `${q} distributor ${loc}`, `${q} exporter ${loc}`, `${q} supplier ${loc}`,
      `${q} company ${loc}`, `${q} international ${loc}`,
      `${q} BV ${loc}`, `${q} GmbH ${loc}`, `${q} Ltd ${loc}`, `${q} SAS ${loc}`,
    );
  } else {
    base.push(
      `${q} in ${loc}`, `${q} near ${loc}`, `${q} ${loc} city center`,
      `${q} ${loc} north`, `${q} ${loc} south`, `${q} ${loc} east`,
      `${q} ${loc} west`, `${q} ${loc} downtown`, `${q} ${loc} suburb`,
      `best ${q} in ${loc}`, `top rated ${q} ${loc}`, `${q} ${loc} area`,
      `${q} near me ${loc}`, `${q} ${loc} road`, `${q} ${loc} street`,
      `${q} ${loc} junction`, `${q} ${loc} nagar`, `${q} ${loc} colony`,
      `${q} ${loc} market`, `${q} ${loc} mall`,
    );
  }
  return base;
}

async function geocodeLocation(location: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    const loc = data.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch { return null; }
}

async function searchGoogleNearby(
  query: string,
  location: string,
  apiKey: string,
  limit: number,
): Promise<any[]> {
  const center = await geocodeLocation(location, apiKey);
  if (!center) return [];

  // ── TIGHTER GRID: only 9 points close to city center ────────
  // Prevents pulling in businesses from neighbouring cities/districts
  const offsets = [
    { lat: 0, lng: 0 },  // center
    { lat: 0.009, lng: 0 },  // north ~1km
    { lat: -0.009, lng: 0 },  // south ~1km
    { lat: 0, lng: 0.011 },  // east ~1km
    { lat: 0, lng: -0.011 },  // west ~1km
    { lat: 0.009, lng: 0.011 },  // NE
    { lat: 0.009, lng: -0.011 },  // NW
    { lat: -0.009, lng: 0.011 },  // SE
    { lat: -0.009, lng: -0.011 },  // SW
  ];

  // Smaller radii to stay within city bounds
  const radii = [1500, 2500];

  const searchPoints: { lat: number; lng: number; radius: number }[] = [];
  for (const off of offsets) {
    for (const r of radii) {
      searchPoints.push({ lat: center.lat + off.lat, lng: center.lng + off.lng, radius: r });
    }
  }

  const seenIds = new Set<string>();
  const allPlaces: any[] = [];

  const settled = await Promise.allSettled(
    searchPoints.map(async ({ lat, lng, radius }) => {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "REQUEST_DENIED") return [];
      let results = data.results || [];
      if (data.next_page_token) {
        await new Promise(r => setTimeout(r, 2200));
        try {
          const p2 = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${data.next_page_token}&key=${apiKey}`);
          const p2d = await p2.json();
          results = [...results, ...(p2d.results || [])];
        } catch { /* silent */ }
      }
      return results;
    })
  );

  for (const r of settled) {
    if (r.status !== "fulfilled") continue;
    for (const place of r.value) {
      if (!seenIds.has(place.place_id)) {
        seenIds.add(place.place_id);
        allPlaces.push(place);
      }
    }
  }

  console.log(`[Nearby Search] ${allPlaces.length} unique places`);
  return allPlaces.slice(0, limit > 0 ? limit : 500);
}

async function searchGooglePlaces(
  query: string,
  location: string,
  apiKey: string,
  limit: number,
  mode: string,
): Promise<any[]> {
  try {
    const queries = buildGoogleQueries(query, location, mode);
    const maxWanted = limit > 0 ? limit : 500;
    console.log(`[Google Places] Running ${queries.length} parallel queries`);
    const settled = await Promise.allSettled(
      queries.map(async (q) => {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(q)}&key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === "REQUEST_DENIED") { console.error("[Google Places] Denied:", data.error_message); return []; }
        let results = data.results || [];
        if (data.next_page_token) {
          await new Promise(r => setTimeout(r, 2200));
          try {
            const p2res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${apiKey}`);
            const p2data = await p2res.json();
            results = [...results, ...(p2data.results || [])];
            if (p2data.next_page_token) {
              await new Promise(r => setTimeout(r, 2200));
              const p3res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${p2data.next_page_token}&key=${apiKey}`);
              const p3data = await p3res.json();
              results = [...results, ...(p3data.results || [])];
            }
          } catch { /* ignore */ }
        }
        console.log(`[Google Places] "${q}": ${results.length} results`);
        return results;
      })
    );
    const seenIds = new Set<string>();
    const allPlaces: any[] = [];
    for (const r of settled) {
      if (r.status !== "fulfilled") continue;
      for (const place of r.value) {
        if (!seenIds.has(place.place_id)) { seenIds.add(place.place_id); allPlaces.push(place); }
      }
    }
    console.log(`[Google Places] Unique places: ${allPlaces.length}`);
    const places = allPlaces.slice(0, maxWanted);
    const detailed = await Promise.allSettled(places.map(async (p: any) => {
      try {
        const detUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_phone_number,international_phone_number,website,formatted_address,url&key=${apiKey}`;
        const detRes = await fetch(detUrl);
        const detData = await detRes.json();
        const d = detData.result || {};
        const addr = d.formatted_address || p.formatted_address || "";
        return {
          name: p.name, email: null,
          phone: d.international_phone_number || d.formatted_phone_number || null,
          website: d.website || null, address: addr,
          country: addr.split(",").pop()?.trim() || location,
          category: (p.types || []).filter((t: string) => !["establishment", "point_of_interest"].includes(t))[0]?.replace(/_/g, " ") || query,
          rating: p.rating ? String(p.rating) : null, source: "google",
          linkedin: null, facebook: null, instagram: null, twitter: null,
          products: mode === "suppliers" ? query : null, min_order: null, certifications: null,
          _placeId: p.place_id,
        };
      } catch {
        const addr = p.formatted_address || "";
        return {
          name: p.name, email: null, phone: null, website: null,
          address: addr, country: addr.split(",").pop()?.trim() || location,
          category: query, rating: p.rating ? String(p.rating) : null,
          source: "google", linkedin: null, facebook: null, instagram: null, twitter: null,
          products: mode === "suppliers" ? query : null, min_order: null, certifications: null,
        };
      }
    }));
    return detailed.filter(r => r.status === "fulfilled").map(r => {
      const v = (r as PromiseFulfilledResult<any>).value;
      delete v._placeId;
      return v;
    });
  } catch (e) { console.error("[Google Places]", e); return []; }
}

function buildWebQueries(query: string, location: string, mode: string): { q: string }[] {
  const q = query.trim();
  const loc = location.trim();
  if (mode === "suppliers") {
    return [
      { q: `"${q}" importer "${loc}" contact email` },
      { q: `"${q}" wholesaler "${loc}" email` },
      { q: `"${q}" distributor "${loc}" contact` },
      { q: `"${q}" trader Netherlands email` },
      { q: `site:kompass.com "${q}" "${loc}"` },
      { q: `site:europages.co.uk "${q}" "${loc}"` },
      { q: `site:tradekey.com "${q}" "${loc}"` },
      { q: `site:alibaba.com "${q}" "${loc}"` },
      { q: `"${q}" "import" "${loc}" email address` },
    ];
  }
  return [
    { q: `"${q}" "${loc}" contact email` },
    { q: `"${q}" "${loc}" phone address` },
    { q: `site:kompass.com "${q}" "${loc}"` },
    { q: `site:yellowpages.com "${q}" "${loc}"` },
  ];
}

async function searchGoogleWeb(query: string, location: string, apiKey: string, cseId: string, existingNames: string[], mode: string): Promise<any[]> {
  if (!cseId) return [];
  const queries = buildWebQueries(query, location, mode);
  const existingSet = new Set(existingNames.map(n => n.toLowerCase().trim()));
  try {
    const settled = await Promise.allSettled(
      queries.map(async ({ q }) => {
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(q)}&key=${apiKey}&cx=${cseId}&num=10`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) { console.warn("[Google Web]", data.error.message); return []; }
        return data.items || [];
      })
    );
    const seenLinks = new Set<string>();
    const results: any[] = [];
    for (const r of settled) {
      if (r.status !== "fulfilled") continue;
      for (const item of r.value) {
        const link = item.link || "";
        if (seenLinks.has(link)) continue;
        seenLinks.add(link);
        const rawTitle = item.title || "";
        const name = rawTitle.split(/[-|–|:]/).map((s: string) => s.trim()).filter((s: string) => s.length > 2)[0] || rawTitle;
        if (existingSet.has(name.toLowerCase().trim())) continue;
        const snippet = item.snippet || "";
        const emailMatch = snippet.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = snippet.match(/(\+?[\d\s\-()+]{7,17}\d)/);
        results.push({
          name, email: emailMatch ? emailMatch[0] : null,
          phone: phoneMatch ? phoneMatch[0].trim() : null,
          website: link || null, address: null, country: location,
          category: query, rating: null, source: "web",
          linkedin: null, facebook: null, instagram: null, twitter: null,
          products: mode === "suppliers" ? query : null, min_order: null, certifications: null,
        });
      }
    }
    console.log(`[Google Web] ${results.length} unique results`);
    return results;
  } catch (e) { console.error("[Google Web]", e); return []; }
}

async function searchClaude(query: string, location: string, existingNames: string[], apiKey: string, count: number, mode: string): Promise<any[]> {
  if (!apiKey || count <= 0) return [];
  const wantCount = Math.min(Math.max(count, 10), 40);
  const alreadyHave = existingNames.slice(0, 30).join(", ");
  const isSupplier = mode === "suppliers";
  const systemPrompt = isSupplier
    ? `You are a B2B trade intelligence API. Return ONLY a valid JSON array of real companies. No markdown, no explanation, no preamble.\n\nFind ${wantCount} REAL importers, wholesalers, distributors, and traders of "${query}" in "${location}".\nThese must be REAL companies with real websites if possible.\nAvoid these already found: [${alreadyHave}]\n\nFocus on: import/export companies, trading companies, wholesale distributors, B2B buyers, food importers, commodity traders.\n\nJSON schema — return ALL fields:\n[{\n  "name": "Full company name",\n  "email": "real business email or null",\n  "phone": "+country-code-number or null",\n  "website": "https://... (real domain) or null",\n  "address": "Full address with city, country",\n  "country": "${location}",\n  "category": "specific type e.g. Spice Importer, Food Wholesaler",\n  "rating": null,\n  "linkedin": "https://linkedin.com/company/... or null",\n  "facebook": "https://facebook.com/... or null",\n  "instagram": "https://instagram.com/... or null",\n  "twitter": "https://twitter.com/... or null",\n  "products": "Specific products",\n  "min_order": "MOQ if known",\n  "certifications": "certifications or null"\n}]`
    : `You are a business intelligence API. Return ONLY a valid JSON array of real companies. No markdown, no explanation.\n\nFind ${wantCount} real businesses matching "${query}" in "${location}".\nAvoid these already found: [${alreadyHave}]\n\nJSON schema:\n[{\n  "name": "Full business name",\n  "email": "email or null",\n  "phone": "+country-code-number or null",\n  "website": "https://... or null",\n  "address": "Full address",\n  "country": "${location}",\n  "category": "specific type",\n  "rating": "4.2 or null",\n  "linkedin": null, "facebook": null, "instagram": null, "twitter": null,\n  "products": null, "min_order": null, "certifications": null\n}]`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Find ${wantCount} ${isSupplier ? "importers/wholesalers/distributors" : "businesses"} for: "${query}" in "${location}"` }],
      }),
    });
    if (!res.ok) { console.error("[Claude]", res.status); return []; }
    const data = await res.json();
    let text = (data.content || []).map((b: any) => b.text || "").join("").trim();
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    let companies: any[];
    try { companies = JSON.parse(text); }
    catch {
      const m = text.match(/\[[\s\S]*\]/);
      if (m) { try { companies = JSON.parse(m[0]); } catch { return []; } } else return [];
    }
    if (!Array.isArray(companies)) return [];
    return companies.map((c: any) => ({ ...c, source: "ai" }));
  } catch (e) { console.error("[Claude]", e); return []; }
}

function dedup(arr: any[]): any[] {
  const seen = new Set<string>();
  return arr.filter(c => {
    if (!c?.name) return false;
    const key = c.name.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractFromHtml(html: string, domain?: string) {
  const allEmails: string[] = [];

  const plainText = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#64;/g, '@').replace(/&#46;/g, '.').replace(/\s+/g, ' ');
  (plainText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []).forEach(e => allEmails.push(e));

  (html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []).forEach(e => allEmails.push(e));
  (html.match(/[a-zA-Z0-9._%+\-]+\s*@\s*[a-zA-Z0-9.\-]+\s*\.\s*[a-zA-Z]{2,}/g) || []).forEach(e => allEmails.push(e.replace(/\s+/g, "")));
  (html.match(/[a-zA-Z0-9._%+\-]+\s*\[at\]\s*[a-zA-Z0-9.\-]+\s*\[dot\]\s*[a-zA-Z]{2,}/gi) || []).forEach(e => allEmails.push(e.replace(/\s*\[at\]\s*/i, "@").replace(/\s*\[dot\]\s*/gi, ".")));
  (html.match(/[a-zA-Z0-9._%+\-]+\s*\(at\)\s*[a-zA-Z0-9.\-]+\s*\(dot\)\s*[a-zA-Z]{2,}/gi) || []).forEach(e => allEmails.push(e.replace(/\s*\(at\)\s*/i, "@").replace(/\s*\(dot\)\s*/gi, ".")));
  (html.match(/[a-zA-Z0-9._%+\-]+\s+\(at\)\s+[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi) || []).forEach(e => allEmails.push(e.replace(/\s+\(at\)\s+/i, "@")));
  (html.match(/\b[a-zA-Z0-9._%+\-]+\s+at\s+[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/gi) || []).forEach(e => { const fixed = e.replace(/\s+at\s+/i, "@"); if (fixed.includes("@")) allEmails.push(fixed); });
  (html.match(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi) || []).forEach(e => allEmails.push(e.replace(/^mailto:/i, "")));
  (html.match(/href=["'][^"']*%40[^"']*["']/gi) || []).forEach(e => { const m = e.replace(/%40/gi, "@").replace(/%2E/gi, ".").match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/); if (m) allEmails.push(m[0]); });
  (html.match(/"email"\s*:\s*"([^"]+)"/gi) || []).forEach(e => { const m = e.match(/"email"\s*:\s*"([^"]+)"/i); if (m?.[1] && m[1].includes("@")) allEmails.push(m[1]); });
  (html.match(/data-(?:email|cfemail)=["']([^"']+)["']/gi) || []).forEach(e => { const m = e.match(/data-(?:email|cfemail)=["']([^"']+)["']/i); if (m?.[1] && m[1].includes("@")) allEmails.push(m[1]); });
  (html.match(/(?:E-Mail|Email|Mail)\s*:?\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi) || []).forEach(e => { const m = e.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/); if (m?.[1]) allEmails.push(m[1]); });
  (html.match(/[|·•]\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g) || []).forEach(e => { const m = e.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/); if (m?.[1]) allEmails.push(m[1]); });
  (html.match(/data-cfemail="([0-9a-f]+)"/gi) || []).forEach(encoded => {
    const hex = encoded.match(/data-cfemail="([0-9a-f]+)"/i)?.[1];
    if (!hex || hex.length < 2) return;
    try {
      const bytes = hex.match(/.{2}/g)!.map(h => parseInt(h, 16));
      const key = bytes[0];
      let decoded = "";
      for (let i = 1; i < bytes.length; i++) decoded += String.fromCharCode(bytes[i] ^ key);
      if (decoded.includes("@")) allEmails.push(decoded);
    } catch { /* ignore */ }
  });
  (html.match(/data-(?:rev-email|reversed-email)=["']([^"']+)["']/gi) || []).forEach(e => { const m = e.match(/data-(?:rev-email|reversed-email)=["']([^"']+)["']/i); if (m?.[1]) { const reversed = m[1].split("").reverse().join(""); if (reversed.includes("@")) allEmails.push(reversed); } });
  (html.match(/itemprop=["']email["'][^>]*content=["']([^"']+)["']/gi) || []).forEach(e => { const m = e.match(/content=["']([^"']+)["']/i); if (m?.[1] && m[1].includes("@")) allEmails.push(m[1]); });
  (html.match(/EMAIL(?:;[^:]+)?:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi) || []).forEach(e => { const m = e.match(/:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/); if (m?.[1]) allEmails.push(m[1]); });
  const junkPatterns = ["example", "yourdomain", "domain.com", "@sentry", "@schema", "@2x", "wix.com", "wordpress", "jquery", "@google", "@facebook", "@apple", "@w3", "@schema.org", "noreply", "no-reply", "@amazonaws", "@cloudflare", "@jsdelivr", "test@", "user@", ".png@", ".jpg@", ".gif@", ".svg@", "privacy@wix", "@squarespace"];
  const emails = [...new Set(allEmails)].filter((e: string) => e.includes("@") && e.length > 5 && e.length < 100 && !junkPatterns.some(j => e.toLowerCase().includes(j)) && !/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico|css|js)$/i.test(e) && /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(e));
  let prioritized = emails;
  if (domain && emails.length > 1) {
    const domainEmails = emails.filter(e => e.toLowerCase().includes(domain.toLowerCase().replace("www.", "")));
    if (domainEmails.length) prioritized = [...domainEmails, ...emails.filter(e => !domainEmails.includes(e))];
  }
  const liRaw = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[a-zA-Z0-9\-_%./]+/gi) || [];
  const fbRaw = html.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!share|sharer|dialog|policy|help|legal|ads|business|watch|groups|events\/)[a-zA-Z0-9.\-_]+/gi) || [];
  const igRaw = html.match(/https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|explore\/|accounts\/)[a-zA-Z0-9.\-_]+/gi) || [];
  const twRaw = html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!share|intent|home|login)[a-zA-Z0-9_]+/gi) || [];
  const cu = (arr: string[]) => arr.length ? arr[0].replace(/[/)\s"']+$/, "").split("?")[0] : null;
  return { emails: prioritized, linkedin: cu(liRaw), facebook: cu(fbRaw), instagram: cu(igRaw), twitter: cu(twRaw) };
}

const SCRAPE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,nl;q=0.8,de;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

const BLOCKED_BUILDERS = ["wix.com", "wixsite.com", "squarespace.com", "weebly.com", "webflow.io", "godaddysites.com", "myshopify.com"];

function isBuilderBlocked(url: string): boolean {
  try { const host = new URL(url).hostname.toLowerCase(); return BLOCKED_BUILDERS.some(b => host.includes(b)); }
  catch { return false; }
}

async function scrapeUrl(url: string, domain?: string): Promise<{ emails: string[]; linkedin: string | null; facebook: string | null; instagram: string | null; twitter: string | null; blocked?: boolean; jsOnly?: boolean; } | null> {
  if (isBuilderBlocked(url)) return { emails: [], linkedin: null, facebook: null, instagram: null, twitter: null, blocked: true };
  try {
    const res = await fetch(url, { headers: SCRAPE_HEADERS, signal: AbortSignal.timeout(15000), redirect: "follow" });
    if (res.status === 403 || res.status === 401 || res.status === 429 || res.status === 503) return { emails: [], linkedin: null, facebook: null, instagram: null, twitter: null, blocked: true };
    if (!res.ok) return null;
    const html = await res.text();
    if (html.length < 500 || html.includes("Host not in allowlist") || html.includes("cf-browser-verification") || html.includes("Checking your browser") || html.includes("challenge-running") || html.includes("wix-thunderbolt") || html.includes("X-Wix-") || (html.includes("squarespace") && html.length < 5000)) return { emails: [], linkedin: null, facebook: null, instagram: null, twitter: null, blocked: true };
    return extractFromHtml(html, domain);
  } catch { return null; }
}

function buildContactPages(base: string): string[] {
  return [
    base, `${base}/contact`, `${base}/contact-us`, `${base}/contact_us`, `${base}/contactus`, `${base}/contacts`, `${base}/contact/`,
    `${base}/get-in-touch`, `${base}/reach-us`, `${base}/reach-out`, `${base}/enquiry`, `${base}/enquire`, `${base}/inquiry`,
    `${base}/contact.php`, `${base}/contact-us.php`, `${base}/contact.html`, `${base}/contact-us.html`, `${base}/contact.html`,
    `${base}/enquiry.php`, `${base}/enquiry.html`, `${base}/locations`, `${base}/find-us`, `${base}/about`, `${base}/about-us`,
    `${base}/aboutus`, `${base}/our-story`, `${base}/our-team`, `${base}/team`,
    `${base}/pages/contact`, `${base}/pages/contact-us`, `${base}/pages/about`,
    `${base}/kontakt`, `${base}/impressum`, `${base}/imprint`, `${base}/ueber-uns`, `${base}/over-ons`,
    `${base}/nous-contacter`, `${base}/contacto`, `${base}/contatti`,
    `${base}/privacy-policy`, `${base}/privacy`, `${base}/legal`, `${base}/disclaimer`,
    `${base}/contact.html`, `${base}/contactus.html`, `${base}/about.html`, `${base}/about-us.html`, `${base}/index.html`,
    `${base}/home.html`,
  ];
}

async function enrichLead(name: string, website: string | null, location: string, googleKey: string, googleCseId: string): Promise<{ email: string | null; emails: string[]; linkedin: string | null; facebook: string | null; instagram: string | null; twitter: string | null; tiktok: string | null; youtube: string | null }> {
  const allEmails = new Set<string>();
  let linkedin: string | null = null, facebook: string | null = null, instagram: string | null = null, twitter: string | null = null, tiktok: string | null = null, youtube: string | null = null;

  if (googleKey && googleCseId) {
    const socialSearches = [
      { q: `"${name}" site:instagram.com`, key: "instagram" },
      { q: `"${name}" ${location} site:instagram.com`, key: "instagram2" },
      { q: `"${name}" site:facebook.com`, key: "facebook" },
      { q: `"${name}" ${location} site:facebook.com`, key: "facebook2" },
      { q: `"${name}" site:linkedin.com/company`, key: "linkedin" },
    ];
    const socialResults = await Promise.allSettled(socialSearches.map(async s => {
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(s.q)}&key=${googleKey}&cx=${googleCseId}&num=3`;
      const res = await fetch(url);
      const data = await res.json();
      return { key: s.key, items: (data.items || []) as any[] };
    }));
    for (const r of socialResults) {
      if (r.status !== "fulfilled") continue;
      const { key, items } = r.value;
      for (const item of items) {
        const link = (item.link || "").split("?")[0].replace(/\/+$/, "");
        if ((key === "instagram" || key === "instagram2") && !instagram && link.includes("instagram.com")) { if (!/\/(p|reel|explore|accounts|stories)\//i.test(link)) instagram = link; }
        if ((key === "facebook" || key === "facebook2") && !facebook && link.includes("facebook.com")) { if (!/\/(share|sharer|dialog|policy|help|ads|watch|groups|events|login)\//i.test(link)) facebook = link; }
        if (key === "linkedin" && !linkedin && link.includes("linkedin.com/company")) linkedin = link;
      }
    }
  }

  if (website) {
    const base = website.replace(/\/+$/, "");
    let domain = "";
    try { domain = new URL(base).hostname.replace("www.", ""); } catch { /* ignore */ }
    const pages = buildContactPages(base);
    const scraped = await Promise.allSettled(pages.map(u => scrapeUrl(u, domain)));
    let websiteBlocked = false;
    for (const r of scraped) {
      if (r.status !== "fulfilled" || !r.value) continue;
      const d = r.value;
      if (d.blocked) { websiteBlocked = true; continue; }
      if (d.jsOnly) continue;
      d.emails.forEach((e: string) => allEmails.add(e));
      if (!linkedin && d.linkedin) linkedin = d.linkedin;
      if (!facebook && d.facebook) facebook = d.facebook;
      if (!instagram && d.instagram) instagram = d.instagram;
      if (!twitter && d.twitter) twitter = d.twitter;
    }
    if (!allEmails.size && !websiteBlocked) {
      try {
        const sitemapRes = await fetch(`${base}/sitemap.xml`, { headers: SCRAPE_HEADERS, signal: AbortSignal.timeout(8000) });
        if (sitemapRes.ok) {
          const sitemapXml = await sitemapRes.text();
          const urlMatches = sitemapXml.match(/<loc>([^<]+)<\/loc>/gi) || [];
          const contactUrls = urlMatches.map(u => u.replace(/<\/?loc>/gi, "").trim()).filter(u => /contact|impressum|kontakt|over-ons|imprint|about|reach|enqui/i.test(u)).slice(0, 5);
          if (contactUrls.length) {
            const sitemapScrapes = await Promise.allSettled(contactUrls.map(u => scrapeUrl(u, domain)));
            for (const r of sitemapScrapes) { if (r.status !== "fulfilled" || !r.value) continue; r.value.emails.forEach((e: string) => allEmails.add(e)); }
          }
        }
      } catch { /* silent */ }
    }
  }

  if (googleKey && googleCseId && !allEmails.size) {
    const searches: { q: string; key: string }[] = [];
    let domain = "";
    if (website) { try { domain = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace("www.", ""); } catch { /* ignore */ } }
    if (domain) {
      searches.push({ q: `"${name}" "${domain}" email`, key: "email" });
      searches.push({ q: `site:${domain} email`, key: "email" });
      searches.push({ q: `"${name}" ${location} email contact`, key: "email2" });
      searches.push({ q: `"${name}" email "@"`, key: "email3" });
    } else {
      searches.push({ q: `"${name}" ${location} contact email`, key: "email" });
      searches.push({ q: `"${name}" email`, key: "email2" });
    }
    const cseResults = await Promise.allSettled(searches.map(async s => {
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(s.q)}&key=${googleKey}&cx=${googleCseId}&num=3`;
      const res = await fetch(url);
      const data = await res.json();
      return { key: s.key, items: (data.items || []) as any[] };
    }));
    for (const r of cseResults) {
      if (r.status !== "fulfilled") continue;
      const { key, items } = r.value;
      for (const item of items) {
        const link = (item.link || "") as string;
        const snip = (item.snippet || item.htmlSnippet || "") as string;
        if (key === "email" || key === "email2" || key === "email3") {
          const cleanLink = link.replace(/&#64;/g, "@").replace(/&#46;/g, ".").replace(/&amp;/g, "&").replace(/%40/g, "@");
          const cleanSnip = snip.replace(/&#64;/g, "@").replace(/&#46;/g, ".").replace(/&amp;/g, "&").replace(/%40/g, "@").replace(/<[^>]+>/g, " ");
          const em = cleanLink.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
          if (em) allEmails.add(em[0]);
          const sm = cleanSnip.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
          if (sm) allEmails.add(sm[0]);
          const titleField = (item.title || "").replace(/&#64;/g, "@");
          const tm = titleField.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
          if (tm) allEmails.add(tm[0]);
        }
      }
    }
    if (!allEmails.size && website) {
      let d2 = "";
      try { d2 = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace("www.", ""); } catch { /* ignore */ }
      const cseContactUrls = cseResults.filter(r => r.status === "fulfilled").flatMap(r => (r as PromiseFulfilledResult<any>).value.items).map((i: any) => i?.link || "").filter((u: string) => u && /contact|impressum|kontakt|about|reach/i.test(u) && d2 && u.includes(d2)).slice(0, 3) as string[];
      for (const u of cseContactUrls) { const scraped = await scrapeUrl(u, d2); if (scraped?.emails.length) scraped.emails.forEach((e: string) => allEmails.add(e)); }
    }
  }

  if (facebook) {
    try {
      const fbRes = await fetch(facebook, { headers: SCRAPE_HEADERS, signal: AbortSignal.timeout(10000) });
      if (fbRes.ok) {
        const fbHtml = await fbRes.text();
        const extracted = extractFromHtml(fbHtml);
        extracted.emails.forEach((e: string) => allEmails.add(e));
        if (!instagram) { const igMatch = fbHtml.match(/https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|explore\/|accounts\/)[a-zA-Z0-9.\-_]+/i); if (igMatch) instagram = igMatch[0].replace(/[/)\s"']+$/, "").split("?")[0]; }
      }
    } catch { /* silent */ }
  }

  if (!allEmails.size && googleKey) {
    try {
      const findUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(name + " " + location)}&inputtype=textquery&fields=place_id&key=${googleKey}`;
      const findRes = await fetch(findUrl);
      const findData = await findRes.json();
      const pid = findData.candidates?.[0]?.place_id;
      if (pid) {
        const detUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pid}&fields=website,formatted_phone_number&key=${googleKey}`;
        const detRes = await fetch(detUrl);
        const detData = await detRes.json();
        const altWebsite = detData.result?.website;
        if (altWebsite && altWebsite !== website) {
          let altDomain = "";
          try { altDomain = new URL(altWebsite).hostname.replace("www.", ""); } catch { }
          if (!isBuilderBlocked(altWebsite)) {
            const altScrape = await scrapeUrl(`${altWebsite.replace(/\/+$/, "")}/contact`, altDomain);
            if (altScrape?.emails.length) altScrape.emails.forEach((e: string) => allEmails.add(e));
          }
        }
      }
    } catch { /* silent */ }
  }

  const emailList = [...allEmails].filter(e => e && e.includes("@") && e.length > 5);
  return { email: emailList[0] || null, emails: emailList, linkedin, facebook, instagram, twitter, tiktok, youtube };
}

// ─────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
    const googleKey = Deno.env.get("GOOGLE_PLACES_KEY") || "";
    const googleCseId = Deno.env.get("GOOGLE_CSE_ID") || "";

    // ── GENERATE PRODUCT PAGE CONTENT ────────────────────────
    if (body.type === "generate_product") {
      const { product_name = "", category = "spices" } = body;
      try {
        const prompt = `You are an expert export product content writer for Wander Breeze Exim Pvt Ltd, a Kerala-based spice and agri-product exporter from India.

Generate complete product page content for: "${product_name}"
Category: ${category}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "page_title": "SEO-optimised H1 heading (e.g. 'Indian Green Cardamom Exporter – Bulk Wholesale Supplier')",
  "page_subtitle": "Tagline under heading (e.g. '8mm Bold & Premium Grades | Ready Stock | Direct Export Supply')",
  "meta_title": "SEO meta title under 60 chars",
  "meta_description": "SEO meta description under 160 chars",
  "meta_keywords": "comma-separated SEO keywords",
  "hero_bullets": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "origin": "Where in India this product comes from (e.g. 'Idukki, Kerala')",
  "moq": "Minimum order quantity (e.g. '500 KG' or '1 x 20ft Container')",
  "supply_capacity": "Supply capacity description (e.g. 'Large Volume Export Supply')",
  "hs_code": "Correct HS code for this product",
  "overview_title": "Overview section heading",
  "overview_text": "2-3 paragraph overview of the product for export buyers (150-200 words)",
  "specs": [
    {"label": "Origin", "value": "..."},
    {"label": "HS Code", "value": "..."},
    {"label": "Grades", "value": "..."},
    {"label": "Moisture", "value": "..."},
    {"label": "MOQ", "value": "..."},
    {"label": "Certifications", "value": "FSSAI, Spices Board RCMC"}
  ]
}

Rules:
- Write for international B2B buyers (importers, wholesalers, distributors)
- Focus on export quality, Kerala/India origin, certifications
- hero_bullets: start each with a key spec or benefit (no ✔ prefix needed)
- specs: include 6-8 relevant technical specs for this specific product
- Use accurate HS codes and realistic MOQ/specs for Indian export
- overview_text: mention sourcing region, quality standards, target markets`;

        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!aiRes.ok) return json({ error: "AI error", detail: await aiRes.json() }, 500);
        const aiData = await aiRes.json();
        const text   = aiData?.content?.[0]?.text?.trim() ?? "";
        const clean  = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(clean);
        return json(parsed);
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── GENERATE EMAIL ────────────────────────────────────────
    if (body.type === "generate_email") {
      const { products = [], country = "", company = "" } = body;
      try {
        const prompt = `You are a professional export sales writer for Wander Breeze Exim Pvt Ltd, a Kerala-based spice and coconut exporter. Write a concise, professional outreach email.

Details:
- Products: ${products.join(", ")}
- Destination: ${country}
- Recipient company: ${company || "an import company"}
- Sender: Ram, Founder & Export Head, Wander Breeze Exim Pvt Ltd
- Certifications: FSSAI, Spices Board RCMC

Rules:
1. Subject line: short, specific, professional (no spam words)
2. Body: 150-200 words max, warm but professional
3. Start with "Dear Sir/Madam,"
4. Mention Kerala origin, quality, certifications
5. End with: +91 73580 60254, contact@wanderbreezeexim.com, www.wanderbreezeexim.com
6. No bullet points — flowing paragraphs only

Respond ONLY with valid JSON (no markdown, no code blocks):
{"subject": "...", "body": "..."}`;

        const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
          body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
        });

        if (!aiRes.ok) return json({ error: "AI error", detail: await aiRes.json() }, 500);
        const aiData = await aiRes.json();
        const text = aiData?.content?.[0]?.text?.trim() ?? "";
        const clean = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(clean);
        return json(parsed);
      } catch (e: any) {
        return json({ error: e.message }, 500);
      }
    }

    // ── ENRICH single lead ────────────────────────────────────
    if (body.action === "enrich") {
      const { name, website, location: loc } = body;
      if (!name) return json({ error: "name required" }, 400);
      const result = await enrichLead(name, website || null, loc || "", googleKey, googleCseId);
      return json(result);
    }

    // ── ENRICH batch ──────────────────────────────────────────
    if (body.action === "enrich-batch") {
      const { leads, location: loc } = body;
      if (!Array.isArray(leads) || !leads.length) return json({ results: [] });
      const CONCURRENCY = 3;
      const enriched: any[] = new Array(leads.length);
      for (let i = 0; i < leads.length; i += CONCURRENCY) {
        const batch = leads.slice(i, i + CONCURRENCY);
        const settled = await Promise.allSettled(batch.map((l: any) => enrichLead(l.name, l.website || null, loc || "", googleKey, googleCseId)));
        settled.forEach((r, j) => {
          const lead = leads[i + j];
          if (r.status !== "fulfilled") { enriched[i + j] = lead; return; }
          const e = r.value;
          enriched[i + j] = { ...lead, email: e.email || lead.email || null, emails: e.emails?.length ? e.emails : (lead.emails || []), linkedin: e.linkedin || lead.linkedin || null, facebook: e.facebook || lead.facebook || null, instagram: e.instagram || lead.instagram || null, twitter: e.twitter || lead.twitter || null, tiktok: e.tiktok || lead.tiktok || null, youtube: e.youtube || lead.youtube || null };
        });
        console.log(`[enrich-batch] ${Math.min(i + CONCURRENCY, leads.length)}/${leads.length} done`);
      }
      return json({ results: enriched });
    }

    // ── SEARCH ────────────────────────────────────────────────
    const { query, location, limit = 0, mode = "leads" } = body;
    if (!query || !location) return json({ error: "query and location required" }, 400);

    let results: any[] = [];

    if (googleKey) {
      const r = await searchGooglePlaces(query, location, googleKey, limit, mode);
      console.log(`[Google Places Text] ${r.length}`);
      results.push(...r);
    }

    // Detect if location is a country (not a city) — skip nearby grid search
    const isCountryLevel = [
      "sri lanka", "malaysia", "singapore", "thailand", "indonesia", "philippines",
      "vietnam", "bangladesh", "pakistan", "india", "china", "japan", "south korea",
      "australia", "new zealand", "germany", "uk", "united kingdom", "france",
      "netherlands", "usa", "united states", "canada", "uae", "united arab emirates",
      "saudi arabia", "qatar", "oman", "kuwait", "egypt", "south africa", "nigeria",
      "brazil", "argentina", "colombia",
    ].some(c => location.toLowerCase().trim() === c);

    if (googleKey && mode !== "suppliers" && !isCountryLevel) {
      const r = await searchGoogleNearby(query, location, googleKey, limit);
      console.log(`[Nearby Search] before dedup: ${r.length}`);
      const seenNames = new Set(results.map(x => x.name?.toLowerCase().trim()));
      const newPlaces = r.filter(p => !seenNames.has(p.name?.toLowerCase().trim()));
      console.log(`[Nearby Search] new unique: ${newPlaces.length}`);
      const detailed = await Promise.allSettled(newPlaces.map(async (p: any) => {
        try {
          const detUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=name,formatted_phone_number,international_phone_number,website,formatted_address&key=${googleKey}`;
          const detRes = await fetch(detUrl);
          const detData = await detRes.json();
          const d = detData.result || {};
          const addr = d.formatted_address || p.vicinity || "";
          return { name: p.name, email: null, phone: d.international_phone_number || d.formatted_phone_number || null, website: d.website || null, address: addr, country: addr.split(",").pop()?.trim() || location, category: (p.types || []).filter((t: string) => !["establishment", "point_of_interest"].includes(t))[0]?.replace(/_/g, " ") || query, rating: p.rating ? String(p.rating) : null, source: "google", linkedin: null, facebook: null, instagram: null, twitter: null, products: null, min_order: null, certifications: null };
        } catch {
          return { name: p.name, email: null, phone: null, website: null, address: p.vicinity || "", country: location, category: query, rating: p.rating ? String(p.rating) : null, source: "google", linkedin: null, facebook: null, instagram: null, twitter: null, products: null, min_order: null, certifications: null };
        }
      }));
      results.push(...detailed.filter(r => r.status === "fulfilled").map(r => (r as any).value));
    }

    if (googleKey && googleCseId) {
      const r = await searchGoogleWeb(query, location, googleKey, googleCseId, results.map(r => r.name), mode);
      console.log(`[Google Web] ${r.length}`);
      results.push(...r);
    }

    if (anthropicKey) {
      const need = limit > 0 ? Math.max(limit - results.length, 10) : 60;
      const r = await searchClaude(query, location, results.map(r => r.name), anthropicKey, need, mode);
      console.log(`[Claude AI] ${r.length}`);
      results.push(...r);
    }

    results = dedup(results);
    if (limit > 0) results = results.slice(0, limit);

    console.log(`[lead-search] Mode: ${mode} | Total: ${results.length}`);
    return json({ results, total: results.length, mode });

  } catch (err) {
    console.error("[lead-search] Fatal:", err);
    return json({ error: "Internal server error" }, 500);
  }
});