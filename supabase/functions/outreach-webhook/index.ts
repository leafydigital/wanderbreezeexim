/**
 * outreach-webhook/index.ts
 * Supabase Edge Function — receives Resend webhook events.
 *
 * Configure in Resend Dashboard → Webhooks:
 *   URL: https://oykxatbrtsnzuobucvax.supabase.co/functions/v1/outreach-webhook
 *   Events: email.delivered, email.bounced, email.opened, email.clicked
 *
 * Env vars:
 *   RESEND_WEBHOOK_SECRET  — from Resend Dashboard (for signature verification)
 *   SUPABASE_URL           — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.json();

  // Resend webhook payload structure:
  // { type: 'email.delivered', data: { email_id: '...', tags: [...] } }
  const { type, data } = body;

  if (!type || !data?.email_id) {
    return new Response('Invalid payload', { status: 400 });
  }

  // Find our queue row by resend_email_id
  const { data: queueRow, error } = await supabase
    .from('sc_outreach_queue')
    .select('*')
    .eq('resend_email_id', data.email_id)
    .single();

  if (error || !queueRow) {
    // Not our email — ignore gracefully
    return new Response(JSON.stringify({ ignored: true }), { status: 200 });
  }

  const now = new Date().toISOString();
  let newStatus = queueRow.status;
  const updatePayload: Record<string, any> = {};

  switch (type) {
    case 'email.delivered':
      newStatus = 'delivered';
      updatePayload.status       = 'delivered';
      updatePayload.delivered_at = now;
      break;

    case 'email.opened':
      // Only upgrade if not already at a higher state
      if (!['bounced'].includes(queueRow.status)) {
        newStatus = 'opened';
        updatePayload.status    = 'opened';
        updatePayload.opened_at = now;
      }
      break;

    case 'email.clicked':
      // Clicked implies opened
      if (!['bounced'].includes(queueRow.status)) {
        newStatus = 'opened';
        updatePayload.status    = 'opened';
        updatePayload.opened_at = queueRow.opened_at ?? now;
      }
      break;

    case 'email.bounced':
      newStatus = 'bounced';
      updatePayload.status       = 'bounced';
      updatePayload.bounced_at   = now;
      updatePayload.bounce_reason = data.bounce?.message ?? 'Unknown bounce';
      break;

    default:
      return new Response(JSON.stringify({ ignored: true, type }), { status: 200 });
  }

  // Apply update
  if (Object.keys(updatePayload).length > 0) {
    await supabase
      .from('sc_outreach_queue')
      .update(updatePayload)
      .eq('id', queueRow.id);

    // Log event
    await supabase.from('sc_outreach_events').insert({
      queue_id:    queueRow.id,
      campaign_id: queueRow.campaign_id,
      lead_id:     queueRow.lead_id,
      event_type:  type.replace('email.', ''),  // 'delivered', 'opened', 'bounced'
      old_status:  queueRow.status,
      new_status:  newStatus,
      metadata:    { resend_event: type, email_id: data.email_id },
    });

    // Update campaign counters
    if (type === 'email.delivered') {
      await supabase.rpc('increment_campaign_delivered', { campaign_id: queueRow.campaign_id });
    } else if (type === 'email.bounced') {
      await supabase.rpc('increment_campaign_bounced', { campaign_id: queueRow.campaign_id });
    }
  }

  return new Response(JSON.stringify({ ok: true, queue_id: queueRow.id, new_status: newStatus }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
