import { useState, useEffect, useRef } from 'react';
import {
  Send, Clock, ThumbsDown, RefreshCw, UserCheck,
  Plus, Trash2, Edit2, X, Upload, Paperclip,
  ChevronDown, Eye, Tag, Save, CheckCircle,
  Mail, Phone, Globe, Building2, AlertCircle,
} from 'lucide-react';
import {
  useOutreach, useTemplates, useBrochures,
  sendOutreachEmails, replaceTags, AVAILABLE_TAGS,
  type OutreachLead, type OutreachStatus, type EmailTemplate,
} from './useOutreach';

// ── Shared styles ─────────────────────────────────────────────
const S = {
  card:    { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 } as React.CSSProperties,
  th:      { padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' as const, textAlign: 'left' as const, borderBottom: '1px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' as const },
  td:      { padding: '10px 14px', fontSize: 13, borderBottom: '1px solid #f9fafb', verticalAlign: 'middle' as const },
  input:   { border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: '100%', background: '#fff', fontFamily: 'inherit' } as React.CSSProperties,
  btn:     { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid transparent', transition: 'all .15s' } as React.CSSProperties,
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', color: '#9CA3AF' } as React.CSSProperties,
};

const TABS: { key: OutreachStatus | 'ready'; label: string; icon: any; color: string }[] = [
  { key: 'ready',         label: 'Ready for Outreach', icon: Send,       color: '#0F9B6E' },
  { key: 'sent',          label: 'Outreach Sent',       icon: CheckCircle,color: '#3B82F6' },
  { key: 'not_interested',label: 'Not Interested',      icon: ThumbsDown, color: '#EF4444' },
  { key: 'follow_up',     label: 'Follow Up',           icon: RefreshCw,  color: '#F59E0B' },
];

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: OutreachStatus }) {
  const map: Record<OutreachStatus, { label: string; color: string; bg: string }> = {
    ready:          { label: 'Ready',         color: '#0F9B6E', bg: '#f0fdf4' },
    sent:           { label: 'Sent',          color: '#3B82F6', bg: '#EFF6FF' },
    not_interested: { label: 'Not Interested',color: '#EF4444', bg: '#FEF2F2' },
    follow_up:      { label: 'Follow Up',     color: '#F59E0B', bg: '#FFFBEB' },
    converted:      { label: 'Converted ✓',   color: '#7C3AED', bg: '#F5F3FF' },
  };
  const s = map[status] || map.ready;
  return (
    <span style={{ fontSize: 11, fontWeight: 500, color: s.color, background: s.bg, padding: '3px 9px', borderRadius: 20 }}>
      {s.label}
    </span>
  );
}

// ── Editable cell ─────────────────────────────────────────────
function EditableCell({ value, onSave, placeholder }: { value?: string; onSave: (v: string) => void; placeholder?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value || '');
  const ref                   = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(value || ''); }, [value]);

  function commit() {
    setEditing(false);
    if (val !== value) onSave(val);
  }

  if (editing) return (
    <input
      ref={ref}
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setVal(value||''); setEditing(false); } }}
      style={{ ...S.input, padding: '4px 8px', fontSize: 12, width: '100%' }}
    />
  );

  return (
    <div
      onClick={() => setEditing(true)}
      style={{ cursor: 'text', minWidth: 80, minHeight: 22, fontSize: 12, color: val ? '#111' : '#ccc', display: 'flex', alignItems: 'center', gap: 4 }}
      title="Click to edit"
    >
      {val || placeholder || '—'}
      <Edit2 size={10} style={{ opacity: 0.3, flexShrink: 0 }} />
    </div>
  );
}

