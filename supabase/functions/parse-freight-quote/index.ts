// @ts-nocheck
// supabase/functions/parse-freight-quote/index.ts
//
// Takes a pasted freight-forwarder quote (text) OR an uploaded file
// (PDF / image, base64) and extracts a standardized list of charges
// using Claude, so the Pricing Calculator doesn't need per-forwarder
// parsing logic.
//
// Deploy: supabase functions deploy parse-freight-quote --no-verify-jwt
// Requires secret: ANTHROPIC_API_KEY (you already have this set)

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-5";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You extract freight-forwarder shipping quotes for an Indian spice export company (Wander Breeze Exim) into a strict JSON schema. The source may be a pasted email/WhatsApp message, a spreadsheet screenshot, or a PDF quotation. Formats vary by forwarder.

Output ONLY a single valid JSON object, no markdown fences, no commentary, matching exactly:

{
  "forwarder_name": string,
  "pol": string | null,
  "pod": string | null,
  "container_type": string | null,
  "exchange_rate_mentioned": number | null,
  "validity_date": string | null,
  "charges": [
    {
      "label": string,
      "bucket": "origin" | "freight" | "insurance",
      "currency": "INR" | "USD",
      "amount": number,
      "gst_pct": number,
      "note": string | null
    }
  ]
}

Rules:
- "Ocean Freight" / "Sea Freight" / "O/F" / "Air Freight" -> bucket "freight".
- "Insurance" / "Marine Insurance" -> bucket "insurance".
- Everything else (THC, BL charges, Surrender BL, Seal/MUC, EFS, CFS, documentation,
  transportation, clearance, certificates, agency charges, labour, drawback/EGM,
  chamber attestation, service charges, container survey, paper lining, PQ,
  health certificate/sampling, lab test, fumigation, COO, facilitation fees)
  -> bucket "origin".
- If GST% is stated, use it exactly. If not stated: ocean/air freight defaults to 5%,
  every other charge defaults to 18%. If a line explicitly says GST-inclusive or the
  total already includes GST, set gst_pct to 0 and put the full inclusive amount in
  "amount", noting this in "note".
- If an amount is a formula (e.g. "USD 425+150*97", "USD 7*98.5"), compute the final
  numeric value in the forwarder's stated currency and record the original formula in
  "note".
- "ACTUALS" / "AT ACTUAL" charges: set amount to 0 and note "billed at actuals - confirm before finalizing".
- Merge duplicate/near-duplicate line items into one, keeping the forwarder's own
  wording for the label where reasonable.
- Do not invent charges that are not present in the source. Do not include a running
  total line as a charge.
- If you cannot find a forwarder name, use "Unknown".`;

function corsResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (!ANTHROPIC_API_KEY) {
    return corsResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500);
  }

  try {
    const body = await req.json();
    const { rawText, fileBase64, fileMediaType, context } = body ?? {};

    if (!rawText && !fileBase64) {
      return corsResponse({ error: "Provide rawText or fileBase64" }, 400);
    }

    const contentBlocks: any[] = [];

    if (fileBase64 && fileMediaType) {
      if (fileMediaType === "application/pdf") {
        contentBlocks.push({
          type: "document",
          source: { type: "base64", media_type: fileMediaType, data: fileBase64 },
        });
      } else if (fileMediaType.startsWith("image/")) {
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: fileMediaType, data: fileBase64 },
        });
      } else {
        return corsResponse({ error: `Unsupported file type: ${fileMediaType}` }, 400);
      }
    }

    contentBlocks.push({
      type: "text",
      text: [
        `Shipment context: ${JSON.stringify(context ?? {})}`,
        rawText ? `Pasted quote text:\n${rawText}` : "Extract the quote from the attached file.",
      ].join("\n\n"),
    });

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: contentBlocks }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return corsResponse({ error: "anthropic_api_error", detail: errText }, 502);
    }

    const data = await resp.json();
    const textBlock = (data.content ?? []).find((b: any) => b.type === "text");
    const raw = textBlock?.text ?? "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (_e) {
      return corsResponse({ error: "could_not_parse_json", raw }, 422);
    }

    return corsResponse(parsed);
  } catch (e) {
    return corsResponse({ error: String(e) }, 500);
  }
});