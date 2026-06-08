/**
 * PATCH for supabase/functions/lead-search/index.ts
 *
 * Add this block inside the main handler BEFORE the existing search logic.
 * It handles the new 'generate_email' request type from the outreach modal.
 *
 * ── HOW TO APPLY ──────────────────────────────────────────────
 * Open:  supabase/functions/lead-search/index.ts
 * Find:  The main Deno.serve() handler
 * Add:   The block below at the TOP of the handler, before any existing logic
 * ─────────────────────────────────────────────────────────────
 */

// ─── PASTE THIS INSIDE Deno.serve(async (req) => { ... }) ─────
// Place it at the very start, before other request handling:

/*
  const body = await req.json().catch(() => ({}));

  // ── Email content generation for Outreach Modal ────────────
  if (body.type === 'generate_email') {
    const { products = [], country = '', company = '' } = body;

    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;

    const prompt = `You are a professional export sales writer for Wander Breeze Exim Pvt Ltd, 
a Kerala-based spice and coconut exporter. Write a concise, professional outreach email.

Details:
- Products: ${products.join(', ')}
- Destination: ${country}
- Recipient company: ${company || 'an import company'}
- Sender: Ram, Founder & Export Head, Wander Breeze Exim Pvt Ltd
- Certifications: FSSAI, Spices Board RCMC

Rules:
1. Subject line: short, specific, professional (no spam words)
2. Body: 150–200 words max, warm but professional
3. Start with "Dear Sir/Madam," (we don't know contact name)
4. Mention Kerala origin, quality, certifications
5. End with contact details: +91 73580 60254, contact@wanderbreezeexim.com, www.wanderbreezeexim.com
6. No bullet points in body — flowing paragraphs only

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "subject": "...",
  "body": "..."
}`;

    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData?.content?.[0]?.text?.trim() ?? '';

    try {
      const parsed = JSON.parse(text);
      return new Response(JSON.stringify(parsed), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'AI parse error', raw: text }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  // ── End of email generation block ──────────────────────────
*/

// ── SUMMARY OF ALL CHANGES ────────────────────────────────────
// File: supabase/functions/lead-search/index.ts
// Change: Add the 'generate_email' handler block at top of Deno.serve()
// No other files in lead-search need changing.
// The ANTHROPIC_API_KEY env var is already set (used by existing lead search).