// ── Compose modal ─────────────────────────────────────────────
function ComposeModal({
  recipients,
  onClose,
  onSent,
}: {
  recipients: OutreachLead[];
  onClose: () => void;
  onSent: (ids: string[], subject: string, body: string) => void;
}) {
  const { templates, fetchTemplates } = useTemplates();
  const { brochures, fetchBrochures, uploadBrochure, getBrochureBase64 } = useBrochures();

  const [subject, setSubject]             = useState('');
  const [body, setBody]                   = useState('');
  const [selectedBrochures, setSelBro]    = useState<string[]>([]);
  const [preview, setPreview]             = useState(false);
  const [sending, setSending]             = useState(false);
  const [progress, setProgress]           = useState('');
  const [activeTemplate, setActiveTempl]  = useState<string>('');
  const bodyRef                           = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchTemplates().then(ts => {
      const def = ts.find(t => t.is_default) || ts[0];
      if (def) { setSubject(def.subject); setBody(def.body); setActiveTempl(def.id); }
    });
    fetchBrochures();
  }, []);

  function loadTemplate(id: string) {
    const t = templates.find(x => x.id === id);
    if (t) { setSubject(t.subject); setBody(t.body); setActiveTempl(id); }
  }

  function insertTag(tag: string) {
    const ta = bodyRef.current;
    if (!ta) { setBody(b => b + tag); return; }
    const start = ta.selectionStart || 0;
    const end   = ta.selectionEnd   || 0;
    const newBody = body.slice(0, start) + tag + body.slice(end);
    setBody(newBody);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + tag.length; ta.focus(); }, 0);
  }

  function toggleBrochure(id: string) {
    setSelBro(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) { alert('Subject and body are required'); return; }
    const toSend = recipients.filter(r => r.email);
    if (!toSend.length) { alert('No recipients have an email address'); return; }

    setSending(true);
    setProgress(`Preparing attachments...`);

    // Fetch brochure base64
    const selectedBros = brochures.filter(b => selectedBrochures.includes(b.id));
    const attachments: { filename: string; content: string }[] = [];
    for (const bro of selectedBros) {
      const b64 = await getBrochureBase64(bro);
      if (b64) attachments.push({ filename: bro.filename, content: b64 });
    }

    setProgress(`Sending to ${toSend.length} companies...`);
    const result = await sendOutreachEmails({ recipients: toSend, subject, body, attachments });

    setProgress(`✅ Sent: ${result.sent}  ❌ Failed: ${result.failed}`);

    // Mark as sent in DB
    const sentIds = result.results.filter(r => r.success).map(r => r.id);
    if (sentIds.length) onSent(sentIds, subject, body);

    setTimeout(() => { if (result.failed === 0) onClose(); }, 2500);
    setSending(false);
  }

  const previewLead = recipients[0];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ ...S.card, width: '100%', maxWidth: 820, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Compose outreach email</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{recipients.length} recipient{recipients.length > 1 ? 's' : ''} · {recipients.filter(r=>r.email).length} with email</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setPreview(!preview)}
              style={{ ...S.btn, background: preview ? '#f0fdf4' : '#f9fafb', color: preview ? '#0F9B6E' : '#6B7280', border: '1px solid #e5e7eb' }}
            >
              <Eye size={14} /> {preview ? 'Edit' : 'Preview'}
            </button>
            <button onClick={onClose} style={S.iconBtn}><X size={18} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

          {/* Template selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>Template:</span>
            <select
              value={activeTemplate}
              onChange={e => loadTemplate(e.target.value)}
              style={{ ...S.input, maxWidth: 260 }}
            >
              <option value="">— Select template —</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {!preview ? (
            <>
              {/* Subject */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                  Subject
                </label>
                <input value={subject} onChange={e => setSubject(e.target.value)} style={S.input} placeholder="Email subject line…" />
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Use [Company Name], [Country] etc. for personalization</div>
              </div>

              {/* Dynamic tags toolbar */}
              <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={11}/> Insert tag:</span>
                {AVAILABLE_TAGS.map(({ tag, desc }) => (
                  <button
                    key={tag}
                    onClick={() => insertTag(tag)}
                    title={desc}
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '1px solid #d1fae5', background: '#f0fdf4', color: '#0F9B6E', cursor: 'pointer' }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                  Email body (HTML supported)
                </label>
                <textarea
                  ref={bodyRef}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  style={{ ...S.input, minHeight: 280, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>
            </>
          ) : (
            /* Preview */
            <div style={{ marginBottom: 14 }}>
              <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 12 }}>
                <span style={{ color: '#9CA3AF' }}>Preview for: </span>
                <strong>{previewLead?.company_name}</strong>
                {previewLead?.country && <span style={{ color: '#6B7280' }}> — {previewLead.country}</span>}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                <strong>Subject:</strong> {replaceTags(subject, previewLead || {})}
              </div>
              <div
                style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.7, background: '#fff', maxHeight: 380, overflow: 'auto' }}
                dangerouslySetInnerHTML={{ __html: replaceTags(body, previewLead || {}) }}
              />
            </div>
          )}

          {/* Brochures */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              <Paperclip size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Attachments (brochures)
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {brochures.map(b => (
                <label key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 8, border: `1.5px solid ${selectedBrochures.includes(b.id) ? '#0F9B6E' : '#e5e7eb'}`,
                  background: selectedBrochures.includes(b.id) ? '#f0fdf4' : '#fff',
                  cursor: 'pointer', fontSize: 12,
                }}>
                  <input type="checkbox" checked={selectedBrochures.includes(b.id)} onChange={() => toggleBrochure(b.id)} style={{ accentColor: '#0F9B6E' }} />
                  {b.name}
                  <span style={{ color: '#9CA3AF', fontSize: 10 }}>({Math.round((b.size_bytes || 0) / 1024)}KB)</span>
                </label>
              ))}
              <UploadBrochureButton onUpload={bro => { fetchBrochures(); setSelBro(prev => [...prev, bro.id]); }} uploadFn={uploadBrochure} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 13, color: progress.includes('✅') ? '#0F9B6E' : progress.includes('❌') ? '#EF4444' : '#6B7280' }}>
            {progress}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ ...S.btn, background: '#f9fafb', color: '#6B7280', border: '1px solid #e5e7eb' }}>Cancel</button>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{ ...S.btn, background: sending ? '#9CA3AF' : '#0F9B6E', color: '#fff' }}
            >
              <Send size={14} />
              {sending ? 'Sending…' : `Send to ${recipients.filter(r=>r.email).length} companies`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload brochure button ────────────────────────────────────
function UploadBrochureButton({ onUpload, uploadFn }: { onUpload: (b: any) => void; uploadFn: (f: File) => Promise<any> }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const bro = await uploadFn(file);
    if (bro) onUpload(bro);
    setUploading(false);
    if (ref.current) ref.current.value = '';
  }

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1.5px dashed #e5e7eb', cursor: 'pointer', fontSize: 12, color: '#9CA3AF' }}>
      <Upload size={13} />
      {uploading ? 'Uploading…' : 'Upload PDF'}
      <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFile} />
    </label>
  );
}

