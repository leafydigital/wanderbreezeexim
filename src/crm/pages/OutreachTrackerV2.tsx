/**
 * OutreachTrackerV2.tsx
 * Full outreach tracking system — campaigns, queue status, history, follow-ups.
 * Replaces the old OutreachTracker.tsx.
 *
 * Tab structure:
 *   Leads      — import, edit, select leads for campaigns
 *   Outreach   — all sent outreach with status, filters, history
 *   Campaigns  — campaign-level summary stats
 *
 * IMPORTANT: Replace the contents of src/crm/pages/OutreachTracker.tsx with this file.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Mail, Upload, Send, RefreshCw, Eye, History,
  Trash2, Edit2, Check, X, Plus, Filter,
  ChevronDown, Building2, Globe, Phone, User,
  Clock, CheckCircle, XCircle, AlertCircle,
  MessageSquare, Star, Calendar, FileSpreadsheet,
  BarChart3, List, Inbox, Download, Copy,
  ExternalLink, Loader2, Sparkles, Search,
  ArrowRight, Info, Bell,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  useOutreachLeads, useOutreachQueue, useEventHistory, useCampaigns,
  createCampaignAndQueue, generateEmailContent,
  type OutreachLead, type QueueRow, type ManualStatus,
} from './leadradar/outreach/useOutreachV2';
import { getTimezone, formatSendTimeIST, ALL_COUNTRIES } from './leadradar/outreach/timezones';
import { useProductsForOutreach } from './leadradar/outreach/useProductsForOutreach';

// ── Shared style tokens ───────────────────────────────────────
const S = {
  card:    { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 } as React.CSSProperties,
  th:      { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.4px', textTransform: 'uppercase' as const, textAlign: 'left' as const, borderBottom: '1px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' as const },
  td:      { padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #f9fafb', verticalAlign: 'middle' as const },
  input:   { border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%', background: '#fff', fontFamily: 'inherit' } as React.CSSProperties,
  btn:     (color = '#0F9B6E') => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: color, color: '#fff', transition: 'opacity .15s' }) as React.CSSProperties,
  btnGhost:{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' } as React.CSSProperties,
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', color: '#9CA3AF', transition: 'color .15s' } as React.CSSProperties,
};

// Products list is now loaded dynamically inside SendOutreachModal via useProductsForOutreach()

// ── Toast ─────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' | 'info' }[]>([]);
  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);
  return { toasts, toast };
}

function Toasts({ toasts }: { toasts: ReturnType<typeof useToast>['toasts'] }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: t.type === 'success' ? '#DCFCE7' : t.type === 'error' ? '#FEE2E2' : '#EFF6FF',
          color:      t.type === 'success' ? '#15803D' : t.type === 'error' ? '#DC2626'  : '#1D4ED8',
          border: `1px solid ${t.type === 'success' ? '#86EFAC' : t.type === 'error' ? '#FCA5A5' : '#BFDBFE'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 360,
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Status config ─────────────────────────────────────────────
const Q_STATUS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  queued:       { label: 'Queued',        color: '#6B7280', bg: '#F3F4F6', icon: Clock },
  sending:      { label: 'Sending…',      color: '#D97706', bg: '#FFFBEB', icon: Loader2 },
  sent:         { label: 'Email Sent',    color: '#2563EB', bg: '#EFF6FF', icon: Mail },
  delivered:    { label: 'Delivered',     color: '#0891B2', bg: '#ECFEFF', icon: CheckCircle },
  opened:       { label: 'Opened ✓',     color: '#059669', bg: '#ECFDF5', icon: Eye },
  bounced:      { label: 'Bounced',       color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  failed:       { label: 'Failed',        color: '#DC2626', bg: '#FEF2F2', icon: AlertCircle },
};
const M_STATUS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  replied:      { label: 'Replied',       color: '#7C3AED', bg: '#F5F3FF', icon: MessageSquare },
  interested:   { label: 'Interested ★', color: '#D97706', bg: '#FFFBEB', icon: Star },
  not_interested:{ label: 'Not Interested',color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  follow_up:    { label: 'Follow Up',     color: '#EA580C', bg: '#FFF7ED', icon: Bell },
};

function QStatusBadge({ status }: { status: string }) {
  const cfg = Q_STATUS[status] || Q_STATUS.queued;
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}
function MStatusBadge({ status }: { status: string | null }) {
  if (!status) return null;
  const cfg = M_STATUS[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      <Icon size={10} /> {cfg.label}
    </span>
  );
}

// ── Inline editable cell ──────────────────────────────────────
function EditCell({ value, onSave, placeholder, type = 'text' }: {
  value?: string | null; onSave: (v: string) => void; placeholder?: string; type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  useEffect(() => setVal(value || ''), [value]);

  if (editing) return (
    <input
      autoFocus type={type} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { setEditing(false); if (val !== value) onSave(val); }}
      onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); if (val !== value) onSave(val); } if (e.key === 'Escape') { setVal(value || ''); setEditing(false); } }}
      style={{ ...S.input, padding: '3px 7px', fontSize: 12, width: '100%', minWidth: 80 }}
    />
  );
  return (
    <div onClick={() => setEditing(true)} title="Click to edit"
      style={{ cursor: 'text', minWidth: 60, fontSize: 12, color: val ? '#111' : '#d1d5db', display: 'flex', alignItems: 'center', gap: 3 }}>
      {val || <span style={{ fontStyle: 'italic' }}>{placeholder || '—'}</span>}
      <Edit2 size={9} style={{ opacity: 0.25, flexShrink: 0 }} />
    </div>
  );
}

// ── History Modal ─────────────────────────────────────────────
function HistoryModal({ queueId, onClose }: { queueId: string; onClose: () => void }) {
  const { events, loading, fetchHistory } = useEventHistory();

  useEffect(() => { fetchHistory(queueId); }, [queueId]);

  const EVENT_ICONS: Record<string, any> = {
    email_queued:       Clock,
    campaign_created:   Send,
    email_sent:         Mail,
    delivered:          CheckCircle,
    opened:             Eye,
    bounced:            XCircle,
    failed:             AlertCircle,
    status_changed:     RefreshCw,
    replied:            MessageSquare,
    interested:         Star,
    not_interested:     XCircle,
    follow_up_scheduled: Bell,
    note_added:         Info,
  };
  const EVENT_COLORS: Record<string, string> = {
    email_queued:    '#6B7280',
    email_sent:      '#2563EB',
    delivered:       '#0891B2',
    opened:          '#059669',
    bounced:         '#DC2626',
    failed:          '#DC2626',
    status_changed:  '#7C3AED',
    replied:         '#7C3AED',
    interested:      '#D97706',
    follow_up_scheduled: '#EA580C',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={18} color="#0F9B6E" />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Activity History</span>
          </div>
          <button onClick={onClose} style={S.iconBtn}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}><Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} /></div>}
          {!loading && events.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>No activity yet</div>}
          {events.map((ev, i) => {
            const Icon = EVENT_ICONS[ev.event_type] || Info;
            const color = EVENT_COLORS[ev.event_type] || '#6B7280';
            const label = ev.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const ts = new Date(ev.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}>
                {/* Connector line */}
                {i < events.length - 1 && (
                  <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, background: '#f3f4f6' }} />
                )}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}15`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{label}</div>
                  {ev.note && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{ev.note}</div>}
                  {ev.old_status && ev.new_status && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ textDecoration: 'line-through' }}>{ev.old_status}</span>
                      <ArrowRight size={10} />
                      <span style={{ fontWeight: 600, color: color }}>{ev.new_status}</span>
                    </div>
                  )}
                  {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      {ev.metadata.scheduled_at && `Scheduled: ${formatSendTimeIST(ev.metadata.scheduled_at)} IST`}
                      {ev.metadata.follow_up_date && `Follow-up: ${ev.metadata.follow_up_date}`}
                      {ev.metadata.follow_up_note && ` — ${ev.metadata.follow_up_note}`}
                      {ev.metadata.bounce_reason && `Reason: ${ev.metadata.bounce_reason}`}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 3 }}>{ts} IST</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Compose / Send Outreach Modal ─────────────────────────────
function SendOutreachModal({
  leads, defaultCountry, onClose, onSent,
}: {
  leads: OutreachLead[];
  defaultCountry: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const { user } = useAuth();
  const { flatList: PRODUCTS_LIST } = useProductsForOutreach();
  const [country, setCountry]     = useState(defaultCountry);
  const [products, setProducts]   = useState<string[]>([]);
  const [channel, setChannel]     = useState<'email' | 'whatsapp'>('email');
  const [subject, setSubject]     = useState('');
  const [body, setBody]           = useState('');
  const [generating, setGenerate] = useState(false);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState('');

  const leadsWithEmail = leads.filter(l => l.email);
  const leadsWithout   = leads.filter(l => !l.email);

  async function handleGenerate() {
    if (!products.length) { setError('Select at least one product first.'); return; }
    setError('');
    setGenerate(true);
    const res = await generateEmailContent({ products, country, companyName: leads[0]?.company_name });
    if (res) { setSubject(res.subject); setBody(res.body); }
    else setBody(defaultTemplate(products, country));
    setGenerate(false);
  }

  function defaultTemplate(prods: string[], dest: string) {
    return `Dear Sir/Madam,

