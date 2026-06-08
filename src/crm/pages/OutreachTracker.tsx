/**
 * OutreachTrackerV2.tsx — v2
 *
 * Tab structure:
 *   Fresh Leads  — only fresh/uncontacted leads; add leads here only
 *   All Leads    — all leads with status badges (fresh/queued/sent/cancelled)
 *   Outreach     — queue tracker with delivery status, history, follow-up
 *   Campaigns    — campaign-level aggregate stats
 *
 * New in v2:
 *   - lead_status badges (Fresh / Queued / Sent / Cancelled)
 *   - Inline editing on ALL lead fields (click any cell)
 *   - Duplicate detection on import
 *   - Multiple emails per company shown and queued
 *   - Weekend skip note in modal
 *   - Dynamic filename for export (query_location)
 *   - Add leads only from Fresh Leads tab
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Mail, Upload, Send, RefreshCw, History,
  Trash2, Edit2, Check, X, Filter,
  Building2, Clock, CheckCircle, XCircle, AlertCircle,
  MessageSquare, Star, Calendar, FileSpreadsheet,
  BarChart3, Inbox, Loader2, Sparkles, Search,
  ArrowRight, Info, Bell, Leaf, Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import {
  useOutreachLeads, useOutreachQueue, useEventHistory, useCampaigns,
  createCampaignAndQueue, generateEmailContent, cleanEmails,
  type OutreachLead, type QueueRow, type ManualStatus, type LeadStatus,
} from './leadradar/outreach/useOutreachV2';
import { getTimezone, formatSendTimeIST, ALL_COUNTRIES } from './leadradar/outreach/timezones';

import { useProductsForOutreach } from './leadradar/outreach/useProductsForOutreach';

// ── Style tokens ──────────────────────────────────────────────
const S = {
  card:    { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 } as React.CSSProperties,
  th:      { padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#6B7280', letterSpacing: '0.4px', textTransform: 'uppercase' as const, textAlign: 'left' as const, borderBottom: '1px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' as const },
  td:      { padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #f9fafb', verticalAlign: 'middle' as const },
  input:   { border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%', background: '#fff', fontFamily: 'inherit' } as React.CSSProperties,
  btn:     (color = '#0F9B6E') => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: color, color: '#fff' }) as React.CSSProperties,
  btnGhost:{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' } as React.CSSProperties,
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', color: '#9CA3AF' } as React.CSSProperties,
};

// Products loaded dynamically inside SendOutreachModal

// const PRODUCTS_LIST = [
//   'Black Pepper (MG1)', 'Black Pepper (TGSEB)', 'Black Pepper (ASTA)',
//   'Green Cardamom (6mm)', 'Green Cardamom (7mm)', 'Green Cardamom (8mm Bold)',
//   'Fresh Coconuts', 'Semi-Husked Coconuts', 'Dehusked Coconuts',
// ];

// ── Toast ─────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' | 'info' }[]>([]);
  const toast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);
  return { toasts, toast };
}

function Toasts({ toasts }: { toasts: ReturnType<typeof useToast>['toasts'] }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, maxWidth: 380,
          background: t.type === 'success' ? '#DCFCE7' : t.type === 'error' ? '#FEE2E2' : '#EFF6FF',
          color:      t.type === 'success' ? '#15803D' : t.type === 'error' ? '#DC2626'  : '#1D4ED8',
          border: `1px solid ${t.type === 'success' ? '#86EFAC' : t.type === 'error' ? '#FCA5A5' : '#BFDBFE'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ── Lead status badge ─────────────────────────────────────────
const LEAD_STATUS_CFG: Record<LeadStatus, { label: string; color: string; bg: string }> = {
  fresh:     { label: 'Fresh',     color: '#059669', bg: '#ECFDF5' },
  queued:    { label: 'Queued',    color: '#2563EB', bg: '#EFF6FF' },
  sent:      { label: 'Sent',      color: '#0891B2', bg: '#ECFEFF' },
  cancelled: { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' },
};

function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const cfg = LEAD_STATUS_CFG[status] || LEAD_STATUS_CFG.fresh;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

// ── Queue status badge ────────────────────────────────────────
const Q_STATUS: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  queued:    { label: 'Queued',     color: '#6B7280', bg: '#F3F4F6', icon: Clock },
  sending:   { label: 'Sending…',   color: '#D97706', bg: '#FFFBEB', icon: Loader2 },
  sent:      { label: 'Email Sent', color: '#2563EB', bg: '#EFF6FF', icon: Mail },
  delivered: { label: 'Delivered',  color: '#0891B2', bg: '#ECFEFF', icon: CheckCircle },
  opened:    { label: 'Opened ✓',  color: '#059669', bg: '#ECFDF5', icon: CheckCircle },
  bounced:   { label: 'Bounced',    color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  failed:    { label: 'Failed',     color: '#DC2626', bg: '#FEF2F2', icon: AlertCircle },
};
const M_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  replied:       { label: 'Replied',        color: '#7C3AED', bg: '#F5F3FF' },
  interested:    { label: 'Interested ★',  color: '#D97706', bg: '#FFFBEB' },
  not_interested:{ label: 'Not Interested', color: '#DC2626', bg: '#FEF2F2' },
  follow_up:     { label: 'Follow Up',      color: '#EA580C', bg: '#FFF7ED' },
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
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>{cfg.label}</span>;
}

// ── Inline editable cell ──────────────────────────────────────
function EditCell({ value, onSave, placeholder, type = 'text' }: {
  value?: string | null; onSave: (v: string) => void; placeholder?: string; type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value || '');
  useEffect(() => setVal(value || ''), [value]);

  if (editing) return (
    <input autoFocus type={type} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { setEditing(false); if (val !== (value || '')) onSave(val); }}
      onKeyDown={e => {
        if (e.key === 'Enter') { setEditing(false); if (val !== (value || '')) onSave(val); }
        if (e.key === 'Escape') { setVal(value || ''); setEditing(false); }
      }}
      style={{ ...S.input, padding: '3px 7px', fontSize: 12, minWidth: 80 }}
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
  const EVENT_COLORS: Record<string, string> = {
    email_queued: '#6B7280', email_sent: '#2563EB', delivered: '#0891B2',
    opened: '#059669', bounced: '#DC2626', failed: '#DC2626',
    status_changed: '#7C3AED', replied: '#7C3AED', interested: '#D97706',
    follow_up_scheduled: '#EA580C',
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><History size={18} color="#0F9B6E" /> Activity History</div>
          <button onClick={onClose} style={S.iconBtn}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}><Loader2 size={20} style={{ margin: '0 auto' }} /></div>}
          {!loading && events.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>No activity yet</div>}
          {events.map((ev, i) => {
            const color = EVENT_COLORS[ev.event_type] || '#6B7280';
            const label = ev.event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const ts = new Date(ev.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
            return (
              <div key={ev.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}>
                {i < events.length - 1 && <div style={{ position: 'absolute', left: 15, top: 32, bottom: 0, width: 2, background: '#f3f4f6' }} />}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}15`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{label}</div>
                  {ev.note && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{ev.note}</div>}
                  {ev.old_status && ev.new_status && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ textDecoration: 'line-through' }}>{ev.old_status}</span>
                      <ArrowRight size={10} />
                      <span style={{ fontWeight: 600, color }}>{ev.new_status}</span>
                    </div>
                  )}
                  {ev.metadata?.to_email && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>→ {ev.metadata.to_email}</div>}
                  {ev.metadata?.scheduled_at && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Scheduled: {formatSendTimeIST(ev.metadata.scheduled_at)} IST</div>}
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

// ── Send Outreach Modal ───────────────────────────────────────
function SendOutreachModal({ leads, defaultCountry, onClose, onSent }: {
  leads: OutreachLead[];
  defaultCountry: string;
  onClose: () => void;
  onSent: (queued: number, batches: number) => void;
}) {
  const { user }                      = useAuth();
  const { flatList: PRODUCTS_LIST }   = useProductsForOutreach();
  const [country, setCountry]         = useState(defaultCountry);
  const [products, setProducts]       = useState<string[]>([]);
  const [channel, setChannel]         = useState<'email' | 'whatsapp'>('email');
  const [subject, setSubject]         = useState('');
  const [body, setBody]               = useState('');
  const [batchSize, setBatchSize]     = useState(15);
  const [generating, setGenerate]     = useState(false);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState('');

  const leadsWithEmail = leads.filter(l => {
    const emails = cleanEmails([l.email, ...(l.emails || [])]);
    return emails.length > 0;
  });
  const totalEmailCount = leadsWithEmail.reduce((sum, l) => {
    return sum + cleanEmails([l.email, ...(l.emails || [])]).length;
  }, 0);
  const leadsWithout = leads.filter(l => cleanEmails([l.email, ...(l.emails || [])]).length === 0);

  async function handleGenerate() {
    if (!products.length) { setError('Select at least one product first.'); return; }
    setError(''); setGenerate(true);
    const res = await generateEmailContent({ products, country, companyName: leads[0]?.company_name });
    if (res) { setSubject(res.subject); setBody(res.body); }
    else setBody(defaultTemplate(products, country));
    setGenerate(false);
  }

  function defaultTemplate(prods: string[], dest: string) {
    return `Dear Sir/Madam,\n\nI hope this message finds you well.\n\nWe are Wander Breeze Exim Pvt Ltd, a certified spice and coconut exporter based in Kerala, India. We are pleased to introduce our premium export products:\n\n${prods.join(', ')}\n\nAll products are sourced directly from Kerala's finest farms, ensuring top quality, competitive pricing, and reliable supply. We hold FSSAI and Spices Board RCMC certifications.\n\nWe would be delighted to send you our product catalogue and discuss how we can support your import requirements in ${dest}.\n\nLooking forward to your kind response.\n\nWarm regards,\nRam\nFounder & Export Head\nWander Breeze Exim Pvt Ltd\n📞 +91 73580 60254\n🌐 www.wanderbreezeexim.com`;
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required.'); return; }
    if (leadsWithEmail.length === 0) { setError('None of the selected leads have email addresses.'); return; }
    setSending(true); setError('');
    const { queued, batches, error: err } = await createCampaignAndQueue(
      user!.id, leadsWithEmail,
      { channel, destination_country: country, products, email_subject: subject, email_body: body, batch_size: batchSize },
    );
    setSending(false);
    if (err) { setError(err); return; }
    onSent(queued, batches);
    onClose();
  }

  const toggleProduct = (p: string) =>
    setProducts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const SLOTS = ['9:15 AM', '10:30 AM', '11:45 AM', '1:00 PM', '2:15 PM', '3:00 PM'];
  const numBatches = Math.ceil(totalEmailCount / batchSize);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}><Send size={18} color="#0F9B6E" /> Send Outreach</div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {leadsWithEmail.length} companies · {totalEmailCount} email addresses total
              {leadsWithout.length > 0 && <span style={{ color: '#DC2626' }}> · {leadsWithout.length} skipped (no email)</span>}
            </div>
          </div>
          <button onClick={onClose} style={S.iconBtn}><X size={20} /></button>
        </div>

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

          {/* Country */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>DESTINATION COUNTRY</label>
            <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...S.input }}>
              {ALL_COUNTRIES.map(c => <option key={c}>{c}</option>)}
              {!ALL_COUNTRIES.includes(country) && country && <option value={country}>{country}</option>}
            </select>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
              ⏰ Emails sent during 9AM–3PM {country} time · Timezone: {getTimezone(country)}
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
              {generating ? <Loader2 size={14} /> : <Sparkles size={14} />}
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
              EMAIL BODY <span style={{ fontWeight: 400, color: '#9CA3AF', marginLeft: 8 }}>{'{{company}}, {{contact}}, {{country}}'}</span>
            </label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
              style={{ ...S.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} placeholder="Email body…" />
          </div>

          {/* Batch size */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
              BATCH SIZE <span style={{ fontWeight: 400, color: '#9CA3AF' }}>per send slot</span>
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[10, 15, 20].map(s => (
                <button key={s} onClick={() => setBatchSize(s)}
                  style={{ padding: '6px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `2px solid ${batchSize === s ? '#0F9B6E' : '#e5e7eb'}`, background: batchSize === s ? '#ECFDF5' : '#fff', color: batchSize === s ? '#065F46' : '#374151' }}>
                  {s}
                </button>
              ))}
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>→ {numBatches} batches for {totalEmailCount} emails</span>
            </div>
          </div>

          {/* Schedule preview */}
          {totalEmailCount > 0 && (
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px', fontSize: 12, color: '#15803D' }}>
              <div style={{ fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} /> Batch Schedule — {country} time · Sat/Sun automatically pushed to Tuesday
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Array.from({ length: Math.min(numBatches, 6) }).map((_, i) => {
                  const slot  = SLOTS[i % SLOTS.length];
                  const day   = i >= SLOTS.length ? ' (next day)' : '';
                  const start = i * batchSize + 1;
                  const end   = Math.min((i + 1) * batchSize, totalEmailCount);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#DCFCE7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, color: '#15803D', flexShrink: 0 }}>{i + 1}</span>
                      <span><strong>{slot}{day}</strong> — {end - start + 1} emails (#{start}–#{end})</span>
                    </div>
                  );
                })}
                {numBatches > 6 && <div style={{ color: '#9CA3AF', fontStyle: 'italic' }}>+ {numBatches - 6} more batches on following days…</div>}
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={S.btnGhost}>Cancel</button>
          <button onClick={handleSend} disabled={sending}
            style={{ ...S.btn('#0F9B6E'), minWidth: 160, justifyContent: 'center', opacity: sending ? 0.7 : 1 }}>
            {sending ? <Loader2 size={14} /> : <Send size={14} />}
            {sending ? 'Queuing…' : `Send to ${leadsWithEmail.length} Companies`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Excel Import Modal ────────────────────────────────────────
function ExcelImportModal({ onClose, onImported }: { onClose: () => void; onImported: (count: number, dupes: number) => void }) {
  const { importFromExcel } = useOutreachLeads();
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [result, setResult]   = useState<{ imported: number; skipped: number; errors: string[]; duplicates: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    const buf  = await f.arrayBuffer();
    const wb   = XLSX.read(buf, { type: 'array' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
    const norm = rows.map(r => normaliseRow(r));
    setPreview(norm.slice(0, 5));
  }

  function normaliseRow(r: any) {
    const lower: any = {};
    for (const [k, v] of Object.entries(r)) lower[k.toLowerCase().replace(/[\s_]+/g, '_')] = v;
    return {
      company_name:   lower.company || lower.company_name || '',
      contact_person: lower.person  || lower.contact_person || lower.contact || '',
      email:          lower.email   || '',
      phone:          (lower.phone  || lower.phone_number || '').toString(),
      website:        lower.website || '',
      address:        lower.address || '',
      country:        lower.country || '',
    };
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    const buf  = await file.arrayBuffer();
    const wb   = XLSX.read(buf, { type: 'array' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
    const norm = rows.map(r => normaliseRow(r));
    const res  = await importFromExcel(norm, file.name);
    setResult(res);
    setLoading(false);
    if (res.imported > 0) onImported(res.imported, res.duplicates);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}><FileSpreadsheet size={18} color="#0F9B6E" /> Import Leads from Excel</div>
          <button onClick={onClose} style={S.iconBtn}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#0C4A6E' }}>
            <strong>Required columns:</strong> Company, Address, Person, Email, Phone Number, Website, Country<br />
            Duplicate emails (already queued or sent) will be skipped automatically.
          </div>
          <div onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            style={{ border: '2px dashed #e5e7eb', borderRadius: 12, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: file ? '#F0FDF4' : '#fafafa' }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <Upload size={28} color={file ? '#0F9B6E' : '#9CA3AF'} style={{ margin: '0 auto 10px' }} />
            {file ? (
              <div><div style={{ fontWeight: 600, color: '#0F9B6E' }}>{file.name}</div><div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{preview.length}+ rows · Click to change</div></div>
            ) : (
              <div><div style={{ fontWeight: 600, color: '#374151' }}>Drop Excel file here</div><div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>or click to browse · .xlsx .xls .csv</div></div>
            )}
          </div>
          {preview.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Preview (first 5 rows)</div>
              <div style={{ overflowX: 'auto', border: '1px solid #f3f4f6', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr>{['Company', 'Person', 'Email', 'Phone', 'Country'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
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
          {result && (
            <div style={{ background: result.imported > 0 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${result.imported > 0 ? '#BBF7D0' : '#FCA5A5'}`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: result.imported > 0 ? '#15803D' : '#DC2626', marginBottom: 6 }}>
                {result.imported > 0 ? `✓ ${result.imported} leads imported` : 'Import failed'}
              </div>
              {result.duplicates > 0 && <div style={{ fontSize: 12, color: '#D97706' }}>⚠ {result.duplicates} duplicates skipped (already queued/sent)</div>}
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
              {loading ? <Loader2 size={14} /> : <Upload size={14} />} Import Leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Follow-up Modal ───────────────────────────────────────────
function FollowUpModal({ queueRow, onClose, onSaved }: { queueRow: QueueRow; onClose: () => void; onSaved: () => void }) {
  const { setFollowUp } = useOutreachQueue();
  const [date, setDate] = useState(queueRow.follow_up_date || '');
  const [note, setNote] = useState(queueRow.follow_up_note || '');
  const [saving, setSaving] = useState(false);
  async function save() {
    if (!date) return;
    setSaving(true);
    await setFollowUp(queueRow.id, date, note);
    setSaving(false); onSaved(); onClose();
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={17} color="#EA580C" /> Schedule Follow-up</div>
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
            {saving ? <Loader2 size={13} /> : <Check size={13} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LEADS TABLE — reusable for Fresh Leads and All Leads tabs
// ═══════════════════════════════════════════════════════════════
function LeadsTable({
  leads, loading, selectedIds, onToggle, onToggleAll,
  onUpdate, onDelete, showStatus, onSendOutreach,
}: {
  leads: OutreachLead[];
  loading: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onUpdate: (id: string, patch: Partial<OutreachLead>) => void;
  onDelete: (id: string) => void;
  showStatus: boolean;
  onSendOutreach?: () => void;
}) {
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader2 size={20} style={{ margin: '0 auto 8px' }} /><div>Loading…</div></div>;
  if (leads.length === 0) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
      <Upload size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No leads yet</div>
      <div style={{ fontSize: 12 }}>Import from Excel or save leads from LeadRadar.</div>
    </div>
  );

  const allSelected = selectedIds.size === leads.length && leads.length > 0;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: 40 }}><input type="checkbox" checked={allSelected} onChange={onToggleAll} /></th>
            {showStatus && <th style={S.th}>Status</th>}
            <th style={S.th}>Company</th>
            <th style={S.th}>Contact</th>
            <th style={S.th}>Email(s)</th>
            <th style={S.th}>Phone</th>
            <th style={S.th}>Website</th>
            <th style={S.th}>Country</th>
            <th style={S.th}>Source</th>
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => {
            const allEmails = cleanEmails([lead.email, ...(lead.emails || [])]);
            return (
              <tr key={lead.id} style={{ background: selectedIds.has(lead.id) ? '#F0FDF4' : 'transparent' }}>
                <td style={S.td}><input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => onToggle(lead.id)} /></td>
                {showStatus && <td style={S.td}><LeadStatusBadge status={lead.lead_status || 'fresh'} /></td>}
                <td style={S.td}><EditCell value={lead.company_name} placeholder="Company" onSave={v => onUpdate(lead.id, { company_name: v })} /></td>
                <td style={S.td}><EditCell value={lead.contact_person || ''} placeholder="Contact" onSave={v => onUpdate(lead.id, { contact_person: v })} /></td>
                <td style={S.td}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {allEmails.length > 0
                      ? allEmails.map((e, i) => <span key={i} style={{ fontSize: 11, color: '#374151' }}>{e}</span>)
                      : <EditCell value="" placeholder="email@…" type="email" onSave={v => onUpdate(lead.id, { email: v })} />
                    }
                    {allEmails.length > 1 && <span style={{ fontSize: 10, color: '#9CA3AF' }}>{allEmails.length} emails → all will be queued</span>}
                  </div>
                </td>
                <td style={S.td}><EditCell value={lead.phone || ''} placeholder="+…" onSave={v => onUpdate(lead.id, { phone: v })} /></td>
                <td style={S.td}><EditCell value={lead.website || ''} placeholder="website.com" onSave={v => onUpdate(lead.id, { website: v })} /></td>
                <td style={S.td}><EditCell value={lead.country || ''} placeholder="Country" onSave={v => onUpdate(lead.id, { country: v })} /></td>
                <td style={S.td}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: lead.source === 'excel_import' ? '#EFF6FF' : lead.source === 'leadradar' ? '#ECFDF5' : '#F3F4F6', color: lead.source === 'excel_import' ? '#2563EB' : lead.source === 'leadradar' ? '#059669' : '#6B7280', fontWeight: 600 }}>
                    {lead.source === 'excel_import' ? 'Excel' : lead.source === 'leadradar' ? 'LeadRadar' : 'Manual'}
                  </span>
                </td>
                <td style={S.td}>
                  <button onClick={() => onDelete(lead.id)} style={{ ...S.iconBtn, color: '#9CA3AF' }} title="Delete"><Trash2 size={13} /></button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function OutreachTrackerV2() {
  const { user }              = useAuth();
  const { toasts, toast }     = useToast();

  type Tab = 'fresh' | 'all' | 'outreach' | 'campaigns';
  const [tab, setTab] = useState<Tab>('fresh');

  // ── Leads state ────────────────────────────────────────────
  const { leads, loading: leadsLoading, fetchLeads, updateLead, deleteLead, deleteMany } = useOutreachLeads();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [leadSearch, setLeadSearch]   = useState('');
  const [showImport, setShowImport]   = useState(false);
  const [showSend, setShowSend]       = useState(false);
  const [defaultCountry, setDefaultCountry] = useState('UAE');

  // ── Outreach state ─────────────────────────────────────────
  const { rows, loading: queueLoading, fetchRows, updateManualStatus } = useOutreachQueue();
  const [qSearch, setQSearch]             = useState('');
  const [qStatusFilter, setQStatusFilter] = useState('all');
  const [qManualFilter, setQManualFilter] = useState('all');
  const [historyId, setHistoryId]         = useState<string | null>(null);
  const [followUpRow, setFollowUpRow]     = useState<QueueRow | null>(null);

  // ── Campaigns state ────────────────────────────────────────
  const { campaigns, loading: campLoading, fetchCampaigns } = useCampaigns();

  // Load on mount and tab change
  useEffect(() => { fetchLeads(); }, []);
  useEffect(() => { if (tab === 'outreach') fetchRows(); }, [tab]);
  useEffect(() => { if (tab === 'campaigns') fetchCampaigns(); }, [tab]);

  // ── Filtered leads ─────────────────────────────────────────
  const freshLeads = leads.filter(l => (l.lead_status || 'fresh') === 'fresh');
  const allLeads   = leads;

  function filterLeads(list: OutreachLead[]) {
    if (!leadSearch) return list;
    const q = leadSearch.toLowerCase();
    return list.filter(l => (l.company_name + l.email + l.country + l.contact_person).toLowerCase().includes(q));
  }

  const displayFresh = filterLeads(freshLeads);
  const displayAll   = filterLeads(allLeads);

  // ── Filtered queue ─────────────────────────────────────────
  const filteredRows = rows.filter(r => {
    if (qStatusFilter !== 'all' && r.status !== qStatusFilter) return false;
    if (qManualFilter !== 'all' && r.manual_status !== qManualFilter) return false;
    if (qSearch) {
      const q = qSearch.toLowerCase();
      if (!(r.company_name + r.to_email + r.country + r.campaign_name).toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Select helpers ─────────────────────────────────────────
  const currentList = tab === 'fresh' ? displayFresh : displayAll;

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    if (selectedIds.size === currentList.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(currentList.map(l => l.id)));
  }

  const selectedLeads = leads.filter(l => selectedIds.has(l.id));

  function handleSendOutreach() {
    if (selectedIds.size === 0) { toast('Select at least one lead first.', 'error'); return; }
    const countries = [...new Set(selectedLeads.map(l => l.country).filter(Boolean))];
    setDefaultCountry(countries[0] || 'UAE');
    setShowSend(true);
  }

  // ── Tab config ─────────────────────────────────────────────
  const tabs = [
    { id: 'fresh' as Tab,    label: 'Fresh Leads', icon: Leaf,     count: freshLeads.length,    color: '#059669' },
    { id: 'all' as Tab,      label: 'All Leads',   icon: Users,    count: allLeads.length,      color: '#374151' },
    { id: 'outreach' as Tab, label: 'Outreach',    icon: Inbox,    count: rows.length,          color: '#374151' },
    { id: 'campaigns' as Tab,label: 'Campaigns',   icon: BarChart3,count: campaigns.length,     color: '#374151' },
  ];

  // ── Shared leads toolbar ───────────────────────────────────
  function LeadsToolbar({ showImportBtn }: { showImportBtn: boolean }) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} style={{ ...S.input, paddingLeft: 32 }} placeholder="Search leads…" />
        </div>
        {showImportBtn && (
          <button onClick={() => setShowImport(true)} style={S.btnGhost}>
            <FileSpreadsheet size={14} /> Import Excel
          </button>
        )}
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
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100%' }}>
      <Toasts toasts={toasts} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedIds(new Set()); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none', borderBottom: `2px solid ${tab === t.id ? '#0F9B6E' : 'transparent'}`, color: tab === t.id ? '#0F9B6E' : '#6B7280' }}>
            <t.icon size={15} /> {t.label}
            <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 20, background: tab === t.id ? '#ECFDF5' : '#f3f4f6', color: tab === t.id ? '#065F46' : '#9CA3AF' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── FRESH LEADS TAB ─────────────────────────────────── */}
      {tab === 'fresh' && (
        <div>
          <LeadsToolbar showImportBtn={true} />
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <LeadsTable
              leads={displayFresh} loading={leadsLoading}
              selectedIds={selectedIds} onToggle={toggleSelect} onToggleAll={toggleAll}
              onUpdate={updateLead} onDelete={deleteLead}
              showStatus={false} onSendOutreach={handleSendOutreach}
            />
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
            {displayFresh.length} fresh leads · {displayFresh.filter(l => cleanEmails([l.email, ...(l.emails || [])]).length > 0).length} with email · Click any cell to edit inline
          </div>
        </div>
      )}

      {/* ── ALL LEADS TAB ───────────────────────────────────── */}
      {tab === 'all' && (
        <div>
          <LeadsToolbar showImportBtn={false} />
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <LeadsTable
              leads={displayAll} loading={leadsLoading}
              selectedIds={selectedIds} onToggle={toggleSelect} onToggleAll={toggleAll}
              onUpdate={updateLead} onDelete={deleteLead}
              showStatus={true}
            />
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, display: 'flex', gap: 12 }}>
            <span>Total: {allLeads.length}</span>
            {(['fresh', 'queued', 'sent', 'cancelled'] as LeadStatus[]).map(s => (
              <span key={s} style={{ color: LEAD_STATUS_CFG[s].color }}>
                {LEAD_STATUS_CFG[s].label}: {allLeads.filter(l => (l.lead_status || 'fresh') === s).length}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── OUTREACH TAB ────────────────────────────────────── */}
      {tab === 'outreach' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            {queueLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader2 size={20} style={{ margin: '0 auto 8px' }} /></div>
            ) : filteredRows.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
                <Inbox size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No outreach yet</div>
                <div style={{ fontSize: 12 }}>Go to Fresh Leads → select leads → Send Outreach.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Company', 'Email', 'Country', 'Campaign', 'Delivery', 'Reply Status', 'Scheduled', 'Sent', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(row => (
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
                            <select value={row.manual_status || ''} onChange={e => updateManualStatus(row.id, (e.target.value as ManualStatus) || null)}
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
                            <div><div style={{ fontSize: 11, color: '#374151' }}>{formatSendTimeIST(row.scheduled_at)}</div><div style={{ fontSize: 10, color: '#9CA3AF' }}>IST</div></div>
                          ) : '—'}
                        </td>
                        <td style={S.td}>
                          {row.sent_at ? <div style={{ fontSize: 11, color: '#374151' }}>{new Date(row.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} IST</div> : '—'}
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button onClick={() => setHistoryId(row.id)} style={S.iconBtn} title="View history"><History size={14} /></button>
                            <button onClick={() => setFollowUpRow(row)} style={S.iconBtn} title="Follow-up"><Bell size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{filteredRows.length} records</div>
        </div>
      )}

      {/* ── CAMPAIGNS TAB ───────────────────────────────────── */}
      {tab === 'campaigns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={fetchCampaigns} style={S.btnGhost}><RefreshCw size={13} /> Refresh</button>
          </div>
          {campLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}><Loader2 size={20} style={{ margin: '0 auto 8px' }} /></div>
          ) : campaigns.length === 0 ? (
            <div style={{ ...S.card, padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
              <BarChart3 size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No campaigns yet</div>
            </div>
          ) : (
            campaigns.map(c => {
              const total = c.total_leads || 0;
              const sent  = c.sent_count || 0;
              const pct   = total > 0 ? Math.round((sent / total) * 100) : 0;
              return (
                <div key={c.id} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                        {c.destination_country} · {c.destination_tz} · {new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      {c.products?.length > 0 && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Products: {c.products.join(', ')}</div>}
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 12px', borderRadius: 20, background: (c.campaign_status ?? c.status) === 'active' ? '#ECFDF5' : '#F3F4F6', color: (c.campaign_status ?? c.status) === 'active' ? '#059669' : '#6B7280', fontWeight: 600 }}>
                      {c.campaign_status ?? c.status}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 10, marginTop: 16 }}>
                    {[
                      { label: 'Total',     value: total,                    color: '#6B7280' },
                      { label: 'Queued',    value: c.queued_count || 0,      color: '#6B7280' },
                      { label: 'Sent',      value: sent,                     color: '#2563EB' },
                      { label: 'Delivered', value: c.delivered_count || 0,   color: '#0891B2' },
                      { label: 'Opened',    value: c.opened_count || 0,      color: '#059669' },
                      { label: 'Bounced',   value: c.bounced_count || 0,     color: '#DC2626' },
                      { label: 'Replied',   value: c.replied_count || 0,     color: '#7C3AED' },
                      { label: 'Interested',value: c.interested_count || 0,  color: '#D97706' },
                    ].map(stat => (
                      <div key={stat.label} style={{ textAlign: 'center', padding: '10px 8px', background: '#fafafa', borderRadius: 8 }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>
                      <span>Send progress</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#0F9B6E,#38BFA1)', borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {showImport && (
        <ExcelImportModal
          onClose={() => setShowImport(false)}
          onImported={(count, dupes) => {
            fetchLeads();
            toast(`${count} leads imported${dupes > 0 ? ` · ${dupes} duplicates skipped` : ''}`, 'success');
          }}
        />
      )}
      {showSend && (
        <SendOutreachModal
          leads={selectedLeads} defaultCountry={defaultCountry}
          onClose={() => setShowSend(false)}
          onSent={(queued, batches) => {
            toast(`${queued} emails queued in ${batches} batches — sends during buyer's morning hours (Sat/Sun → Tuesday).`, 'success');
            setSelectedIds(new Set());
            fetchLeads();
            setTab('outreach');
            fetchRows();
          }}
        />
      )}
      {historyId && <HistoryModal queueId={historyId} onClose={() => setHistoryId(null)} />}
      {followUpRow && (
        <FollowUpModal queueRow={followUpRow} onClose={() => setFollowUpRow(null)}
          onSaved={() => { fetchRows(); toast('Follow-up scheduled!', 'success'); }} />
      )}
    </div>
  );
}