// ── Convert to buyer modal ────────────────────────────────────
function ConvertModal({ lead, onClose, onConverted }: { lead: OutreachLead; onClose: () => void; onConverted: () => void }) {
  const { convertToBuyer } = useOutreach();
  const [saving, setSaving] = useState(false);

  async function handle() {
    setSaving(true);
    const ok = await convertToBuyer(lead);
    setSaving(false);
    if (ok) { onConverted(); onClose(); }
    else alert('Error converting — check Supabase logs');
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...S.card, maxWidth: 420, width: '100%', padding: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Convert to Buyer</div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          This will save <strong>{lead.company_name}</strong> to your Customers table and mark this lead as Converted.
        </p>
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 20 }}>
          <div><strong>Company:</strong> {lead.company_name}</div>
          {lead.email   && <div><strong>Email:</strong> {lead.email}</div>}
          {lead.phone   && <div><strong>Phone:</strong> {lead.phone}</div>}
          {lead.country && <div><strong>Country:</strong> {lead.country}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...S.btn, background: '#f9fafb', color: '#6B7280', border: '1px solid #e5e7eb' }}>Cancel</button>
          <button onClick={handle} disabled={saving} style={{ ...S.btn, background: '#7C3AED', color: '#fff' }}>
            <UserCheck size={14} />
            {saving ? 'Saving…' : 'Convert to Buyer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Leads table ───────────────────────────────────────────────
function LeadsTable({
  leads,
  activeTab,
  onSelect,
  selected,
  onUpdate,
  onStatusChange,
  onConvert,
  onDelete,
}: {
  leads: OutreachLead[];
  activeTab: string;
  onSelect: (ids: string[]) => void;
  selected: string[];
  onUpdate: (id: string, field: string, value: string) => void;
  onStatusChange: (id: string, status: OutreachStatus) => void;
  onConvert: (lead: OutreachLead) => void;
  onDelete: (id: string) => void;
}) {
  function toggleAll() {
    onSelect(selected.length === leads.length ? [] : leads.map(l => l.id));
  }
  function toggle(id: string) {
    onSelect(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  if (!leads.length) return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9CA3AF' }}>
      <Building2 size={36} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
      <p style={{ fontSize: 14 }}>No leads here yet</p>
    </div>
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: 36 }}>
              <input type="checkbox" checked={selected.length === leads.length && leads.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} />
            </th>
            <th style={S.th}>Company</th>
            <th style={S.th}>Email</th>
            <th style={S.th}>Phone</th>
            <th style={S.th}>Country</th>
            <th style={S.th}>Status</th>
            {activeTab === 'sent'      && <th style={S.th}>Sent at</th>}
            {activeTab === 'follow_up' && <th style={S.th}>Follow up</th>}
            <th style={S.th}></th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead.id} style={{ background: selected.includes(lead.id) ? '#f0fdf4' : '#fff' }}>
              <td style={S.td}><input type="checkbox" checked={selected.includes(lead.id)} onChange={() => toggle(lead.id)} style={{ cursor: 'pointer' }} /></td>

              <td style={S.td}>
                <EditableCell value={lead.company_name} onSave={v => onUpdate(lead.id, 'company_name', v)} placeholder="Company name" />
                {lead.website && <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2, textDecoration: 'none' }}><Globe size={10}/>{lead.website.replace(/^https?:\/\/(www\.)?/,'').split('/')[0]}</a>}
              </td>

              <td style={S.td}>
                <EditableCell value={lead.email} onSave={v => onUpdate(lead.id, 'email', v)} placeholder="email@company.com" />
              </td>

              <td style={S.td}>
                <EditableCell value={lead.phone} onSave={v => onUpdate(lead.id, 'phone', v)} placeholder="+1 234 567" />
              </td>

              <td style={{ ...S.td, color: '#6B7280', fontSize: 12 }}>{lead.country || '—'}</td>

              <td style={S.td}>
                <select
                  value={lead.status}
                  onChange={e => onStatusChange(lead.id, e.target.value as OutreachStatus)}
                  style={{ fontSize: 11, border: 'none', background: 'transparent', cursor: 'pointer', color: '#111' }}
                >
                  <option value="ready">Ready</option>
                  <option value="sent">Sent</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="converted">Converted</option>
                </select>
              </td>

              {activeTab === 'sent' && (
                <td style={{ ...S.td, fontSize: 11, color: '#9CA3AF' }}>
                  {lead.sent_at ? new Date(lead.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </td>
              )}

              {activeTab === 'follow_up' && (
                <td style={S.td}>
                  <input
                    type="date"
                    value={lead.follow_up_date || ''}
                    onChange={e => onUpdate(lead.id, 'follow_up_date', e.target.value)}
                    style={{ ...S.input, padding: '4px 8px', fontSize: 12, width: 'auto' }}
                  />
                </td>
              )}

              <td style={S.td}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => onConvert(lead)} title="Convert to buyer" style={{ ...S.iconBtn, color: '#7C3AED' }}><UserCheck size={14}/></button>
                  <button onClick={() => onDelete(lead.id)} title="Delete" style={{ ...S.iconBtn, color: '#EF4444' }}><Trash2 size={14}/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Outreach page ────────────────────────────────────────
export default function OutreachPage() {
  const { leads, loading, fetchByStatus, addLeads, updateLead, updateStatus, markSent, deleteLead } = useOutreach();
  const [activeTab, setActiveTab]     = useState<OutreachStatus>('ready');
  const [selected, setSelected]       = useState<string[]>([]);
  const [composing, setComposing]     = useState(false);
  const [convertTarget, setConvert]   = useState<OutreachLead | null>(null);

  useEffect(() => {
    fetchByStatus(activeTab);
    setSelected([]);
  }, [activeTab]);

  async function handleUpdate(id: string, field: string, value: string) {
    await updateLead(id, { [field]: value } as any);
  }

  async function handleStatusChange(id: string, status: OutreachStatus) {
    await updateStatus([id], status);
    fetchByStatus(activeTab);
  }

  async function handleSent(ids: string[], subject: string, body: string) {
    await markSent(ids, subject, body);
    setSelected([]);
    setComposing(false);
    fetchByStatus(activeTab);
  }

  const selectedLeads = leads.filter(l => selected.includes(l.id));
  const counts        = { ready: 0, sent: 0, not_interested: 0, follow_up: 0 };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Inter', sans-serif", color: '#1a1a1a' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Outreach</div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>Manage and send outreach emails to potential buyers</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f9fafb', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as OutreachStatus)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 400,
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? tab.color : '#6B7280',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all .15s',
              }}
            >
              <Icon size={14} style={{ color: isActive ? tab.color : '#9CA3AF' }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Action bar */}
      <div style={{ ...S.card, padding: '12px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          {leads.length} lead{leads.length !== 1 ? 's' : ''}
          {selected.length > 0 && ` · ${selected.length} selected`}
        </span>

        {selected.length > 0 && activeTab === 'ready' && (
          <button onClick={() => setComposing(true)} style={{ ...S.btn, background: '#0F9B6E', color: '#fff' }}>
            <Send size={14} /> Compose & Send ({selected.length})
          </button>
        )}

        {selected.length > 0 && (
          <>
            {activeTab !== 'follow_up'      && <button onClick={() => { updateStatus(selected, 'follow_up');     fetchByStatus(activeTab); setSelected([]); }} style={{ ...S.btn, background: '#FFFBEB', color: '#F59E0B', border: '1px solid #FDE68A' }}><RefreshCw size={13}/> Move to Follow Up</button>}
            {activeTab !== 'not_interested'  && <button onClick={() => { updateStatus(selected, 'not_interested'); fetchByStatus(activeTab); setSelected([]); }} style={{ ...S.btn, background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}><ThumbsDown size={13}/> Not Interested</button>}
          </>
        )}
      </div>

      {/* Table */}
      <div style={S.card}>
        {loading
          ? <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading…</div>
          : <LeadsTable
              leads={leads}
              activeTab={activeTab}
              selected={selected}
              onSelect={setSelected}
              onUpdate={handleUpdate}
              onStatusChange={handleStatusChange}
              onConvert={setConvert}
              onDelete={id => { deleteLead(id); }}
            />
        }
      </div>

      {/* Compose modal */}
      {composing && (
        <ComposeModal
          recipients={selectedLeads}
          onClose={() => setComposing(false)}
          onSent={handleSent}
        />
      )}

      {/* Convert to buyer modal */}
      {convertTarget && (
        <ConvertModal
          lead={convertTarget}
          onClose={() => setConvert(null)}
          onConverted={() => { fetchByStatus(activeTab); setConvert(null); }}
        />
      )}
    </div>
  );
}
