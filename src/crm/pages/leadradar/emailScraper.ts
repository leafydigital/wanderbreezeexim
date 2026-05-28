/**
 * emailScraper.ts — Client-side email scraper
 * Runs in the USER'S BROWSER (residential IP) — bypasses Wix/Facebook blocks
 * Uses a CORS proxy to fetch cross-origin pages
 * Mirrors the Node.js axios+cheerio approach that works locally
 */

// Public CORS proxies — tried in order, fallback to next if one fails
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const JUNK_EMAIL_PATTERNS = [
  "example", "yourdomain", "sentry", "wixpress", "schema",
  "google", "facebook", "apple", "w3", "jquery", "cloudflare",
  "amazonaws", "noreply", "no-reply", "test@", "user@",
  ".png@", ".jpg@", ".svg@", "@2x", "privacy@wix",
];

function isValidEmail(email: string): boolean {
  return (
    email.includes("@") &&
    email.length > 5 &&
    email.length < 100 &&
    !JUNK_EMAIL_PATTERNS.some(j => email.toLowerCase().includes(j)) &&
    !/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico|css|js)$/i.test(email) &&
    /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)
  );
}

function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>();

  // 1. Standard emails
  (html.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/gi) || []).forEach(e => found.add(e.toLowerCase()));

  // 2. mailto: links
  (html.match(/mailto:([A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,})/gi) || []).forEach(e =>
    found.add(e.replace(/^mailto:/i, "").toLowerCase()));

  // 3. [at] / (at) obfuscation
  (html.match(/[A-Z0-9._%+\-]+\s*[\[(]at[\])][\s.]*[A-Z0-9.\-]+\s*[\[(]dot[\])][\s.]*[A-Z]{2,}/gi) || []).forEach(e =>
    found.add(e.replace(/\s*[\[(]at[\])]\s*/i, "@").replace(/\s*[\[(]dot[\])]\s*/gi, ".").toLowerCase()));

  // 4. HTML entity &#64; = @
  const decoded = html.replace(/&#64;/g, "@").replace(/&#46;/g, ".").replace(/&amp;/g, "&");
  (decoded.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/gi) || []).forEach(e => found.add(e.toLowerCase()));

  // 5. Cloudflare cfemail decode
  (html.match(/data-cfemail="([0-9a-f]+)"/gi) || []).forEach(encoded => {
    const hex = encoded.match(/data-cfemail="([0-9a-f]+)"/i)?.[1];
    if (!hex || hex.length < 2) return;
    try {
      const bytes = hex.match(/.{2}/g)!.map(h => parseInt(h, 16));
      const key = bytes[0];
      let decoded = "";
      for (let i = 1; i < bytes.length; i++) decoded += String.fromCharCode(bytes[i] ^ key);
      if (decoded.includes("@")) found.add(decoded.toLowerCase());
    } catch { /* ignore */ }
  });

  return [...found].filter(isValidEmail);
}

function extractContactLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const seen = new Set<string>();

  // Find all <a href="..."> links
  const hrefMatches = html.match(/href=["']([^"']+)["']/gi) || [];

  for (const match of hrefMatches) {
    const href = match.replace(/^href=["']/i, "").replace(/["']$/, "");
    if (!href || href.startsWith("#") || href.startsWith("javascript")) continue;

    const lower = href.toLowerCase();
    const isContact = lower.includes("contact") || lower.includes("about") ||
      lower.includes("kontakt") || lower.includes("impressum") ||
      lower.includes("reach") || lower.includes("enquir") ||
      lower.includes("over-ons") || lower.includes("imprint");

    if (!isContact) continue;

    let fullUrl: string;
    try {
      fullUrl = href.startsWith("http") ? href : new URL(href, baseUrl).href;
    } catch { continue; }

    // Only follow links on the same domain
    try {
      const baseDomain = new URL(baseUrl).hostname;
      const linkDomain = new URL(fullUrl).hostname;
      if (linkDomain !== baseDomain) continue;
    } catch { continue; }

    if (!seen.has(fullUrl)) {
      seen.add(fullUrl);
      links.push(fullUrl);
    }
  }

  return links.slice(0, 5); // max 5 contact pages
}

async function fetchWithProxy(url: string): Promise<string | null> {
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy(url);
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(12000),
        headers: { "Accept": "text/html,application/xhtml+xml,*/*" },
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length < 200) continue;
      if (text.includes("Host not in allowlist")) continue;
      return text;
    } catch { continue; }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// SOCIAL LINK EXTRACTION from HTML
