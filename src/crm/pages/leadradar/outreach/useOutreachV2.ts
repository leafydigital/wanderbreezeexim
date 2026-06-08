/**
 * useOutreachV2.ts — v2
 * All Supabase data operations for the outreach system.
 *
 * New in v2:
 * - lead_status: 'fresh' | 'queued' | 'sent' | 'cancelled'
 * - Duplicate checking on import (email already in queue/sent → skip)
 * - Multiple emails per lead — queue one row per email
 * - Email cleaning: strip %20 and whitespace from emails
 * - Weekend skip: if scheduled day is Sat/Sun → push to Tuesday
 * - Inline edit support for all lead fields
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';
import { getTimezone, buildBatchSchedule } from './timezones';

// ── Types ────────────────────────────────────────────────────

export type LeadStatus = 'fresh' | 'queued' | 'sent' | 'cancelled';

export type QueueStatus =
  | 'queued' | 'sending' | 'sent' | 'delivered' | 'opened' | 'bounced' | 'failed';

export type ManualStatus =
  | 'replied' | 'interested' | 'not_interested' | 'follow_up' | null;

export interface OutreachLead {
  id: string;
  user_id?: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  emails?: string[];           // all emails for this company
  phone: string | null;
  website: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  category: string | null;
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  notes: string | null;
  source: string;
  lead_status: LeadStatus;
  source_lead_id?: string | null;
  import_batch_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  channel: 'email' | 'whatsapp';
  destination_country: string | null;
  destination_tz: string | null;
  products: string[];
  email_subject: string;
  email_body: string;
  status: 'active' | 'paused' | 'completed';
  campaign_status?: 'active' | 'paused' | 'completed';
  total_leads?: number;
  queued_count?: number;
  sent_count?: number;
  delivered_count?: number;
  opened_count?: number;
  bounced_count?: number;
  replied_count?: number;
  interested_count?: number;
  created_at: string;
}

export interface QueueRow {
  id: string;
  campaign_id: string;
  lead_id: string;
  to_email: string;
  to_name: string | null;
  company_name: string | null;
  country: string | null;
  subject: string | null;
  status: QueueStatus;
  manual_status: ManualStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  bounce_reason: string | null;
  replied_at: string | null;
  follow_up_date: string | null;
  follow_up_note: string | null;
  created_at: string;
  updated_at: string;
  campaign_name?: string;
  channel?: string;
  destination_country?: string;
  products?: string[];
  phone?: string;
  website?: string;
  linkedin?: string;
  lead_status?: LeadStatus;
}

export interface OutreachEvent {
  id: string;
  queue_id: string;
  campaign_id: string;
  lead_id: string;
  event_type: string;
  old_status: string | null;
  new_status: string | null;
  metadata: Record<string, any>;
  note: string | null;
  created_at: string;
}

// ── Email cleaner ─────────────────────────────────────────────
/**
 * Cleans a raw email string:
 * - Strips leading/trailing whitespace and %20
 * - Decodes URL-encoded characters
 * - Returns null if result is not a valid email
 */
export function cleanEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^%20+/gi, '')
    .replace(/%20+$/gi, '')
    .replace(/%40/gi, '@')
    .replace(/%2E/gi, '.')
    .replace(/\s+/g, '')
    .toLowerCase();
  // Basic email validation
  if (/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
}

/** Clean and deduplicate an array of emails */
export function cleanEmails(raw: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const e of raw) {
    const c = cleanEmail(e);
    if (c && !seen.has(c)) { seen.add(c); result.push(c); }
  }
  return result;
}

// ── Weekend skip logic ────────────────────────────────────────
/**
 * Given a UTC ISO string, check if the corresponding local day
 * in destTz is Saturday (6) or Sunday (0).
 * If so, push to next Tuesday (adds 2 or 3 days).
 */
function skipWeekend(isoUtc: string, destTz: string): string {
  const date = new Date(isoUtc);

  // Get day of week in destination timezone
  const dayName = date.toLocaleDateString('en-US', { timeZone: destTz, weekday: 'short' });
  // dayName: Mon, Tue, Wed, Thu, Fri, Sat, Sun

  let daysToAdd = 0;
  if (dayName === 'Sat') daysToAdd = 3; // Sat → Tue
  if (dayName === 'Sun') daysToAdd = 2; // Sun → Tue
  if (dayName === 'Mon') daysToAdd = 1; // Mon → Tue (optional — remove if you want Mon sends)

  if (daysToAdd === 0) return isoUtc;

  const adjusted = new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return adjusted.toISOString();
}

