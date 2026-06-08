/**
 * CRMProducts.tsx
 * Dynamic Product Management — replaces src/crm/pages/Products.tsx
 *
 * Structure:
 *   - Left panel: Product Categories (website-level products)
 *   - Right panel: Variants under selected category
 *   - "Add Category" → opens full modal with all website page fields
 *   - "Add Variant" → simple modal for variant details
 *   - "View on Website" → links to /products/:slug
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit2, Globe, Eye, Package,
  ChevronRight, X, Check, Loader2, AlertCircle,
  GripVertical, Tag, FileText, Image as ImageIcon,
  ExternalLink, ToggleLeft, ToggleRight, Search,
  Layers, List, Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Types ─────────────────────────────────────────────────────
interface Spec { label: string; value: string; }

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  category_group: string;
  is_active: boolean;
  sort_order: number;
  page_title: string | null;
  page_subtitle: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  hero_bullets: string[] | null;
  origin: string | null;
  moq: string | null;
  supply_capacity: string | null;
  specs: Spec[] | null;
  overview_title: string | null;
  overview_text: string | null;
  image_path: string | null;
  color: string | null;
  hs_code: string | null;
  unit: string;
  purchase_price: number | null;
  created_at: string;
}

interface ProductVariant {
  id: string;
  category_id: string;
  name: string;
  grade: string | null;
  hs_code: string | null;
  unit: string;
  purchase_price: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Style tokens ──────────────────────────────────────────────
const S = {
  input: {
    border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px',
    fontSize: 13, outline: 'none', width: '100%', background: '#fff',
    fontFamily: 'inherit', color: '#111',
  } as React.CSSProperties,
  label: { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 } as React.CSSProperties,
  btn:   (bg = '#0F9B6E') => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: bg, color: '#fff' }) as React.CSSProperties,
  ghost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' } as React.CSSProperties,
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, display: 'flex', alignItems: 'center', color: '#9CA3AF' } as React.CSSProperties,
};

const GROUPS = ['spices', 'agri-products', 'value-added', 'sea-foods'];
const UNITS  = ['KG', 'MT', 'PCS', 'BAG', 'CTN', 'LTR', 'TON'];

// ── Slug generator ────────────────────────────────────────────
function toSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Empty forms ───────────────────────────────────────────────
const emptyCat = (): Partial<ProductCategory> => ({
  name: '', slug: '', category_group: 'spices', is_active: true, sort_order: 0,
  color: '',
  page_title: '', page_subtitle: '', meta_title: '', meta_description: '', meta_keywords: '',
  hero_bullets: ['', '', '', '', ''],
  origin: '', moq: '', supply_capacity: '',
  specs: [
    { label: 'Origin', value: '' }, { label: 'HS Code', value: '' },
    { label: 'Grades', value: '' }, { label: 'Moisture', value: '' },
    { label: 'MOQ', value: '' },    { label: 'Certifications', value: '' },
  ],
  overview_title: '', overview_text: '',
  image_path: '', hs_code: '', unit: 'KG', purchase_price: null,
});

const emptyVar = (): Partial<ProductVariant> => ({
  name: '', grade: '', hs_code: '', unit: 'KG', purchase_price: null,
  description: '', is_active: true,
});

// ── Category Modal ────────────────────────────────────────────
function CategoryModal({
  initial, onSave, onClose,
}: {
  initial: Partial<ProductCategory>;
  onSave: (data: Partial<ProductCategory>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm]     = useState<Partial<ProductCategory>>(initial);
  const [saving, setSaving]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'page' | 'specs'>('basic');

  const set = (k: keyof ProductCategory, v: any) => setForm(f => ({ ...f, [k]: v }));

  // ── AI Auto-Fill ─────────────────────────────────────────────
  async function handleAIFill() {
    if (!form.name?.trim()) { setError('Enter the product name first.'); return; }
    setError('');
    setGenerating(true);

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
          type:         'generate_product',
          product_name: form.name.trim(),
          category:     form.category_group || 'spices',
        }),
      });

      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();

      if (data?.error) throw new Error(data.error);

      // Apply all generated fields to form
      setForm(f => ({
        ...f,
        page_title:       data.page_title       || f.page_title,
        page_subtitle:    data.page_subtitle     || f.page_subtitle,
        meta_title:       data.meta_title        || f.meta_title,
        meta_description: data.meta_description  || f.meta_description,
        meta_keywords:    data.meta_keywords     || f.meta_keywords,
        hero_bullets:     data.hero_bullets      || f.hero_bullets,
        origin:           data.origin            || f.origin,
        moq:              data.moq               || f.moq,
        supply_capacity:  data.supply_capacity   || f.supply_capacity,
        hs_code:          data.hs_code           || f.hs_code,
        overview_title:   data.overview_title    || f.overview_title,
        overview_text:    data.overview_text     || f.overview_text,
        specs:            data.specs             || f.specs,
      }));

      // Switch to page tab so user can see what was generated
      setActiveTab('page');
    } catch (e: any) {
      setError(e.message || 'AI fill failed. Please try again.');
    }
    setGenerating(false);
  }

  function handleNameChange(v: string) {
    set('name', v);
    if (!form.id) set('slug', toSlug(v)); // auto-slug only for new items
  }

  function setBullet(i: number, v: string) {
    const bullets = [...(form.hero_bullets || ['', '', '', '', ''])];
    bullets[i] = v;
    set('hero_bullets', bullets);
  }

  function setSpec(i: number, k: 'label' | 'value', v: string) {
    const specs = [...(form.specs || [])];
    specs[i] = { ...specs[i], [k]: v };
    set('specs', specs);
  }

  function addSpec() {
    set('specs', [...(form.specs || []), { label: '', value: '' }]);
  }

  function removeSpec(i: number) {
    set('specs', (form.specs || []).filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!form.name?.trim()) { setError('Product name is required.'); return; }
    if (!form.slug?.trim()) { setError('URL slug is required.'); return; }
    setSaving(true); setError('');
    try {
      await onSave({
        ...form,
        hero_bullets: (form.hero_bullets || []).filter(b => b.trim()),
        specs:        (form.specs || []).filter(s => s.label.trim() && s.value.trim()),
      });
    } catch (e: any) {
      setError(e.message || 'Save failed');
    }
    setSaving(false);
  }

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info' },
    { id: 'page'  as const, label: 'Website Page' },
    { id: 'specs' as const, label: 'Specs & SEO' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.preventDefault()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 760, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} color="#0F9B6E" />
            {form.id ? `Edit: ${form.name}` : 'Add New Product Category'}
          </div>
          <button onClick={onClose} style={S.iconBtn}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '0 24px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'none', borderBottom: `2px solid ${activeTab === t.id ? '#0F9B6E' : 'transparent'}`, color: activeTab === t.id ? '#0F9B6E' : '#6B7280' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── BASIC INFO TAB ── */}
          {activeTab === 'basic' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={S.label}>PRODUCT NAME *</label>
                  <input value={form.name || ''} onChange={e => handleNameChange(e.target.value)} style={S.input} placeholder="e.g. Green Cardamom" />
                </div>
                <div>
                  <label style={S.label}>URL SLUG *</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>/products/</span>
                    <input value={form.slug || ''} onChange={e => set('slug', toSlug(e.target.value))} style={S.input} placeholder="green-cardamom" />
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                    Website URL: wanderbreezeexim.com/products/{form.slug || '…'}
                  </div>
                </div>
              </div>

              {/* AI Fill Button */}
              <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#5B21B6', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={15} /> AI Auto-Fill
                  </div>
                  <div style={{ fontSize: 12, color: '#7C3AED', marginTop: 2 }}>
                    Enter product name + image path → AI fills all page content, SEO, specs, MOQ automatically
                  </div>
                </div>
                <button
                  onClick={handleAIFill}
                  disabled={generating || !form.name?.trim()}
                  style={{ ...S.btn('#7C3AED'), minWidth: 130, justifyContent: 'center', opacity: generating || !form.name?.trim() ? 0.6 : 1, flexShrink: 0 }}>
                  {generating ? <Loader2 size={14} /> : <Sparkles size={14} />}
                  {generating ? 'Generating…' : 'AI Fill All'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={S.label}>CATEGORY GROUP</label>
                  <select value={form.category_group || 'spices'} onChange={e => set('category_group', e.target.value)} style={S.input}>
                    {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>UNIT</label>
                  <select value={form.unit || 'KG'} onChange={e => set('unit', e.target.value)} style={S.input}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>HS CODE</label>
                  <input value={form.hs_code || ''} onChange={e => set('hs_code', e.target.value)} style={S.input} placeholder="090831" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={S.label}>ORIGIN</label>
                  <input value={form.origin || ''} onChange={e => set('origin', e.target.value)} style={S.input} placeholder="Idukki, Kerala" />
                </div>
                <div>
                  <label style={S.label}>MOQ</label>
                  <input value={form.moq || ''} onChange={e => set('moq', e.target.value)} style={S.input} placeholder="500 KG" />
                </div>
                <div>
                  <label style={S.label}>SUPPLY CAPACITY</label>
                  <input value={form.supply_capacity || ''} onChange={e => set('supply_capacity', e.target.value)} style={S.input} placeholder="Large Volume" />
                </div>
              </div>

              <div>
                <label style={S.label}>IMAGE PATH</label>
                <input value={form.image_path || ''} onChange={e => set('image_path', e.target.value)} style={S.input} placeholder="/Images/Cardamom.png" />
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Path to image in /public/Images/ folder</div>
              </div>

              <div>
                <label style={S.label}>COLOR</label>
                <input value={form.color || ''} onChange={e => set('color', e.target.value)} style={S.input} placeholder="e.g. Natural Green, Black, Red" />
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Product color shown on website product card</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ ...S.label, marginBottom: 0 }}>ACTIVE ON WEBSITE</label>
                <button onClick={() => set('is_active', !form.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {form.is_active
                    ? <ToggleRight size={28} color="#0F9B6E" />
                    : <ToggleLeft size={28} color="#9CA3AF" />}
                </button>
                <span style={{ fontSize: 12, color: form.is_active ? '#0F9B6E' : '#9CA3AF' }}>{form.is_active ? 'Visible on website' : 'Hidden'}</span>
              </div>
            </>
          )}

          {/* ── WEBSITE PAGE TAB ── */}
          {activeTab === 'page' && (
            <>
              <div>
                <label style={S.label}>PAGE HEADING (H1)</label>
                <input value={form.page_title || ''} onChange={e => set('page_title', e.target.value)} style={S.input} placeholder="Indian Green Cardamom Exporter – Bulk Wholesale Supplier" />
              </div>
              <div>
                <label style={S.label}>TAGLINE / SUBTITLE</label>
                <input value={form.page_subtitle || ''} onChange={e => set('page_subtitle', e.target.value)} style={S.input} placeholder="8mm Bold & Premium Grades | Ready Stock | Direct Export Supply" />
              </div>

              <div>
                <label style={S.label}>HERO BULLET POINTS (✔ list under heading)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(form.hero_bullets || ['', '', '', '', '']).map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, color: '#0F9B6E', width: 16, flexShrink: 0 }}>✔</span>
                      <input value={b} onChange={e => setBullet(i, e.target.value)} style={S.input} placeholder={`Bullet point ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={S.label}>OVERVIEW SECTION TITLE</label>
                <input value={form.overview_title || ''} onChange={e => set('overview_title', e.target.value)} style={S.input} placeholder="Premium Indian Green Cardamom for Global Export" />
              </div>
              <div>
                <label style={S.label}>OVERVIEW TEXT</label>
                <textarea value={form.overview_text || ''} onChange={e => set('overview_text', e.target.value)} rows={4}
                  style={{ ...S.input, resize: 'vertical' }} placeholder="Describe your product for website visitors…" />
              </div>
            </>
          )}

          {/* ── SPECS & SEO TAB ── */}
          {activeTab === 'specs' && (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label style={{ ...S.label, marginBottom: 0 }}>TECHNICAL SPECIFICATIONS</label>
                  <button onClick={addSpec} style={{ ...S.ghost, fontSize: 12, padding: '5px 12px' }}>
                    <Plus size={13} /> Add Row
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(form.specs || []).map((spec, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, alignItems: 'center' }}>
                      <input value={spec.label} onChange={e => setSpec(i, 'label', e.target.value)} style={S.input} placeholder="Label (e.g. HS Code)" />
                      <input value={spec.value} onChange={e => setSpec(i, 'value', e.target.value)} style={S.input} placeholder="Value (e.g. 090831)" />
                      <button onClick={() => removeSpec(i)} style={{ ...S.iconBtn, color: '#DC2626' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 18 }}>
                <label style={{ ...S.label, fontSize: 11, color: '#9CA3AF', letterSpacing: '0.5px' }}>SEO SETTINGS</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={S.label}>META TITLE</label>
                    <input value={form.meta_title || ''} onChange={e => set('meta_title', e.target.value)} style={S.input} placeholder="Premium Indian Green Cardamom Exporter | Wholesale Bulk Supplier" />
                    <div style={{ fontSize: 11, color: form.meta_title && form.meta_title.length > 60 ? '#DC2626' : '#9CA3AF', marginTop: 3 }}>
                      {form.meta_title?.length || 0}/60 chars recommended
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>META DESCRIPTION</label>
                    <textarea value={form.meta_description || ''} onChange={e => set('meta_description', e.target.value)} rows={3}
                      style={{ ...S.input, resize: 'vertical' }} placeholder="Leading exporter of premium green cardamom from India…" />
                    <div style={{ fontSize: 11, color: form.meta_description && form.meta_description.length > 160 ? '#DC2626' : '#9CA3AF', marginTop: 3 }}>
                      {form.meta_description?.length || 0}/160 chars recommended
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>META KEYWORDS</label>
                    <input value={form.meta_keywords || ''} onChange={e => set('meta_keywords', e.target.value)} style={S.input} placeholder="Indian Green Cardamom Exporter, Wholesale Cardamom Supplier…" />
                  </div>
                </div>
              </div>
            </>
          )}

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#DC2626' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            {form.slug && <span>URL: /products/<strong>{form.slug}</strong></span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={S.ghost}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              style={{ ...S.btn(), minWidth: 120, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={14} /> : <Check size={14} />}
              {saving ? 'Saving…' : (form.id ? 'Update' : 'Create Product')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Variant Modal ─────────────────────────────────────────────
function VariantModal({
  initial, categoryName, onSave, onClose,
}: {
  initial: Partial<ProductVariant>;
  categoryName: string;
  onSave: (data: Partial<ProductVariant>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm]     = useState<Partial<ProductVariant>>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const set = (k: keyof ProductVariant, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name?.trim()) { setError('Variant name is required.'); return; }
    setSaving(true); setError('');
    try { await onSave(form); }
    catch (e: any) { setError(e.message || 'Save failed'); }
    setSaving(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.preventDefault()}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag size={17} color="#0F9B6E" /> {form.id ? 'Edit Variant' : 'Add Variant'}
        </div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>Under: {categoryName}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label}>VARIANT NAME *</label>
            <input value={form.name || ''} onChange={e => set('name', e.target.value)} style={S.input} placeholder="e.g. Cardamom 8mm Bold Idukki Ram Supplier" />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>This is the internal CRM name — used in invoices and outreach</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>GRADE</label>
              <input value={form.grade || ''} onChange={e => set('grade', e.target.value)} style={S.input} placeholder="8mm Bold" />
            </div>
            <div>
              <label style={S.label}>HS CODE</label>
              <input value={form.hs_code || ''} onChange={e => set('hs_code', e.target.value)} style={S.input} placeholder="090831" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={S.label}>UNIT</label>
              <select value={form.unit || 'KG'} onChange={e => set('unit', e.target.value)} style={S.input}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>PURCHASE PRICE (per unit)</label>
              <input type="number" value={form.purchase_price ?? ''} onChange={e => set('purchase_price', e.target.value ? parseFloat(e.target.value) : null)} style={S.input} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label style={S.label}>DESCRIPTION (optional)</label>
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} style={{ ...S.input, resize: 'vertical' }} placeholder="Any notes about this variant…" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ ...S.label, marginBottom: 0 }}>ACTIVE</label>
            <button onClick={() => set('is_active', !form.is_active)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {form.is_active ? <ToggleRight size={24} color="#0F9B6E" /> : <ToggleLeft size={24} color="#9CA3AF" />}
            </button>
          </div>
        </div>

        {error && <div style={{ marginTop: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#DC2626' }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...S.ghost, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ ...S.btn(), flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={13} /> : <Check size={13} />} {form.id ? 'Update' : 'Add Variant'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function CRMProducts() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [variants, setVariants]     = useState<ProductVariant[]>([]);
  const [selectedCat, setSelectedCat] = useState<ProductCategory | null>(null);
  const [loading, setLoading]         = useState(true);
  const [catModal, setCatModal]       = useState<Partial<ProductCategory> | null>(null);
  const [varModal, setVarModal]       = useState<Partial<ProductVariant> | null>(null);
  const [search, setSearch]           = useState('');
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Fetch ──────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('sc_product_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    setCategories(data || []);
    setLoading(false);
  }, []);

  const fetchVariants = useCallback(async (categoryId: string) => {
    const { data } = await supabase
      .from('sc_product_variants')
      .select('*')
      .eq('category_id', categoryId)
      .order('name');
    setVariants(data || []);
  }, []);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { if (selectedCat) fetchVariants(selectedCat.id); }, [selectedCat]);

  // ── Category CRUD ──────────────────────────────────────────
  async function saveCategory(data: Partial<ProductCategory>) {
    // Ensure is_active is always explicitly set (never undefined/null)
    const payload = { ...data, is_active: data.is_active === true };
    if (payload.id) {
      const { error } = await supabase.from('sc_product_categories').update(payload).eq('id', payload.id);
      if (error) throw new Error(error.message);
      showToast(`${payload.name} updated`);
    } else {
      const { error } = await supabase.from('sc_product_categories').insert(payload);
      if (error) throw new Error(error.message);
      showToast(`${payload.name} created! Website page live at /products/${payload.slug}`);
    }
    await fetchCategories();
    setCatModal(null);
  }

  async function deleteCategory(cat: ProductCategory) {
    if (!confirm(`Delete "${cat.name}" and all its variants? This cannot be undone.`)) return;
    await supabase.from('sc_product_categories').delete().eq('id', cat.id);
    if (selectedCat?.id === cat.id) { setSelectedCat(null); setVariants([]); }
    showToast(`${cat.name} deleted`, 'error');
    await fetchCategories();
  }

  async function toggleCatActive(cat: ProductCategory) {
    const newValue = !cat.is_active;
    const { error } = await supabase
      .from('sc_product_categories')
      .update({ is_active: newValue })
      .eq('id', cat.id);
    if (error) { showToast(error.message, 'error'); return; }
    // Update both categories list AND selectedCat so next click reads correct value
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newValue } : c));
    setSelectedCat(prev => prev?.id === cat.id ? { ...prev, is_active: newValue } : prev);
    showToast(newValue ? `${cat.name} is now visible on website` : `${cat.name} hidden from website`);
  }

  // ── Variant CRUD ───────────────────────────────────────────
  async function saveVariant(data: Partial<ProductVariant>) {
    if (data.id) {
      const { error } = await supabase.from('sc_product_variants').update(data).eq('id', data.id);
      if (error) throw new Error(error.message);
      showToast(`${data.name} updated`);
    } else {
      const { error } = await supabase.from('sc_product_variants').insert({ ...data, category_id: selectedCat!.id });
      if (error) throw new Error(error.message);
      showToast(`${data.name} added`);
    }
    await fetchVariants(selectedCat!.id);
    setVarModal(null);
  }

  async function deleteVariant(v: ProductVariant) {
    if (!confirm(`Delete variant "${v.name}"?`)) return;
    await supabase.from('sc_product_variants').delete().eq('id', v.id);
    setVariants(prev => prev.filter(x => x.id !== v.id));
    showToast(`${v.name} deleted`, 'error');
  }

  // ── Filtered categories ────────────────────────────────────
  const filteredCats = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCats = GROUPS.reduce((acc, g) => {
    acc[g] = filteredCats.filter(c => c.category_group === g);
    return acc;
  }, {} as Record<string, ProductCategory[]>);

  const GROUP_LABELS: Record<string, string> = {
    'spices':       '🌶 Spices',
    'agri-products':'🥥 Agri Products',
    'value-added':  '✨ Value Added',
    'sea-foods':    '🐟 Sea Foods',
  };

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%', minHeight: 600 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 500, background: toast.type === 'success' ? '#DCFCE7' : '#FEE2E2', color: toast.type === 'success' ? '#15803D' : '#DC2626', border: `1px solid ${toast.type === 'success' ? '#86EFAC' : '#FCA5A5'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: 380 }}>
          {toast.msg}
        </div>
      )}

      {/* ── LEFT: Category list ──────────────────────────────── */}
      <div style={{ width: 280, borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>Products</span>
            <button onClick={() => setCatModal(emptyCat())} style={{ ...S.btn(), padding: '6px 12px', fontSize: 12 }}>
              <Plus size={13} /> Add
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, paddingLeft: 28, padding: '7px 10px 7px 28px', fontSize: 12 }} placeholder="Search products…" />
          </div>
        </div>

        {/* Category groups */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}><Loader2 size={18} style={{ margin: '0 auto 8px' }} /></div>
          ) : (
            GROUPS.map(group => (
              groupedCats[group]?.length > 0 && (
                <div key={group}>
                  <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {GROUP_LABELS[group]}
                  </div>
                  {groupedCats[group].map(cat => (
                    <div key={cat.id}
                      onClick={() => setSelectedCat(cat)}
                      style={{ padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: selectedCat?.id === cat.id ? '#F0FDF4' : 'transparent', borderLeft: `3px solid ${selectedCat?.id === cat.id ? '#0F9B6E' : 'transparent'}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {cat.name}
                          {!cat.is_active && <span style={{ fontSize: 10, background: '#F3F4F6', color: '#9CA3AF', padding: '1px 6px', borderRadius: 10 }}>Hidden</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>/products/{cat.slug}</div>
                      </div>
                      <ChevronRight size={14} color={selectedCat?.id === cat.id ? '#0F9B6E' : '#D1D5DB'} />
                    </div>
                  ))}
                </div>
              )
            ))
          )}
          {!loading && categories.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No products yet.<br />Click Add to create your first product.
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Category detail + variants ───────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {!selectedCat ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', flexDirection: 'column', gap: 12 }}>
            <Package size={40} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Select a product from the left</div>
            <div style={{ fontSize: 12 }}>or click Add to create a new one</div>
          </div>
        ) : (
          <>
            {/* Category header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>{selectedCat.name}</h2>
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, background: selectedCat.is_active ? '#ECFDF5' : '#F3F4F6', color: selectedCat.is_active ? '#059669' : '#9CA3AF', fontWeight: 600 }}>
                    {selectedCat.is_active ? 'Live on Website' : 'Hidden'}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                  {selectedCat.origin && <span>📍 {selectedCat.origin}</span>}
                  {selectedCat.moq && <span style={{ marginLeft: 12 }}>📦 MOQ: {selectedCat.moq}</span>}
                  {selectedCat.hs_code && <span style={{ marginLeft: 12 }}>🔢 HS: {selectedCat.hs_code}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a href={`/products/${selectedCat.slug}`} target="_blank" rel="noopener"
                  style={{ ...S.ghost, textDecoration: 'none', fontSize: 12 }}>
                  <ExternalLink size={13} /> View Page
                </a>
                <button onClick={() => toggleCatActive(selectedCat)} style={{ ...S.ghost, fontSize: 12 }}>
                  {selectedCat.is_active ? <ToggleRight size={14} color="#0F9B6E" /> : <ToggleLeft size={14} color="#9CA3AF" />}
                  {selectedCat.is_active ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => setCatModal({ ...selectedCat })} style={{ ...S.ghost, fontSize: 12 }}>
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => deleteCategory(selectedCat)} style={{ ...S.ghost, fontSize: 12, color: '#DC2626', borderColor: '#FCA5A5' }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            {/* Page preview strip */}
            {selectedCat.page_title && (
              <div style={{ margin: '16px 24px 0', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', marginBottom: 6 }}>WEBSITE PAGE PREVIEW</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{selectedCat.page_title}</div>
                {selectedCat.page_subtitle && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{selectedCat.page_subtitle}</div>}
                {selectedCat.hero_bullets && selectedCat.hero_bullets.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {selectedCat.hero_bullets.slice(0, 3).map((b, i) => (
                      <span key={i} style={{ fontSize: 11, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 20 }}>✔ {b}</span>
                    ))}
                    {selectedCat.hero_bullets.length > 3 && <span style={{ fontSize: 11, color: '#9CA3AF' }}>+{selectedCat.hero_bullets.length - 3} more</span>}
                  </div>
                )}
              </div>
            )}

            {/* Specs preview */}
            {selectedCat.specs && selectedCat.specs.length > 0 && (
              <div style={{ margin: '12px 24px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedCat.specs.slice(0, 6).map((s, i) => (
                  <div key={i} style={{ background: '#F9FAFB', border: '1px solid #f3f4f6', borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                    <span style={{ color: '#6B7280' }}>{s.label}: </span>
                    <span style={{ fontWeight: 600, color: '#111' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Variants section */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Layers size={16} color="#0F9B6E" /> Variants
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Internal CRM names used in invoices, outreach, and pricing</div>
                </div>
                <button onClick={() => setVarModal(emptyVar())} style={{ ...S.btn(), fontSize: 12, padding: '7px 14px' }}>
                  <Plus size={13} /> Add Variant
                </button>
              </div>

              {variants.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                  No variants yet. Add a variant to start using this product in invoices and outreach.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {variants.map(v => (
                    <div key={v.id} style={{ border: '1px solid #f3f4f6', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, background: v.is_active ? '#fff' : '#fafafa' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: v.is_active ? '#111' : '#9CA3AF' }}>{v.name}</span>
                          {!v.is_active && <span style={{ fontSize: 10, background: '#F3F4F6', color: '#9CA3AF', padding: '1px 6px', borderRadius: 10 }}>Inactive</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, display: 'flex', gap: 12 }}>
                          {v.grade && <span>Grade: {v.grade}</span>}
                          {v.hs_code && <span>HS: {v.hs_code}</span>}
                          {v.unit && <span>Unit: {v.unit}</span>}
                          {v.purchase_price && <span>₹{v.purchase_price}/{v.unit}</span>}
                        </div>
                        {v.description && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{v.description}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => setVarModal({ ...v })} style={S.iconBtn} title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => deleteVariant(v)} style={{ ...S.iconBtn, color: '#DC2626' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {catModal && (
        <CategoryModal initial={catModal} onSave={saveCategory} onClose={() => setCatModal(null)} />
      )}
      {varModal && selectedCat && (
        <VariantModal initial={varModal} categoryName={selectedCat.name} onSave={saveVariant} onClose={() => setVarModal(null)} />
      )}
    </div>
  );
}