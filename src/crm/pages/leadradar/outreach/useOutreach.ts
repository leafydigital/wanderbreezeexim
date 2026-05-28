// ============================================================
// OUTREACH MODULE — Types & Hooks
// ============================================================

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// ── Types ────────────────────────────────────────────────────

export type OutreachStatus = 'ready' | 'sent' | 'not_interested' | 'follow_up' | 'converted';

export interface OutreachLead {
  id: string;
  user_id?: string;
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  category?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  status: OutreachStatus;
  email_subject?: string;
  email_body?: string;
  sent_at?: string;
  follow_up_date?: string;
  follow_up_note?: string;
  reply_received?: boolean;
  reply_note?: string;
  source_lead_id?: string;
  source?: string;
  notes?: string;
  created_at?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_default: boolean;
}

export interface Brochure {
  id: string;
  name: string;
  filename: string;
  storage_path: string;
  size_bytes: number;
}

export interface SendResult {
  id: string;
  success: boolean;
  error?: string;
}

// ── Outreach CRUD ────────────────────────────────────────────

export function useOutreach() {
  const { user }                = useAuth();
  const [leads, setLeads]       = useState<OutreachLead[]>([]);
  const [loading, setLoading]   = useState(false);

  const fetchByStatus = useCallback(async (status: OutreachStatus | 'all') => {
    setLoading(true);
    let q = supabase.from('sc_outreach').select('*');
    if (status !== 'all') q = q.eq('status', status);
    q = q.order('created_at', { ascending: false });
    const { data, error } = await q;
    if (!error) setLeads(data || []);
    setLoading(false);
    return data || [];
  }, []);

  const addLeads = useCallback(async (newLeads: Partial<OutreachLead>[]): Promise<number> => {
    if (!user?.id || !newLeads.length) return 0;
    const rows = newLeads.map(l => ({
      ...l,
      user_id: user.id,
      status: 'ready' as OutreachStatus,
    }));
    const { data, error } = await supabase.from('sc_outreach').insert(rows).select('id');
    if (error) { console.error(error); return 0; }
    return data?.length || 0;
  }, [user]);

  const updateLead = useCallback(async (id: string, updates: Partial<OutreachLead>) => {
    const { error } = await supabase.from('sc_outreach')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    return !error;
  }, []);

  const updateStatus = useCallback(async (ids: string[], status: OutreachStatus) => {
    const { error } = await supabase.from('sc_outreach')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);
    if (!error) setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, status } : l));
    return !error;
  }, []);

  const markSent = useCallback(async (ids: string[], subject: string, body: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase.from('sc_outreach')
      .update({ status: 'sent', sent_at: now, email_subject: subject, email_body: body, updated_at: now })
      .in('id', ids);
    if (!error) setLeads(prev => prev.map(l =>
      ids.includes(l.id) ? { ...l, status: 'sent', sent_at: now } : l
    ));
    return !error;
  }, []);

  const convertToBuyer = useCallback(async (lead: OutreachLead) => {
    // Save to customers table
    const { error: custErr } = await supabase.from('customers').insert({
      name:    lead.company_name,
      email:   lead.email,
      phone:   lead.phone,
      company: lead.company_name,
      address: lead.country,
      status:  'active',
      source:  'outreach',
      notes:   `Converted from outreach. Original source: ${lead.source || 'LeadRadar'}`,
    });
    if (custErr) return false;

    // Update outreach status
    await updateStatus([lead.id], 'converted');
    return true;
  }, [updateStatus]);

  const deleteLead = useCallback(async (id: string) => {
    await supabase.from('sc_outreach').delete().eq('id', id);
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  return { leads, loading, fetchByStatus, addLeads, updateLead, updateStatus, markSent, convertToBuyer, deleteLead };
}

// ── Templates ────────────────────────────────────────────────

export function useTemplates() {
  const { user }                      = useAuth();
  const [templates, setTemplates]     = useState<EmailTemplate[]>([]);

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from('sc_email_templates').select('*').order('is_default', { ascending: false });
    setTemplates(data || []);
    return data || [];
  }, []);

  const saveTemplate = useCallback(async (t: Partial<EmailTemplate>) => {
    if (t.id) {
      await supabase.from('sc_email_templates').update(t).eq('id', t.id);
    } else {
      await supabase.from('sc_email_templates').insert({ ...t, user_id: user?.id });
    }
    fetchTemplates();
  }, [user, fetchTemplates]);

  return { templates, fetchTemplates, saveTemplate };
}