// ─────────────────────────────────────────────────────────────
function extractSocialsFromHtml(html: string) {
  const clean = (arr: string[]) => arr.length
    ? arr[0].replace(/[/"'\s]+$/, "").split("?")[0]
    : null;

  const liRaw = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[a-zA-Z0-9\-_%./]+/gi) || [];
  const fbRaw = html.match(/https?:\/\/(?:www\.)?facebook\.com\/(?!share|sharer|dialog|policy|help|legal|ads|business|watch|groups|events\/|login)[a-zA-Z0-9.\-_]+/gi) || [];
  const igRaw = html.match(/https?:\/\/(?:www\.)?instagram\.com\/(?!p\/|reel\/|explore\/|accounts\/|stories\/)[a-zA-Z0-9.\-_]+/gi) || [];
  const twRaw = html.match(/https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!share|intent|home|login)[a-zA-Z0-9_]+/gi) || [];

  return {
    linkedin:  clean(liRaw.filter(u => !/\/(feed|posts|jobs|people|pulse)\//i.test(u))),
    facebook:  clean(fbRaw),
    instagram: clean(igRaw),
    twitter:   clean(twRaw),
  };
}

export interface ScrapeResult {
  emails:    string[];
  linkedin:  string | null;
  facebook:  string | null;
  instagram: string | null;
  twitter:   string | null;
}

/**
 * Main function — scrapes a website for emails AND social links
 * Visits homepage + contact/about pages
 */
export async function scrapeWebsite(websiteUrl: string): Promise<ScrapeResult> {
  const empty: ScrapeResult = { emails: [], linkedin: null, facebook: null, instagram: null, twitter: null };
  if (!websiteUrl) return empty;

  const baseUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
  const visited = new Set<string>();
  const allEmails = new Set<string>();
  let linkedin: string | null = null;
  let facebook: string | null = null;
  let instagram: string | null = null;
  let twitter: string | null = null;

  async function scrapePage(url: string) {
    if (visited.has(url)) return;
    visited.add(url);

    const html = await fetchWithProxy(url);
    if (!html) return;

    // Extract emails
    extractEmailsFromHtml(html).forEach(e => allEmails.add(e));

    // Extract socials
    const socials = extractSocialsFromHtml(html);
    if (!linkedin  && socials.linkedin)  linkedin  = socials.linkedin;
    if (!facebook  && socials.facebook)  facebook  = socials.facebook;
    if (!instagram && socials.instagram) instagram = socials.instagram;
    if (!twitter   && socials.twitter)   twitter   = socials.twitter;

    // Follow contact links if we still need data
    if (allEmails.size === 0) {
      const contactLinks = extractContactLinks(html, baseUrl);
      await Promise.all(contactLinks.map(link => scrapePage(link)));
    }
  }

  const pagesToCheck = [
    baseUrl,
    `${baseUrl}/contact`,
    `${baseUrl}/contact-us`,
    `${baseUrl}/about`,
    `${baseUrl}/about-us`,
    `${baseUrl}/kontakt`,
    `${baseUrl}/impressum`,
    `${baseUrl}/over-ons`,
  ];

  await Promise.all(pagesToCheck.map(url => scrapePage(url)));

  const emails = [...allEmails].filter(isValidEmail);
  let domain = "";
  try { domain = new URL(baseUrl).hostname.replace("www.", ""); } catch {}
  const domainEmails = emails.filter(e => e.includes(domain));
  const otherEmails  = emails.filter(e => !e.includes(domain));

  return {
    emails:    [...domainEmails, ...otherEmails],
    linkedin,
    facebook,
    instagram,
    twitter,
  };
}

/**
 * Legacy — scrapes emails only (kept for backward compat)
 */
export async function scrapeEmailsFromWebsite(websiteUrl: string): Promise<string[]> {
  const result = await scrapeWebsite(websiteUrl);
  return result.emails;
}