// ── Get already-contacted emails from DB ──────────────────────
async function getContactedEmails(): Promise<Set<string>> {
  const { data } = await supabase
    .from('sc_outreach_queue')
    .select('to_email')
    .in('status', ['queued', 'sending', 'sent', 'delivered', 'opened']);

  const emails = new Set<string>();
  (data || []).forEach((r: any) => {
    const c = cleanEmail(r.to_email);
    if (c) emails.add(c);
  });
  return emails;
}

// ── Hook: Outreach Leads ─────────────────────────────────────

export function useOutreachLeads() {
  const { user } = useAuth();
  const [leads, setLeads]     = useState<OutreachLead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async (statusFilter?: LeadStatus | 'all') => {
    setLoading(true);
    let q = supabase
      .from('sc_outreach_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      q = q.eq('lead_status', statusFilter);
    }

    const { data } = await q;
    setLeads(data || []);
    setLoading(false);
  }, []);

  const updateLead = useCallback(async (id: string, patch: Partial<OutreachLead>) => {
    const { error } = await supabase
      .from('sc_outreach_leads')
      .update(patch)
      .eq('id', id);
    if (!error) setLeads(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    return error?.message || null;
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    await supabase.from('sc_outreach_leads').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  const deleteMany = useCallback(async (ids: string[]) => {
    await supabase.from('sc_outreach_leads').delete().in('id', ids);
    setLeads(prev => prev.filter(l => !ids.includes(l.id)));
  }, []);

  // Import from LeadRadar saved leads
  const importFromLeadRadar = useCallback(async (
    savedLeads: any[],
  ): Promise<{ imported: number; skipped: number; duplicates: number }> => {
    if (!user?.id) return { imported: 0, skipped: 0, duplicates: 0 };

    const contactedEmails = await getContactedEmails();
    let duplicates = 0;
    let skipped    = 0;

    const rows = savedLeads.map(l => {
      // Clean all emails for this lead
      const allEmails = cleanEmails([l.email, ...(l.emails || [])]);
      const primaryEmail = allEmails[0] || null;

      // Check if any email already in queue/sent
      const isDuplicate = allEmails.some(e => contactedEmails.has(e));
      if (isDuplicate) { duplicates++; return null; }
      if (!l.name?.trim()) { skipped++; return null; }

      return {
        user_id:        user.id,
        company_name:   l.name,
        contact_person: null,
        email:          primaryEmail,
        emails:         allEmails,
        phone:          l.phone || null,
        website:        l.website || null,
        address:        l.address || null,
        country:        l.country || null,
        city:           l.location || null,
        category:       l.category || null,
        linkedin:       l.linkedin || null,
        facebook:       l.facebook || null,
        instagram:      l.instagram || null,
        source:         'leadradar',
        source_lead_id: l.id || null,
        lead_status:    'fresh',
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) return { imported: 0, skipped, duplicates };

    const { data } = await supabase
      .from('sc_outreach_leads')
      .insert(rows)
      .select('id');

    await fetchLeads();
    return { imported: data?.length || 0, skipped, duplicates };
  }, [user, fetchLeads]);

  // Import from Excel
  const importFromExcel = useCallback(async (
    rows: Array<{
      company_name: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      country?: string;
    }>,
    filename: string,
  ): Promise<{ imported: number; skipped: number; errors: string[]; duplicates: number }> => {
    if (!user?.id) return { imported: 0, skipped: 0, errors: ['Not logged in'], duplicates: 0 };

    const contactedEmails = await getContactedEmails();

    const { data: batch } = await supabase
      .from('sc_import_batches')
      .insert({ user_id: user.id, filename, row_count: rows.length })
      .select('id')
      .single();

    const batchId  = batch?.id;
    const errors: string[] = [];
    const validRows: any[] = [];
    let duplicates = 0;

    rows.forEach((r, i) => {
      if (!r.company_name?.trim()) {
        errors.push(`Row ${i + 2}: Missing company name`);
        return;
      }

      // Clean email
      const cleanedEmail = cleanEmail(r.email);

      // Duplicate check
      if (cleanedEmail && contactedEmails.has(cleanedEmail)) {
        duplicates++;
        return;
      }

      validRows.push({
        user_id:         user.id,
        company_name:    r.company_name.trim(),
        contact_person:  r.contact_person?.trim() || null,
        email:           cleanedEmail,
        emails:          cleanedEmail ? [cleanedEmail] : [],
        phone:           r.phone?.toString().trim() || null,
        website:         r.website?.trim() || null,
        address:         r.address?.trim() || null,
        country:         r.country?.trim() || null,
        source:          'excel_import',
        import_batch_id: batchId,
        lead_status:     'fresh',
      });
    });

    if (validRows.length === 0) {
      return { imported: 0, skipped: rows.length - duplicates, errors, duplicates };
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('sc_outreach_leads')
      .insert(validRows)
      .select('id');

    if (insertErr) errors.push(insertErr.message);

    if (batchId) {
      await supabase
        .from('sc_import_batches')
        .update({ row_count: inserted?.length || 0 })
        .eq('id', batchId);
    }

    await fetchLeads();
    return {
      imported:   inserted?.length || 0,
      skipped:    rows.length - validRows.length - duplicates,
      errors,
      duplicates,
    };
  }, [user, fetchLeads]);

  return { leads, loading, fetchLeads, updateLead, deleteLead, deleteMany, importFromLeadRadar, importFromExcel };
}

// ── Hook: Campaigns ───────────────────────────────────────────

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('v_campaign_summary')
      .select('*')
      .order('created_at', { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  }, []);

  return { campaigns, loading, fetchCampaigns };
}

// ── Hook: Queue / Outreach Tracker ───────────────────────────

export function useOutreachQueue() {
  const { user } = useAuth();
  const [rows, setRows]       = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRows = useCallback(async (filters?: {
    status?: string;
    manual_status?: string;
    campaign_id?: string;
    country?: string;
  }) => {
    setLoading(true);
    let q = supabase
      .from('v_outreach_detail')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status)        q = q.eq('status', filters.status);
    if (filters?.manual_status) q = q.eq('manual_status', filters.manual_status);
    if (filters?.campaign_id)   q = q.eq('campaign_id', filters.campaign_id);
    if (filters?.country)       q = q.ilike('country', `%${filters.country}%`);

    const { data } = await q;
    setRows(data || []);
    setLoading(false);
  }, []);

  const updateManualStatus = useCallback(async (
    id: string,
    manual_status: ManualStatus,
    note?: string,
  ) => {
    const row = rows.find(r => r.id === id);
    const patch: any = { manual_status };
    if (manual_status === 'replied') patch.replied_at = new Date().toISOString();

    await supabase.from('sc_outreach_queue').update(patch).eq('id', id);

    await supabase.from('sc_outreach_events').insert({
      queue_id:    id,
      campaign_id: row?.campaign_id,
      lead_id:     row?.lead_id,
      user_id:     user?.id,
      event_type:  'status_changed',
      old_status:  row?.manual_status || null,
      new_status:  manual_status,
      note:        note || null,
    });

    setRows(prev => prev.map(r => r.id === id ? { ...r, manual_status } : r));
  }, [rows, user]);

  const setFollowUp = useCallback(async (id: string, date: string, note: string) => {
    const row = rows.find(r => r.id === id);
    await supabase.from('sc_outreach_queue').update({
      manual_status:  'follow_up',
      follow_up_date: date,
      follow_up_note: note,
    }).eq('id', id);

    await supabase.from('sc_outreach_events').insert({
      queue_id:    id,
      campaign_id: row?.campaign_id,
      lead_id:     row?.lead_id,
      user_id:     user?.id,
      event_type:  'follow_up_scheduled',
      new_status:  'follow_up',
      metadata:    { follow_up_date: date, follow_up_note: note },
    });

    setRows(prev => prev.map(r => r.id === id
      ? { ...r, manual_status: 'follow_up', follow_up_date: date, follow_up_note: note }
      : r
    ));
  }, [rows, user]);

  return { rows, loading, fetchRows, updateManualStatus, setFollowUp };
}

// ── Hook: Event History ───────────────────────────────────────

export function useEventHistory() {
  const [events, setEvents]   = useState<OutreachEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async (queueId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('sc_outreach_events')
      .select('*')
      .eq('queue_id', queueId)
      .order('created_at', { ascending: true });
    setEvents(data || []);
    setLoading(false);
  }, []);

  return { events, loading, fetchHistory };
}

// ── Campaign Creator ──────────────────────────────────────────

export async function createCampaignAndQueue(
  userId: string,
  leads: OutreachLead[],
  params: {
    channel: 'email' | 'whatsapp';
    destination_country: string;
    products: string[];
    email_subject: string;
    email_body: string;
    batch_size?: number;
  },
): Promise<{ campaign_id: string | null; queued: number; batches: number; error: string | null }> {
  const destTz    = getTimezone(params.destination_country);
  const batchSize = params.batch_size ?? 15;

  // Create campaign
  const { data: campaign, error: campErr } = await supabase
    .from('sc_outreach_campaigns')
    .insert({
      user_id:             userId,
      name:                `${params.destination_country} — ${new Date().toLocaleDateString('en-IN')}`,
      channel:             params.channel,
      destination_country: params.destination_country,
      destination_tz:      destTz,
      products:            params.products,
      email_subject:       params.email_subject,
      email_body:          params.email_body,
    })
    .select('id')
    .single();

  if (campErr || !campaign) {
    return { campaign_id: null, queued: 0, batches: 0, error: campErr?.message || 'Campaign creation failed' };
  }

  const campaignId = campaign.id;

  // Expand leads to email rows (one row per email address)
  // Each company may have multiple emails
  const emailRows: { lead: OutreachLead; email: string }[] = [];
  for (const lead of leads) {
    const allEmails = cleanEmails([lead.email, ...(lead.emails || [])]);
    if (allEmails.length === 0) continue;
    // For multiple emails: queue all of them
    for (const email of allEmails) {
      emailRows.push({ lead, email });
    }
  }

  if (emailRows.length === 0) {
    return { campaign_id: campaignId, queued: 0, batches: 0, error: 'No valid email addresses found' };
  }

  // Build batch schedule
  const schedule     = buildBatchSchedule(emailRows.length, destTz, batchSize);
  const totalBatches = Math.ceil(emailRows.length / batchSize);

  // Apply weekend skip to each scheduled time
  const finalSchedule = schedule.map(s => skipWeekend(s, destTz));

  // Build queue rows
  const queueRows = emailRows.map(({ lead, email }, i) => ({
    campaign_id:  campaignId,
    lead_id:      lead.id,
    user_id:      userId,
    to_email:     email,
    to_name:      lead.contact_person || lead.company_name,
    company_name: lead.company_name,
    country:      lead.country,
    subject:      params.email_subject,
    body:         personaliseBody(params.email_body, lead),
    scheduled_at: finalSchedule[i],
    status:       'queued',
  }));

  const { data: inserted, error: qErr } = await supabase
    .from('sc_outreach_queue')
    .insert(queueRows)
    .select('id');

  if (qErr) {
    return { campaign_id: campaignId, queued: 0, batches: 0, error: qErr.message };
  }

  // Update lead_status to 'queued' for all selected leads
  const leadIds = [...new Set(leads.map(l => l.id))];
  await supabase
    .from('sc_outreach_leads')
    .update({ lead_status: 'queued' })
    .in('id', leadIds);

  // Log events
  const eventRows = (inserted || []).map((q: any, i: number) => ({
    queue_id:    q.id,
    campaign_id: campaignId,
    lead_id:     queueRows[i].lead_id,
    user_id:     userId,
    event_type:  'email_queued',
    new_status:  'queued',
    metadata:    {
      scheduled_at: finalSchedule[i],
      batch_number: Math.floor(i / batchSize) + 1,
      to_email:     queueRows[i].to_email,
    },
  }));

  if (eventRows.length > 0) {
    await supabase.from('sc_outreach_events').insert(eventRows);
  }

  await supabase.from('sc_outreach_events').insert({
    campaign_id: campaignId,
    user_id:     userId,
    event_type:  'campaign_created',
    metadata:    {
      lead_count:    leads.length,
      email_count:   emailRows.length,
      batch_size:    batchSize,
      total_batches: totalBatches,
      channel:       params.channel,
      country:       params.destination_country,
      timezone:      destTz,
      first_send:    finalSchedule[0],
      last_send:     finalSchedule[finalSchedule.length - 1],
    },
  });

  return { campaign_id: campaignId, queued: inserted?.length || 0, batches: totalBatches, error: null };
}

// ── Personalise email body ────────────────────────────────────

function personaliseBody(template: string, lead: OutreachLead): string {
  return template
    .replace(/\{\{company\}\}/g,  lead.company_name || '')
    .replace(/\{\{contact\}\}/g,  lead.contact_person || 'Sir/Ma\'am')
    .replace(/\{\{country\}\}/g,  lead.country || '')
    .replace(/\{\{website\}\}/g,  lead.website || '');
}

// ── AI Subject/Body Generator ─────────────────────────────────

export async function generateEmailContent(params: {
  products: string[];
  country: string;
  companyName?: string;
}): Promise<{ subject: string; body: string } | null> {
  const SUPABASE_URL  = (import.meta as any).env.VITE_SUPABASE_URL as string;
  const SUPABASE_ANON = (import.meta as any).env.VITE_SUPABASE_ANON_KEY as string;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/lead-search`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({
        type:     'generate_email',
        products: params.products,
        country:  params.country,
        company:  params.companyName || '',
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.subject && data?.body ? { subject: data.subject, body: data.body } : null;

  } catch {
    return null;
  }
}