// ── Brochures ────────────────────────────────────────────────

export function useBrochures() {
  const { user }                    = useAuth();
  const [brochures, setBrochures]   = useState<Brochure[]>([]);

  const fetchBrochures = useCallback(async () => {
    const { data } = await supabase.from('sc_brochures').select('*').order('created_at', { ascending: false });
    setBrochures(data || []);
    return data || [];
  }, []);

  const uploadBrochure = useCallback(async (file: File): Promise<Brochure | null> => {
    if (!user?.id) return null;
    const path = `${user.id}/${Date.now()}_${file.name}`;

    const { error: upErr } = await supabase.storage.from('brochures').upload(path, file);
    if (upErr) { console.error(upErr); return null; }

    const { data, error } = await supabase.from('sc_brochures').insert({
      user_id: user.id, name: file.name.replace(/\.[^/.]+$/, ''),
      filename: file.name, storage_path: path, size_bytes: file.size,
    }).select().single();

    if (error) return null;
    setBrochures(prev => [data, ...prev]);
    return data;
  }, [user]);

  const deleteBrochure = useCallback(async (b: Brochure) => {
    await supabase.storage.from('brochures').remove([b.storage_path]);
    await supabase.from('sc_brochures').delete().eq('id', b.id);
    setBrochures(prev => prev.filter(x => x.id !== b.id));
  }, []);

  const getBrochureBase64 = useCallback(async (b: Brochure): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('brochures').download(b.storage_path);
    if (error || !data) return null;
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(data);
    });
  }, []);

  return { brochures, fetchBrochures, uploadBrochure, deleteBrochure, getBrochureBase64 };
}

// ── Send emails via Edge Function ────────────────────────────

export async function sendOutreachEmails(params: {
  recipients: OutreachLead[];
  subject: string;
  body: string;
  attachments: { filename: string; content: string }[];
}): Promise<{ sent: number; failed: number; results: SendResult[] }> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({
        action: 'send',
        recipients: params.recipients,
        subject: params.subject,
        body: params.body,
        attachments: params.attachments,
      }),
    });
    if (!res.ok) return { sent: 0, failed: params.recipients.length, results: [] };
    const data = await res.json();
    return { sent: data.sent || 0, failed: data.failed || 0, results: data.results || [] };
  } catch (e) {
    console.error('[sendOutreachEmails]', e);
    return { sent: 0, failed: params.recipients.length, results: [] };
  }
}

// ── Dynamic tag replacement (preview) ───────────────────────

export function replaceTags(template: string, lead: Partial<OutreachLead>): string {
  const tags: Record<string, string> = {
    '[Company Name]': lead.company_name  || 'Team',
    '[Country]':      lead.country       || '',
    '[Contact Name]': lead.contact_name  || lead.company_name || 'Team',
    '[Website]':      lead.website       || '',
    '[Category]':     lead.category      || '',
    '[Email]':        lead.email         || '',
  };
  let result = template;
  for (const [tag, value] of Object.entries(tags)) {
    result = result.replaceAll(tag, value);
  }
  return result;
}

export const AVAILABLE_TAGS = [
  { tag: '[Company Name]', desc: 'Business name' },
  { tag: '[Country]',      desc: 'Country/location' },
  { tag: '[Contact Name]', desc: 'Contact person' },
  { tag: '[Website]',      desc: 'Website URL' },
  { tag: '[Category]',     desc: 'Business category' },
];
