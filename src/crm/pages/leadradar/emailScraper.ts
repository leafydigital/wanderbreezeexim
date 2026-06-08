/**
 * emailScraper.ts
 *
 * Strategy (in priority order):
 *  1. LOCAL SCRAPER SERVICE (localhost:3001) — uses your exact Node.js script
 *     with Playwright + Cheerio. Scrapes website pages AND Facebook with a
 *     real Chromium browser. Best results, no CORS limits.
 *     Start it with: cd scraper-service && npm install && npm run install-browsers && npm start
 *
 *  2. BROWSER FALLBACK — pure fetch + regex when local service is offline.
 *     Can't scrape Facebook (CORS), but handles most websites fine.
 */

const SCRAPER_SERVICE =
  (import.meta.env.VITE_SCRAPER_URL as string) || "https://wbe-scraper-production.up.railway.app";
const SCRAPER_API_KEY =
  (import.meta.env.VITE_SCRAPER_API_KEY as string) || "";

// ── Check if local scraper service is running ─────────────────
async function isServiceRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${SCRAPER_SERVICE}/health`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Result type ───────────────────────────────────────────────
export interface ScrapeResult {
  emails:    string[];
  linkedin:  string | null;
  facebook:  string | null;
  instagram: string | null;
  twitter:   string | null;
  tiktok:    string | null;
  youtube:   string | null;
}

const EMPTY: ScrapeResult = {
  emails: [], linkedin: null, facebook: null,
  instagram: null, twitter: null, tiktok: null, youtube: null,
};

// ─────────────────────────────────────────────────────────────
// PRIMARY: Local Scraper Service (Playwright — your exact script)
// ─────────────────────────────────────────────────────────────
async function scrapeViaService(websiteUrl: string): Promise<ScrapeResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SCRAPER_API_KEY) headers["x-api-key"] = SCRAPER_API_KEY;

  const res = await fetch(`${SCRAPER_SERVICE}/scrape`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: websiteUrl }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Service error: ${res.status}`);
  const data = await res.json();
  return {
    emails:    Array.isArray(data.emails)    ? data.emails    : [],
    linkedin:  data.linkedin   || null,
    facebook:  data.facebook   || null,
    instagram: data.instagram  || null,
    twitter:   data.twitter    || null,
    tiktok:    data.tiktok     || null,
    youtube:   data.youtube    || null,
  };
}

// ─────────────────────────────────────────────────────────────
// FALLBACK: Browser-based scraping (no Facebook, no Playwright)
// ─────────────────────────────────────────────────────────────

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const PAGES_TO_CHECK = [
  "", "/contact", "/contact-us", "/contactus", "/about", "/about-us",
  "/aboutus", "/team", "/our-team", "/kontakt", "/impressum",
  "/over-ons", "/imprint", "/reach-us",
];

const JUNK_PATTERNS = [
  "example@mail.com", "example.com", "facebook.com", "fb.com",
  "sentry", "noreply", "no-reply", "do-not-reply", "donotreply",
  "test@test.com", "mail.com", "email.com", "example.org", "example.net",
  "yourdomain", "wixpress", "schema", "google", "apple",
  "w3", "jquery", "cloudflare", "amazonaws", "test@", "user@",
  ".png@", ".jpg@", ".svg@", "@2x",
];

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return (
    email.includes("@") && email.length > 5 && email.length < 100 &&
    !JUNK_PATTERNS.some(j => lower.includes(j)) &&
    !/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico|css|js)$/i.test(email) &&
    /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)
  );
}

function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>();
  const decoded = html
    .replace(/\\u002[Ff]/g, '/').replace(/\\u003[Aa]/g, ':')
    .replace(/&amp;/g, '&').replace(/&#x2F;/g, '/').replace(/&#47;/g, '/');
  const combined = html + '\n' + decoded;

  (combined.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/gi) || [])
    .forEach(e => found.add(e.toLowerCase()));
  (combined.match(/mailto:([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})/gi) || [])
    .forEach(e => found.add(e.replace(/^mailto:/i, "").toLowerCase()));

  // Cloudflare cfemail decode
  (html.match(/data-cfemail="([0-9a-f]+)"/gi) || []).forEach(encoded => {
    const hex = encoded.match(/data-cfemail="([0-9a-f]+)"/i)?.[1];
    if (!hex || hex.length < 2) return;
    try {
      const bytes = hex.match(/.{2}/g)!.map(h => parseInt(h, 16));
      const key = bytes[0];
      let result = "";
      for (let i = 1; i < bytes.length; i++) result += String.fromCharCode(bytes[i] ^ key);
      if (result.includes("@")) found.add(result.toLowerCase());
    } catch { }
  });

  return [...found].filter(isValidEmail);
}

