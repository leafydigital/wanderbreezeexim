// @ts-nocheck
// supabase/functions/fetch-forex-rates/index.ts
//
// Fetches today's USD & AED "TT Buying" rate (the rate applicable when
// your export proceeds land in your account) from HDFC's Treasury Forex
// Card Rates PDF and Axis Bank's public Forex Card Rate page, along with
// the timestamp each bank published it.
//
// Deploy: supabase functions deploy fetch-forex-rates --no-verify-jwt
// Requires secret: ANTHROPIC_API_KEY (fallback path only, you already have this set)
//
// Primary path: fetch + regex, no AI call, fast & free.
// Fallback path (HDFC only): if the PDF layout changes and regex fails,
// falls back to asking Claude to read the PDF directly.

import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.11.0";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const HDFC_PDF_URL =
  "https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/interest-rates/hdfc-bank-treasury-forex-card-rates.pdf";
const AXIS_URL = "https://application.axis.bank.in/webforms/corporatecardrate/index.aspx";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function corsResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

// Row layout in the HDFC PDF text (per currency):
// <Name> <CODE> CashBuy CashSell BillsBuy BillsSell TTBuy TTSell CardOut CardLoad DD
const HDFC_ROW = {
  USD: /United States Dollar\s+USD\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
  AED: /U\.A\.E\.\s*Dirham\s+AED\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
};

async function fetchHdfc(currency: "USD" | "AED") {
  const resp = await fetch(HDFC_PDF_URL);
  const buf = new Uint8Array(await resp.arrayBuffer());
  const pdf = await getDocumentProxy(buf);
  const { text } = await extractText(pdf, { mergePages: true });

  const dateMatch = text.match(/DATE:\s*([\d-]+)\s*TIME:\s*([\d:]+\s*[AP]M)/i);
  const as_of = dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : null;

  const m = text.match(HDFC_ROW[currency]);
  if (m) {
    // Group 5 = TT Buying (Inw Rem) - the rate for converting incoming export proceeds
    return { tt_buy: parseFloat(m[5]), tt_sell: parseFloat(m[6]), as_of, source: "regex" };
  }

  // Fallback: ask Claude to read the PDF directly if the layout changed
  if (ANTHROPIC_API_KEY) {
    const b64 = btoa(String.fromCharCode(...buf));
    const resp2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
              {
                type: "text",
                text: `Find the "${currency}" row in this HDFC forex card rate sheet. Return ONLY JSON: {"tt_buy": number, "tt_sell": number, "as_of": "DATE TIME as printed on the sheet"}. TT Buy is the "T.T. Buying (Inw Rem)" column.`,
              },
            ],
          },
        ],
      }),
    });
    const data = await resp2.json();
    const t = (data.content ?? []).find((b: any) => b.type === "text")?.text ?? "{}";
    try {
      const parsed = JSON.parse(t.replace(/```json|```/g, "").trim());
      return { ...parsed, source: "claude_fallback" };
    } catch (_e) {
      return { error: "hdfc_parse_failed" };
    }
  }

  return { error: "hdfc_parse_failed" };
}

async function fetchAxis(currency: "USD" | "AED") {
  const resp = await fetch(AXIS_URL);
  const html = await resp.text();

  const dateMatch = html.match(/published on ([A-Za-z]+ \d{1,2},\d{4}) at ([\d:]+\s*[AP]M)/i);
  const as_of = dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : null;

  // Row format: | Name | Code | TT Buy | TT Sell | Bill Buy | Bill Sell | TC Buy | TC Sell | CCY Buy | CCY Sell |
  const label = currency === "USD" ? "US Dollar" : "U.A.E. Dirham";
  const rowRegex = new RegExp(
    `${label.replace(".", "\\.")}\\s*\\|\\s*${currency}\\s*\\|\\s*([\\d.]+)\\s*\\|\\s*([\\d.]+)`,
    "i"
  );
  const m = html.match(rowRegex);
  if (m) {
    return { tt_buy: parseFloat(m[1]), tt_sell: parseFloat(m[2]), as_of, source: "regex" };
  }
  return { error: "axis_parse_failed" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { currency } = await req.json();
    if (currency !== "USD" && currency !== "AED") {
      return corsResponse({ error: "currency must be USD or AED" }, 400);
    }

    const [hdfc, axis] = await Promise.allSettled([fetchHdfc(currency), fetchAxis(currency)]);

    return corsResponse({
      currency,
      hdfc: hdfc.status === "fulfilled" ? hdfc.value : { error: String(hdfc.reason) },
      axis: axis.status === "fulfilled" ? axis.value : { error: String(axis.reason) },
      fetched_at: new Date().toISOString(),
    });
  } catch (e) {
    return corsResponse({ error: String(e) }, 500);
  }
});