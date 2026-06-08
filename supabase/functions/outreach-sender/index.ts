/**
 * outreach-sender/index.ts
 * Supabase Edge Function — runs on cron every 15 minutes.
 *
 * Logic:
 *  1. Fetch all 'queued' rows from sc_outreach_queue where scheduled_at <= now()
 *  2. Group by campaign → stagger sends with random gaps (3–11 min) and
 *     random batch sizes (2–4 per window) so it never looks like bulk mail
 *  3. Send via Resend API
 *  4. Update status and log to sc_outreach_events
 *
 * Env vars (set in Supabase Dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY        — from resend.com
 *   SUPABASE_URL          — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   FROM_EMAIL            — e.g. "Ram | Wander Breeze <contact@wanderbreezeexim.com>"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'Ram | Wander Breeze Exim <contact@wanderbreezeexim.com>';

// ── Send one email via Resend ─────────────────────────────────
async function sendEmail(row: any): Promise<{ success: boolean; resend_id?: string; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [row.to_email],
        bcc: ['contact@wanderbreezeexim.com', 'wanderbreezeexim@gmail.com'],
        subject: row.subject,
        html:    row.body?.replace(/\n/g, '<br>') ?? '',
        text:    row.body ?? '',
        // Resend supports tags for webhook correlation
        tags: [
          { name: 'queue_id',    value: row.id },
          { name: 'campaign_id', value: row.campaign_id },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) return { success: false, error: data?.message ?? 'Resend error' };
    return { success: true, resend_id: data.id };

  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Log an event ──────────────────────────────────────────────
async function logEvent(row: any, type: string, newStatus: string, meta: Record<string, any> = {}) {
  await supabase.from('sc_outreach_events').insert({
    queue_id:    row.id,
    campaign_id: row.campaign_id,
    lead_id:     row.lead_id,
    user_id:     row.user_id,
    event_type:  type,
    old_status:  row.status,
    new_status:  newStatus,
    metadata:    meta,
  });
}

// ── Main handler ──────────────────────────────────────────────
Deno.serve(async (_req) => {
  const now = new Date();

  // Fetch queued emails where scheduled_at <= now (ready to send)
  const { data: rows, error } = await supabase
    .from('sc_outreach_queue')
    .select('*')
    .eq('status', 'queued')
    .lte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(20); // max 20 per cron run to stay within limits

  if (error) {
    console.error('Fetch error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No emails due' }), { status: 200 });
  }

  // Stagger: pick a random batch size (2–4) and send only that many
  const batchSize = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
  const batch = rows.slice(0, batchSize);

  const results: { id: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < batch.length; i++) {
    const row = batch[i];

    // Mark as sending
    await supabase
      .from('sc_outreach_queue')
      .update({ status: 'sending' })
      .eq('id', row.id);

    const result = await sendEmail(row);

    if (result.success) {
      await supabase
        .from('sc_outreach_queue')
        .update({
          status:         'sent',
          sent_at:        new Date().toISOString(),
          resend_email_id: result.resend_id,
        })
        .eq('id', row.id);

      await logEvent(row, 'email_sent', 'sent', { resend_id: result.resend_id });

      // Update campaign counter
      await supabase.rpc('increment_campaign_sent', { campaign_id: row.campaign_id });

    } else {
      await supabase
        .from('sc_outreach_queue')
        .update({ status: 'failed' })
        .eq('id', row.id);

      await logEvent(row, 'failed', 'failed', { error: result.error });
    }

    results.push({ id: row.id, success: result.success, error: result.error });

    // Random delay between sends: 3–11 seconds (simulates human cadence)
    if (i < batch.length - 1) {
      const delay = (Math.floor(Math.random() * 8) + 3) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return new Response(
    JSON.stringify({ sent: results.filter(r => r.success).length, results }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