function extractSocialsFromHtml(html: string) {
  const decoded = html
    .replace(/\\u002[Ff]/g, '/').replace(/\\u003[Aa]/g, ':')
    .replace(/&amp;/g, '&');
  const combined = html + '\n' + decoded;

  function first(pattern: RegExp, skip?: RegExp): string | null {
    const matches = combined.match(pattern) || [];
    for (const m of matches) {
      const clean = m.replace(/[/"'\s\\]+$/, '').split('?')[0].split('\\')[0];
      if (!clean.startsWith('http')) continue;
      if (skip && skip.test(clean)) continue;
      return clean;
    }
    return null;
  }

  const fbAll = (combined.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!share|sharer|dialog|policy|help|legal|ads|business|watch|groups|events\/|login|photo|video|plugins)[a-zA-Z0-9.\-_/]+/gi) || [])
    .map(u => u.replace(/[/"'\s\\]+$/, '').split('?')[0]);

  return {
    linkedin:        first(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[a-zA-Z0-9\-_%./]+/gi),
    facebook:        fbAll[0] || null,
    instagram:       first(/https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|explore\/|accounts\/|stories\/)[a-zA-Z0-9.\-_]+/gi),
    twitter:         first(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!share|intent|home|login)[a-zA-Z0-9_]+/gi),
    tiktok:          first(/https?:\/\/(?:www\.)?tiktok\.com\/@[a-zA-Z0-9.\-_]+/gi),
    youtube:         first(/https?:\/\/(?:www\.)?youtube\.com\/@[a-zA-Z0-9.\-_]+/gi),
    allFacebookUrls: [...new Set(fbAll)],
  };
}

async function fetchWithProxy(url: string): Promise<string | null> {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy(url), {
        signal: AbortSignal.timeout(12000),
        headers: { "Accept": "text/html,*/*" },
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length < 200 || text.includes("Host not in allowlist")) continue;
      return text;
    } catch { continue; }
  }
  return null;
}

async function scrapeViaBrowser(websiteUrl: string): Promise<ScrapeResult> {
  const baseUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
  let domain = "";
  try { domain = new URL(baseUrl).hostname.replace("www.", ""); } catch {}

  const allEmails  = new Set<string>();
  let linkedin: string | null = null, facebook: string | null = null;
  let instagram: string | null = null, twitter: string | null = null;
  let tiktok: string | null = null, youtube: string | null = null;

  const pageUrls = PAGES_TO_CHECK.map(p => baseUrl.replace(/\/$/, "") + p);
  await Promise.all(pageUrls.map(async url => {
    const html = await fetchWithProxy(url);
    if (!html) return;
    extractEmailsFromHtml(html).forEach(e => allEmails.add(e));
    const socials = extractSocialsFromHtml(html);
    if (!linkedin  && socials.linkedin)  linkedin  = socials.linkedin;
    if (!facebook  && socials.facebook)  facebook  = socials.facebook;
    if (!instagram && socials.instagram) instagram = socials.instagram;
    if (!twitter   && socials.twitter)   twitter   = socials.twitter;
    if (!tiktok    && socials.tiktok)    tiktok    = socials.tiktok;
    if (!youtube   && socials.youtube)   youtube   = socials.youtube;
  }));

  const allValid     = [...allEmails].filter(isValidEmail);
  const domainEmails = allValid.filter(e =>  e.includes(domain));
  const otherEmails  = allValid.filter(e => !e.includes(domain));
  const emails       = [...new Set([...domainEmails, ...otherEmails])];

  return { emails, linkedin, facebook, instagram, twitter, tiktok, youtube };
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────
export async function scrapeWebsite(websiteUrl: string): Promise<ScrapeResult> {
  if (!websiteUrl) return EMPTY;

  const serviceUp = await isServiceRunning();

  if (serviceUp) {
    try {
      console.log(`[scraper] ✅ Using Railway Playwright service for ${websiteUrl}`);
      return await scrapeViaService(websiteUrl);
    } catch (err) {
      console.warn("[scraper] Railway service failed, falling back to browser:", err);
    }
  } else {
    console.log(`[scraper] ⚠️ Railway service offline — using browser fallback for ${websiteUrl}`);
  }

  return scrapeViaBrowser(websiteUrl);
}

// Legacy compat
export async function scrapeEmailsFromWebsite(websiteUrl: string): Promise<string[]> {
  const result = await scrapeWebsite(websiteUrl);
  return result.emails;
}