I hope this message finds you well.

We are Wander Breeze Exim Pvt Ltd, a certified spice and coconut exporter based in Kerala, India. We are pleased to introduce our premium export products:

${prods.map(p => `• ${p}`).join('\n')}

All products are sourced directly from Kerala's finest farms, ensuring top quality, competitive pricing, and reliable supply. We hold FSSAI and Spices Board RCMC certifications.

We would be delighted to send you our product catalogue and discuss how we can support your import requirements in ${dest}.

Looking forward to your kind response.

Warm regards,
Ram
Founder & Export Head
Wander Breeze Exim Pvt Ltd
📞 +91 73580 60254
🌐 www.wanderbreezeexim.com`;
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required.'); return; }
    if (leadsWithEmail.length === 0) { setError('None of the selected leads have email addresses.'); return; }
    setSending(true);
    setError('');

    const { queued, error: err } = await createCampaignAndQueue(
      user!.id,
      leadsWithEmail,
      { channel, destination_country: country, products, email_subject: subject, email_body: body },
    );

    setSending(false);
    if (err) { setError(err); return; }
    onSent();
    onClose();
  }

  const toggleProduct = (p: string) =>
    setProducts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={18} color="#0F9B6E" /> Send Outreach
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {leadsWithEmail.length} of {leads.length} leads have email addresses
              {leadsWithout.length > 0 && <span style={{ color: '#DC2626' }}> · {leadsWithout.length} will be skipped (no email)</span>}
            </div>
          </div>
          <button onClick={onClose} style={S.iconBtn}><X size={20} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Channel */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>CHANNEL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['email', 'whatsapp'] as const).map(c => (
                <button key={c} onClick={() => setChannel(c)}
                  style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `2px solid ${channel === c ? '#0F9B6E' : '#e5e7eb'}`, background: channel === c ? '#ECFDF5' : '#fff', color: channel === c ? '#065F46' : '#374151' }}>
                  {c === 'email' ? '✉️ Email' : '📱 WhatsApp'}
                </button>
              ))}
            </div>
          </div>

          {/* Destination country */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>DESTINATION COUNTRY</label>
            <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...S.input }}>
              {ALL_COUNTRIES.map(c => <option key={c}>{c}</option>)}
              {!ALL_COUNTRIES.includes(country) && country && <option value={country}>{country}</option>}
            </select>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              ⏰ Emails will be delivered during 9AM–2PM {country} time · Timezone: {getTimezone(country)}
            </div>
          </div>

          {/* Products */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>PRODUCTS TO PITCH</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRODUCTS_LIST.map(p => (
                <button key={p} onClick={() => toggleProduct(p)}
                  style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `1px solid ${products.includes(p) ? '#0F9B6E' : '#e5e7eb'}`, background: products.includes(p) ? '#ECFDF5' : '#fff', color: products.includes(p) ? '#065F46' : '#6B7280' }}>
                  {products.includes(p) ? '✓ ' : ''}{p}
                </button>
              ))}
            </div>
          </div>

          {/* AI Generate */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleGenerate} disabled={generating}
              style={{ ...S.btn('#7C3AED'), opacity: generating ? 0.7 : 1 }}>
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? 'Generating…' : 'AI Generate Subject & Body'}
            </button>
          </div>

          {/* Subject */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>EMAIL SUBJECT</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} style={S.input} placeholder="Enter subject line…" />
          </div>

          {/* Body */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              EMAIL BODY
              <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 8 }}>Use {'{{company}}, {{contact}}, {{country}}'} as placeholders</span>
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={12}
              style={{ ...S.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
              placeholder="Email body…"
            />
          </div>

          {/* Scheduling note */}
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#15803D', display: 'flex', gap: 8 }}>
            <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>Smart Scheduling Active</strong> — Emails will be sent in small batches (2–4 at a time) with random gaps so they arrive naturally in your buyer's inbox during their morning (9AM–2PM {country} time). This maximises deliverability and open rates.
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={S.btnGhost}>Cancel</button>
          <button onClick={handleSend} disabled={sending}
            style={{ ...S.btn('#0F9B6E'), minWidth: 140, justifyContent: 'center', opacity: sending ? 0.7 : 1 }}>
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sending ? 'Queuing…' : `Send to ${leadsWithEmail.length} Leads`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Excel Import Modal ────────────────────────────────────────
function ExcelImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const { importFromExcel } = useOutreachLeads();
  const [file, setFile]     = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    const buf = await f.arrayBuffer();
    const wb  = XLSX.read(buf, { type: 'array' });
    const ws  = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
    // Normalise column names (case-insensitive)
    const normalised = rows.map(r => {
      const lower: any = {};
      for (const [k, v] of Object.entries(r)) {
        lower[k.toLowerCase().replace(/[\s_]+/g, '_')] = v;
      }
      return {
        company_name:   lower.company || lower.company_name || '',
        contact_person: lower.person  || lower.contact_person || lower.contact || '',
        email:          lower.email   || '',
        phone:          lower.phone   || lower.phone_number || '',
        website:        lower.website || '',
        address:        lower.address || '',
        country:        lower.country || '',
      };
    });
    setPreview(normalised.slice(0, 5));
  }

  async function handleImport() {
    if (!file || preview.length === 0) return;
    setLoading(true);
    const buf = await file.arrayBuffer();
    const wb  = XLSX.read(buf, { type: 'array' });
    const ws  = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
    const normalised = rows.map(r => {
      const lower: any = {};
      for (const [k, v] of Object.entries(r)) {
        lower[k.toLowerCase().replace(/[\s_]+/g, '_')] = v;
      }
      return {
        company_name: lower.company || lower.company_name || '',
        contact_person: lower.person || lower.contact_person || lower.contact || '',
        email: lower.email || '',
        phone: (lower.phone || lower.phone_number || '').toString(),
        website: lower.website || '',
        address: lower.address || '',
        country: lower.country || '',
      };
    });
    const res = await importFromExcel(normalised, file.name);
    setResult(res);
    setLoading(false);
    if (res.imported > 0) onImported();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={18} color="#0F9B6E" /> Import from Excel
          </div>
          <button onClick={onClose} style={S.iconBtn}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Format hint */}
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#0C4A6E' }}>
            <strong>Required columns:</strong> Company, Address, Person, Email, Phone Number, Website, Country
            <br />Column names are case-insensitive. Extra columns are ignored.
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ border: '2px dashed #e5e7eb', borderRadius: 12, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: file ? '#F0FDF4' : '#fafafa' }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload size={28} color={file ? '#0F9B6E' : '#9CA3AF'} style={{ margin: '0 auto 10px' }} />
            {file ? (
              <div>
                <div style={{ fontWeight: 600, color: '#0F9B6E' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{preview.length}+ rows detected · Click to change</div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, color: '#374151' }}>Drop your Excel file here</div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>or click to browse · .xlsx, .xls, .csv</div>
              </div>
            )}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Preview (first 5 rows)</div>
              <div style={{ overflowX: 'auto', border: '1px solid #f3f4f6', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>{['Company', 'Person', 'Email', 'Phone', 'Country'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i}>
                        <td style={S.td}>{r.company_name || '—'}</td>
                        <td style={S.td}>{r.contact_person || '—'}</td>
                        <td style={S.td}>{r.email || <span style={{ color: '#DC2626' }}>Missing</span>}</td>
                        <td style={S.td}>{r.phone || '—'}</td>
                        <td style={S.td}>{r.country || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ background: result.imported > 0 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${result.imported > 0 ? '#BBF7D0' : '#FCA5A5'}`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: result.imported > 0 ? '#15803D' : '#DC2626', marginBottom: 6 }}>
                {result.imported > 0 ? `✓ ${result.imported} leads imported successfully` : 'Import failed'}
              </div>
              {result.skipped > 0 && <div style={{ fontSize: 12, color: '#6B7280' }}>{result.skipped} rows skipped (missing company name)</div>}
              {result.errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: '#DC2626' }}>{e}</div>)}
            </div>
          )}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={S.btnGhost}>{result ? 'Close' : 'Cancel'}</button>
          {!result && (
            <button onClick={handleImport} disabled={!file || loading}
              style={{ ...S.btn(), opacity: !file || loading ? 0.6 : 1 }}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Import Leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Follow-up Modal ───────────────────────────────────────────
function FollowUpModal({ queueRow, onClose, onSaved }: {
  queueRow: QueueRow; onClose: () => void; onSaved: () => void;
}) {
  const { setFollowUp } = useOutreachQueue();
  const [date, setDate] = useState(queueRow.follow_up_date || '');
  const [note, setNote] = useState(queueRow.follow_up_note || '');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!date) return;
    setSaving(true);
    await setFollowUp(queueRow.id, date, note);
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={17} color="#EA580C" /> Schedule Follow-up
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>FOLLOW-UP DATE</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={S.input} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>NOTE (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...S.input, resize: 'vertical' }} placeholder="What to follow up about…" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...S.btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={save} disabled={!date || saving} style={{ ...S.btn(), flex: 1, justifyContent: 'center', opacity: !date || saving ? 0.6 : 1 }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════


// ── Pagination Component ──────────────────────────────────────
function Pagination({ total, page, perPage, onPage, onPerPage }: {
  total: number; page: number; perPage: number;
  onPage: (p: number) => void; onPerPage: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = Math.min((page - 1) * perPage + 1, total);
  const end   = Math.min(page * perPage, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnStyle = (active = false, disabled = false): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 32, height: 32, padding: '0 8px', borderRadius: 6, fontSize: 13,
    fontWeight: active ? 700 : 400, cursor: disabled ? 'default' : 'pointer',
    border: active ? 'none' : '1px solid #e5e7eb',
    background: active ? '#0F9B6E' : disabled ? '#fafafa' : '#fff',
    color: active ? '#fff' : disabled ? '#D1D5DB' : '#374151',
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
      <div style={{ fontSize: 12, color: '#6B7280' }}>
        {total === 0 ? 'No results' : `${start}–${end} of ${total}`}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 1} style={btnStyle(false, page === 1)}>‹</button>
        {pages.map((p, i) =>
          p === '...'
            ? <span key={`e${i}`} style={{ fontSize: 13, color: '#9CA3AF', padding: '0 4px' }}>…</span>
            : <button key={p} onClick={() => onPage(p as number)} style={btnStyle(p === page)}>{p}</button>
        )}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} style={btnStyle(false, page === totalPages)}>›</button>
        <select value={perPage} onChange={e => { onPerPage(Number(e.target.value)); onPage(1); }}
          style={{ marginLeft: 8, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 12, outline: 'none', cursor: 'pointer', background: '#fff' }}>
          {[25, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
    </div>
  );
}

export default function OutreachTrackerV2() {
  const { user }                      = useAuth();
  const { toasts, toast }             = useToast();

  // Tab: 'leads' | 'outreach' | 'campaigns'
  const [tab, setTab] = useState<'leads' | 'outreach' | 'campaigns'>('leads');

  // ── Leads tab state ────────────────────────────────────────
  const { leads, loading: leadsLoading, fetchLeads, updateLead, deleteLead, deleteMany } = useOutreachLeads();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [leadSearch, setLeadSearch]   = useState('');
  const [showImport, setShowImport]   = useState(false);
  const [showSend, setShowSend]       = useState(false);
  const [defaultCountry, setDefaultCountry] = useState('');

  // ── Outreach tab state ─────────────────────────────────────
  const { rows, loading: queueLoading, fetchRows, updateManualStatus } = useOutreachQueue();
  const [qSearch, setQSearch]           = useState('');
  const [qStatusFilter, setQStatusFilter] = useState('all');
  const [qManualFilter, setQManualFilter] = useState('all');
  const [historyId, setHistoryId]       = useState<string | null>(null);
  const [followUpRow, setFollowUpRow]   = useState<QueueRow | null>(null);

  // ── Campaigns tab state ────────────────────────────────────
  const { campaigns, loading: campLoading, fetchCampaigns } = useCampaigns();

  // ── Pagination state ───────────────────────────────────────
  const [leadsPage,    setLeadsPage]    = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(25);
  const [outreachPage, setOutreachPage] = useState(1);
  const [outreachPer,  setOutreachPer]  = useState(25);

  // Reset pagination when filters/search change
  useEffect(() => { setLeadsPage(1); }, [leadSearch]);
  useEffect(() => { setOutreachPage(1); }, [qSearch, qStatusFilter, qManualFilter]);

  // Initial load
  useEffect(() => { fetchLeads(); }, []);
  useEffect(() => { if (tab === 'outreach') fetchRows(); }, [tab]);
  useEffect(() => { if (tab === 'campaigns') fetchCampaigns(); }, [tab]);

  // ── Derived: filtered leads ────────────────────────────────
  const filteredLeads = leads.filter(l => {
    if (!leadSearch) return true;
    const q = leadSearch.toLowerCase();
    return (l.company_name + l.email + l.country + l.contact_person).toLowerCase().includes(q);
  });

  // ── Derived: filtered queue ────────────────────────────────
  const filteredRows = rows.filter(r => {
    if (qStatusFilter !== 'all' && r.status !== qStatusFilter) return false;
    if (qManualFilter !== 'all' && r.manual_status !== qManualFilter) return false;
    if (qSearch) {
      const q = qSearch.toLowerCase();
      if (!(r.company_name + r.to_email + r.country + r.campaign_name).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Paginated slices ───────────────────────────────────────
  const pagedLeads   = filteredLeads.slice((leadsPage - 1) * leadsPerPage, leadsPage * leadsPerPage);
  const pagedRows    = filteredRows.slice((outreachPage - 1) * outreachPer, outreachPage * outreachPer);

  // ── Select helpers ─────────────────────────────────────────
  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleAll = () => {
    if (selectedIds.size === filteredLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredLeads.map(l => l.id)));
  };
  const selectedLeads = leads.filter(l => selectedIds.has(l.id));

  function handleSendOutreach() {
    if (selectedIds.size === 0) { toast('Select at least one lead first.', 'error'); return; }
    // Auto-detect country from selection
    const countries = [...new Set(selectedLeads.map(l => l.country).filter(Boolean))];
    setDefaultCountry(countries[0] || 'UAE');
    setShowSend(true);
  }

  // ── Tab pill ───────────────────────────────────────────────
  const tabs = [
    { id: 'leads',     label: 'Leads',     icon: List,     count: leads.length },
    { id: 'outreach',  label: 'Outreach',  icon: Inbox,    count: rows.length },
    { id: 'campaigns', label: 'Campaigns', icon: BarChart3, count: campaigns.length },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100%' }}>
      <Toasts toasts={toasts} />

      {/* ── Tab bar ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #f3f4f6', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none', borderBottom: `2px solid ${tab === t.id ? '#0F9B6E' : 'transparent'}`, color: tab === t.id ? '#0F9B6E' : '#6B7280', transition: 'all .15s' }}>
            <t.icon size={15} /> {t.label}
            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: tab === t.id ? '#ECFDF5' : '#f3f4f6', color: tab === t.id ? '#065F46' : '#9CA3AF' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── LEADS TAB ─────────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'leads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} style={{ ...S.input, paddingLeft: 32 }} placeholder="Search leads…" />
            </div>
            <button onClick={() => setShowImport(true)} style={S.btnGhost}>
              <FileSpreadsheet size={14} /> Import Excel
            </button>
            {selectedIds.size > 0 && (
              <>
                <button onClick={() => { deleteMany([...selectedIds]); setSelectedIds(new Set()); }} style={{ ...S.btnGhost, color: '#DC2626', borderColor: '#FCA5A5' }}>
                  <Trash2 size={14} /> Delete ({selectedIds.size})
                </button>
                <button onClick={handleSendOutreach} style={S.btn()}>
                  <Send size={14} /> Send Outreach ({selectedIds.size})
                </button>
              </>
            )}
          </div>

          {/* Table */}
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            {leadsLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} /><div>Loading leads…</div></div>
            ) : filteredLeads.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
                <Upload size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No leads yet</div>
                <div style={{ fontSize: 12 }}>Import from Excel or generate leads in LeadRadar, then add them here.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...S.th, width: 40 }}>
                        <input type="checkbox" checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0} onChange={toggleAll} />
                      </th>
                      {['Company', 'Contact', 'Email', 'Phone', 'Website', 'Country', 'Source', ''].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedLeads.map(lead => (
                      <tr key={lead.id} style={{ background: selectedIds.has(lead.id) ? '#F0FDF4' : 'transparent' }}>
                        <td style={S.td}>
                          <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleSelect(lead.id)} />
                        </td>
                        <td style={S.td}>
                          <EditCell value={lead.company_name} placeholder="Company" onSave={v => updateLead(lead.id, { company_name: v })} />
                        </td>
                        <td style={S.td}>
                          <EditCell value={lead.contact_person || ''} placeholder="Contact person" onSave={v => updateLead(lead.id, { contact_person: v })} />
                        </td>
                        <td style={S.td}>
                          <EditCell value={lead.email || ''} placeholder="email@…" type="email" onSave={v => updateLead(lead.id, { email: v })} />
                        </td>
                        <td style={S.td}>
                          <EditCell value={lead.phone || ''} placeholder="+…" onSave={v => updateLead(lead.id, { phone: v })} />
                        </td>
                        <td style={S.td}>
                          <EditCell value={lead.website || ''} placeholder="website.com" onSave={v => updateLead(lead.id, { website: v })} />
                        </td>
                        <td style={S.td}>
                          <EditCell value={lead.country || ''} placeholder="Country" onSave={v => updateLead(lead.id, { country: v })} />
                        </td>
                        <td style={S.td}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: lead.source === 'excel_import' ? '#EFF6FF' : lead.source === 'leadradar' ? '#ECFDF5' : '#F3F4F6', color: lead.source === 'excel_import' ? '#2563EB' : lead.source === 'leadradar' ? '#059669' : '#6B7280', fontWeight: 600 }}>
                            {lead.source === 'excel_import' ? 'Excel' : lead.source === 'leadradar' ? 'LeadRadar' : 'Manual'}
                          </span>
                        </td>
                        <td style={S.td}>
                          <button onClick={() => deleteLead(lead.id)} style={{ ...S.iconBtn, color: '#9CA3AF' }} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Pagination
            total={filteredLeads.length} page={leadsPage} perPage={leadsPerPage}
            onPage={setLeadsPage} onPerPage={setLeadsPerPage}
          />
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {filteredLeads.length} leads · {leads.filter(l => l.email).length} with email · Click any cell to edit inline
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── OUTREACH TAB ─────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'outreach' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filters toolbar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={qSearch} onChange={e => setQSearch(e.target.value)} style={{ ...S.input, paddingLeft: 32 }} placeholder="Search outreach…" />
            </div>
            <select value={qStatusFilter} onChange={e => setQStatusFilter(e.target.value)} style={{ ...S.input, width: 'auto' }}>
              <option value="all">All Delivery Status</option>
              {Object.entries(Q_STATUS).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
            <select value={qManualFilter} onChange={e => setQManualFilter(e.target.value)} style={{ ...S.input, width: 'auto' }}>
              <option value="all">All Reply Status</option>
              {Object.entries(M_STATUS).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
            </select>
            <button onClick={() => fetchRows()} style={S.btnGhost}><RefreshCw size={13} /> Refresh</button>
          </div>

          {/* Table */}
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            {queueLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} /><div>Loading…</div></div>
            ) : filteredRows.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
                <Inbox size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No outreach yet</div>
                <div style={{ fontSize: 12 }}>Go to Leads tab → select leads → Send Outreach.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Company', 'Email', 'Country', 'Campaign', 'Delivery', 'Reply Status', 'Scheduled', 'Sent', 'Actions'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRows.map(row => (
                      <tr key={row.id}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#111' }}>{row.company_name || '—'}</div>
                          {row.to_name && row.to_name !== row.company_name && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{row.to_name}</div>}
                        </td>
                        <td style={S.td}><span style={{ fontSize: 12 }}>{row.to_email}</span></td>
                        <td style={S.td}><span style={{ fontSize: 12 }}>{row.country || '—'}</span></td>
                        <td style={S.td}><span style={{ fontSize: 11, color: '#6B7280' }}>{row.campaign_name || '—'}</span></td>
                        <td style={S.td}><QStatusBadge status={row.status} /></td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <MStatusBadge status={row.manual_status} />
                            {/* Inline manual status change */}
                            <select
                              value={row.manual_status || ''}
                              onChange={e => updateManualStatus(row.id, (e.target.value as ManualStatus) || null)}
                              style={{ fontSize: 11, border: '1px solid #e5e7eb', borderRadius: 6, padding: '2px 6px', color: '#6B7280', background: '#fafafa', cursor: 'pointer', outline: 'none' }}>
                              <option value="">Set status…</option>
                              <option value="replied">Replied</option>
                              <option value="interested">Interested</option>
                              <option value="not_interested">Not Interested</option>
                              <option value="follow_up">Follow Up</option>
                            </select>
                          </div>
                        </td>
                        <td style={S.td}>
                          {row.scheduled_at ? (
                            <div>
                              <div style={{ fontSize: 11, color: '#374151' }}>{formatSendTimeIST(row.scheduled_at)}</div>
                              <div style={{ fontSize: 10, color: '#9CA3AF' }}>IST</div>
                            </div>
                          ) : '—'}
                        </td>
                        <td style={S.td}>
                          {row.sent_at ? (
                            <div style={{ fontSize: 11, color: '#374151' }}>
                              {new Date(row.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} IST
                            </div>
                          ) : '—'}
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button onClick={() => setHistoryId(row.id)} style={S.iconBtn} title="View history">
                              <History size={14} />
                            </button>
                            <button onClick={() => setFollowUpRow(row)} style={S.iconBtn} title="Schedule follow-up">
                              <Bell size={14} />
                            </button>
                            {row.website && (
                              <a href={row.website.startsWith('http') ? row.website : `https://${row.website}`} target="_blank" rel="noopener" style={{ ...S.iconBtn, textDecoration: 'none' }} title="Visit website">
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Pagination
            total={filteredRows.length} page={outreachPage} perPage={outreachPer}
            onPage={setOutreachPage} onPerPage={setOutreachPer}
          />
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{filteredRows.length} records</div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── CAMPAIGNS TAB ────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={fetchCampaigns} style={S.btnGhost}><RefreshCw size={13} /> Refresh</button>
          </div>
          {campLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} /></div>
          ) : campaigns.length === 0 ? (
            <div style={{ ...S.card, padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
              <BarChart3 size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No campaigns yet</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {campaigns.map(c => {
                const total = c.total_leads || 0;
                const sent  = c.sent_count || 0;
                const pct   = total > 0 ? Math.round((sent / total) * 100) : 0;
                return (
                  <div key={c.id} style={S.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                          {c.destination_country} · {c.destination_tz} ·
                          {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        {c.products && c.products.length > 0 && (
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                            Products: {c.products.join(', ')}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 11, padding: '3px 12px', borderRadius: 20, background: c.campaign_status === 'active' ? '#ECFDF5' : '#F3F4F6', color: c.campaign_status === 'active' ? '#059669' : '#6B7280', fontWeight: 600 }}>
                        {c.campaign_status}
                      </span>
                    </div>
                    {/* Stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 12, marginTop: 16 }}>
                      {[
                        { label: 'Total', value: total, color: '#6B7280' },
                        { label: 'Queued', value: c.queued_count || 0, color: '#6B7280' },
                        { label: 'Sent', value: sent, color: '#2563EB' },
                        { label: 'Delivered', value: c.delivered_count || 0, color: '#0891B2' },
                        { label: 'Opened', value: c.opened_count || 0, color: '#059669' },
                        { label: 'Bounced', value: c.bounced_count || 0, color: '#DC2626' },
                        { label: 'Replied', value: c.replied_count || 0, color: '#7C3AED' },
                        { label: 'Interested', value: c.interested_count || 0, color: '#D97706' },
                      ].map(stat => (
                        <div key={stat.label} style={{ textAlign: 'center', padding: '10px 8px', background: '#fafafa', borderRadius: 8 }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>
                        <span>Send progress</span><span>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0F9B6E,#38BFA1)', borderRadius: 3, transition: 'width .5s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}
      {showImport && (
        <ExcelImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { fetchLeads(); toast(`Leads imported!`, 'success'); }}
        />
      )}
      {showSend && (
        <SendOutreachModal
          leads={selectedLeads}
          defaultCountry={defaultCountry}
          onClose={() => setShowSend(false)}
          onSent={() => {
            toast(`Outreach queued! Emails will send during buyer's morning hours.`, 'success');
            setSelectedIds(new Set());
            setTab('outreach');
            fetchRows();
          }}
        />
      )}
      {historyId && (
        <HistoryModal queueId={historyId} onClose={() => setHistoryId(null)} />
      )}
      {followUpRow && (
        <FollowUpModal
          queueRow={followUpRow}
          onClose={() => setFollowUpRow(null)}
          onSaved={() => { fetchRows(); toast('Follow-up scheduled!', 'success'); }}
        />
      )}
    </div>
  );
}