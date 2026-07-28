/**
 * outreach-sender/index.ts
 * Supabase Edge Function — cron every 15 minutes.
 *
 * Delegates ALL sending to wbe-mailer Vercel function.
 * wbe-mailer handles: Gmail SMTP, quota check, bounce detection,
 * Supabase status updates, and event logging itself.
 *
 * This function's job is just to trigger the mailer and log the summary.
 *
 * Env vars (Supabase Dashboard → Edge Functions → Secrets):
 *   MAILER_URL     — https://wbe-mailer.vercel.app/api/send-emails
 *   MAILER_SECRET  — shared secret (must match Vercel env var MAILER_SECRET)
 *   SUPABASE_URL          — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

const MAILER_URL    = Deno.env.get('MAILER_URL')    ?? 'https://wbe-mailer.vercel.app/api/send-emails';
const MAILER_SECRET = Deno.env.get('MAILER_SECRET') ?? '';

Deno.serve(async (_req) => {
  try {
    const res = await fetch(MAILER_URL, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-mailer-secret': MAILER_SECRET,
      },
      // Empty body — mailer fetches its own queue from Supabase
      body: JSON.stringify({}),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[outreach-sender] Mailer error:', data);
      return new Response(JSON.stringify({ error: data.error ?? 'Mailer returned error', status: res.status }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `[outreach-sender] sent=${data.sent} bounced=${data.bounced} failed=${data.failed}` +
      ` quota=${data.quota?.sentToday}/${data.quota?.limit}`
    );

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    console.error('[outreach-sender] Fetch failed:', e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
