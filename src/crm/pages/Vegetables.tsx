import { useEffect, useState, useCallback } from 'react';
import { Plus, PenSquare, Image as ImageIcon, Check, Clock, Loader2, Search, AlertTriangle, Pencil, Radio } from 'lucide-react';
import { supabase, Vegetable, WbeSettings, PackingUnit } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Modal from '../components/Modal';
import { translateToTamilAndMalayalam } from '../lib/translate';
import { nextNoonCutoff } from '../lib/wbeFormat';
import PriceTrend from '../components/PriceTrend';

const UNITS = ['kg', 'g', 'bunch', 'piece', 'dozen'];
const PACKING_UNITS: PackingUnit[] = ['Bag', 'Box', 'Crate', 'Sack'];
const PACKING_QTYS = [5, 10, 25, 50, 100];

export default function Vegetables() {
  const { isAdmin, user } = useAuth();
  const admin = isAdmin();

  const [veggies, setVeggies] = useState<Vegetable[]>([]);
  const [settings, setSettings] = useState<WbeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'catalog' | 'pending'>('catalog');
  const [search, setSearch] = useState('');

  const [priceEdits, setPriceEdits] = useState<Record<string, { supplier_price?: string; margin?: string; packing_unit?: string; packing_qty?: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name_en: '', name_ta: '', name_ml: '', unit: 'kg', supplier_price: '', image_url: '', packing_unit: 'Box' as PackingUnit, packing_qty: '25' });
  const [translating, setTranslating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  const [marginOpen, setMarginOpen] = useState(false);
  const [marginValue, setMarginValue] = useState('');
  const [marginSaving, setMarginSaving] = useState(false);
  const [goLiveSaving, setGoLiveSaving] = useState(false);

  const [editTarget, setEditTarget] = useState<Vegetable | null>(null);
  const [editForm, setEditForm] = useState({ name_en: '', name_ta: '', name_ml: '', unit: 'kg', image_url: '' });
  const [editTranslating, setEditTranslating] = useState(false);
  const [editUploading, setEditUploading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchVeggies = useCallback(async () => {
    setLoading(true);
    const [vegRes, settingsRes] = await Promise.all([
      supabase.from('wbefresh_vegetables').select('*').order('name_en'),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    setVeggies((vegRes.data as Vegetable[]) ?? []);
    setSettings((settingsRes.data as WbeSettings) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchVeggies(); }, [fetchVeggies]);

  const catalog = veggies.filter(v => v.is_approved);
  const pending = veggies.filter(v => !v.is_approved);
  const visible = (tab === 'catalog' ? catalog : pending).filter(v =>
    !search.trim() || [v.name_en, v.name_ta, v.name_ml].some(n => n?.toLowerCase().includes(search.trim().toLowerCase()))
  );

  function edited(v: Vegetable) {
    const e = priceEdits[v.id] ?? {};
    return {
      supplier_price: e.supplier_price ?? String(v.supplier_price),
      margin: e.margin ?? String(v.margin),
      packing_unit: e.packing_unit ?? v.packing_unit,
      packing_qty: e.packing_qty ?? String(v.packing_qty),
    };
  }

  function setEdit(id: string, field: 'supplier_price' | 'margin' | 'packing_unit' | 'packing_qty', value: string) {
    setPriceEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  // Stamps settings.price_updated_at/valid_till/updated_by using the
  // noon-cutoff rule, and clears the pending-review flag.
  async function stampSettings() {
    const now = new Date();
    await supabase.from('settings').update({
      price_updated_at: now.toISOString(),
      valid_till: nextNoonCutoff(now).toISOString(),
      updated_by: user?.id ?? null,
      pending_admin_review: false,
    }).eq('id', 1);
  }

  async function savePrice(v: Vegetable) {
    const { supplier_price, margin, packing_unit, packing_qty } = edited(v);
    const sp = parseFloat(supplier_price) || 0;
    const m = parseFloat(margin) || 0;
    setSavingId(v.id);
    const { error } = await supabase.from('wbefresh_vegetables').update({
      supplier_price: sp,
      margin: m,
      packing_unit,
      packing_qty: parseFloat(packing_qty) || 1,
      price_locked: false,
      margin_updated_by: user?.id ?? null,
      margin_updated_at: new Date().toISOString(),
    }).eq('id', v.id);
    setSavingId(null);
    if (!error) {
      // Note: this only saves the draft supplier_price/margin — it does NOT
      // publish live_final_price. Nothing customers/staff see changes until
      // "Go Live" is clicked.
      setPriceEdits(prev => { const p = { ...prev }; delete p[v.id]; return p; });
      fetchVeggies();
    }
  }

  async function approve(v: Vegetable) {
    await supabase.from('wbefresh_vegetables').update({ is_approved: true }).eq('id', v.id);
    fetchVeggies();
  }

  // ── Add vegetable ─────────────────────────────────────────
  function openAdd() {
    setAddForm({ name_en: '', name_ta: '', name_ml: '', unit: 'kg', supplier_price: '', image_url: '', packing_unit: 'Box', packing_qty: '25' });
    setAddError('');
    setAddOpen(true);
  }

  async function onNameBlur() {
    const name = addForm.name_en.trim();
    if (!name || addForm.name_ta || addForm.name_ml) return;
    setTranslating(true);
    try {
      const { ta, ml } = await translateToTamilAndMalayalam(name);
      setAddForm(f => ({ ...f, name_ta: f.name_ta || ta || '', name_ml: f.name_ml || ml || '' }));
    } finally {
      setTranslating(false);
    }
  }

  async function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('vegetable-images').upload(path, file, { upsert: true });
      if (error) { setAddError('Image upload failed: ' + error.message); return; }
      const { data } = supabase.storage.from('vegetable-images').getPublicUrl(path);
      setAddForm(f => ({ ...f, image_url: data.publicUrl }));
    } finally {
      setUploading(false);
    }
  }

  async function saveVegetable() {
    const name = addForm.name_en.trim();
    if (!name) { setAddError('Vegetable name is required'); return; }
    setSaving(true);
    setAddError('');
    try {
      const { data: existing } = await supabase
        .from('wbefresh_vegetables')
        .select('id')
        .ilike('name_en', name);
      if (existing && existing.length > 0) {
        setAddError('This vegetable already exists in the catalog.');
        return;
      }
      const { error } = await supabase.from('wbefresh_vegetables').insert({
        name_en: name,
        name_ta: addForm.name_ta.trim(),
        name_ml: addForm.name_ml.trim(),
        unit: addForm.unit,
        image_url: addForm.image_url,
        supplier_price: parseFloat(addForm.supplier_price) || 0,
        margin: 0,
        packing_unit: addForm.packing_unit,
        packing_qty: parseFloat(addForm.packing_qty) || 1,
        is_approved: true,
      });
      if (error) { setAddError(error.message); return; }
      setAddOpen(false);
      fetchVeggies();
    } finally {
      setSaving(false);
    }
  }

  // ── Edit name / image ──────────────────────────────────────
  function openEdit(v: Vegetable) {
    setEditTarget(v);
    setEditForm({ name_en: v.name_en, name_ta: v.name_ta, name_ml: v.name_ml, unit: v.unit, image_url: v.image_url });
    setEditError('');
  }

  async function onEditNameBlur() {
    const name = editForm.name_en.trim();
    if (!name) return;
    setEditTranslating(true);
    try {
      const { ta, ml } = await translateToTamilAndMalayalam(name);
      setEditForm(f => ({ ...f, name_ta: f.name_ta || ta || '', name_ml: f.name_ml || ml || '' }));
    } finally {
      setEditTranslating(false);
    }
  }

  async function onEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('vegetable-images').upload(path, file, { upsert: true });
      if (error) { setEditError('Image upload failed: ' + error.message); return; }
      const { data } = supabase.storage.from('vegetable-images').getPublicUrl(path);
      setEditForm(f => ({ ...f, image_url: data.publicUrl }));
    } finally {
      setEditUploading(false);
    }
  }

  async function saveEdit() {
    if (!editTarget) return;
    const name = editForm.name_en.trim();
    if (!name) { setEditError('Vegetable name is required'); return; }
    setEditSaving(true);
    setEditError('');
    try {
      const { data: existing } = await supabase
        .from('wbefresh_vegetables')
        .select('id')
        .ilike('name_en', name)
        .neq('id', editTarget.id);
      if (existing && existing.length > 0) {
        setEditError('Another vegetable already has this name.');
        return;
      }
      const { error } = await supabase.from('wbefresh_vegetables').update({
        name_en: name,
        name_ta: editForm.name_ta.trim(),
        name_ml: editForm.name_ml.trim(),
        unit: editForm.unit,
        image_url: editForm.image_url,
      }).eq('id', editTarget.id);
      if (error) { setEditError(error.message); return; }
      setEditTarget(null);
      fetchVeggies();
    } finally {
      setEditSaving(false);
    }
  }

  // ── Bulk margin update ────────────────────────────────────
  // Draft-only: applies the margin to every approved vegetable's working
  // numbers, but skips anything with a ₹0 buying price (nothing for a
  // supplier who hasn't priced an item yet to add a margin on top of) and
  // does NOT publish — Go Live is a separate, explicit step below.
  async function applyMargin() {
    const m = parseFloat(marginValue);
    if (isNaN(m)) return;
    setMarginSaving(true);
    try {
      await supabase.from('wbefresh_vegetables').update({
        margin: m,
        price_locked: false,
        margin_updated_by: user?.id ?? null,
        margin_updated_at: new Date().toISOString(),
      }).eq('is_approved', true).gt('supplier_price', 0);
      setMarginOpen(false);
      setMarginValue('');
      fetchVeggies();
    } finally {
      setMarginSaving(false);
    }
  }

  // ── Go Live ────────────────────────────────────────────────
  // Publishes the currently computed final_price (supplier_price + margin)
  // as live_final_price for every approved vegetable — this is the only
  // action that changes what customers/staff actually see.
  async function goLive() {
    setGoLiveSaving(true);
    try {
      await supabase.rpc('publish_live_prices');
      await stampSettings();
      fetchVeggies();
    } finally {
      setGoLiveSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vegetables..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openAdd} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Plus size={16} /> Add Vegetable
          </button>
          <button onClick={() => setMarginOpen(true)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <PenSquare size={16} /> Update Margin
          </button>
          <button
            onClick={goLive}
            disabled={goLiveSaving}
            title="Publish the current prices below to the public price list, staff dashboard and customer portal"
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            {goLiveSaving ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />} Go Live
          </button>
        </div>
      </div>

      {settings?.pending_admin_review && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Supplier submitted updated prices</p>
            <p className="text-xs text-amber-700">Review the supplier prices below and apply a margin to publish them.</p>
          </div>
          <button onClick={() => setMarginOpen(true)} className="text-xs font-medium bg-white border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap">
            Review now
          </button>
        </div>
      )}

      {admin && (
        <div className="flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setTab('catalog')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'catalog' ? 'border-teal-500 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Catalog ({catalog.length})
          </button>
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${tab === 'pending' ? 'border-teal-500 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Clock size={13} /> Pending Approval {pending.length > 0 && <span className="ml-0.5 bg-amber-100 text-amber-700 rounded-full px-1.5 text-xs">{pending.length}</span>}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-500 py-12 text-center">No vegetables found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visible.map(v => {
            const e = edited(v);
            const sp = parseFloat(e.supplier_price) || 0;
            const m = parseFloat(e.margin) || 0;
            const dirty = priceEdits[v.id] !== undefined;
            return (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                <div className="relative h-28 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={28} className="text-gray-300" />
                  )}
                  {tab === 'catalog' && (
                    <button
                      onClick={() => openEdit(v)}
                      title="Edit name / image"
                      className="absolute top-1.5 right-1.5 bg-white/90 hover:bg-white text-gray-600 hover:text-teal-700 rounded-full p-1.5 shadow-sm transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{v.name_en}</p>
                      {v.price_locked && (
                        <span title="Awaiting your review">
                          <Clock size={11} className="text-amber-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{v.name_ta}{v.name_ta && v.name_ml ? ' / ' : ''}{v.name_ml}</p>
                    <p className="text-[11px] text-gray-400">per {v.unit}</p>
                  </div>

                  {tab === 'pending' ? (
                    <>
                      <p className="text-xs text-gray-600">Supplier price: ₹{v.supplier_price}</p>
                      <button onClick={() => approve(v)} className="mt-auto flex items-center justify-center gap-1.5 bg-teal-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-teal-700 transition-colors">
                        <Check size={13} /> Approve
                      </button>
                    </>
                  ) : (
                    <>
                      <label className="text-[11px] text-gray-500">
                        Supplier price
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-gray-400">₹</span>
                          <input
                            type="number"
                            value={e.supplier_price}
                            onChange={ev => setEdit(v.id, 'supplier_price', ev.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </label>
                      <label className="text-[11px] text-gray-500">
                        Margin
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-gray-400">₹</span>
                          <input
                            type="number"
                            value={e.margin}
                            onChange={ev => setEdit(v.id, 'margin', ev.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <label className="text-[11px] text-gray-500">
                          Packing unit
                          <select
                            value={e.packing_unit}
                            onChange={ev => setEdit(v.id, 'packing_unit', ev.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-md px-1.5 py-1 mt-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            {PACKING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </label>
                        <label className="text-[11px] text-gray-500">
                          Qty (kg)
                          <select
                            value={e.packing_qty}
                            onChange={ev => setEdit(v.id, 'packing_qty', ev.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-md px-1.5 py-1 mt-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            {PACKING_QTYS.map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <span className="text-[11px] text-gray-500">Selling price</span>
                        <div className="flex items-center gap-1.5">
                          <PriceTrend current={sp + m} previous={v.previous_final_price} />
                          <span className="text-sm font-bold text-teal-700">₹{(sp + m).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">Live price</span>
                        <span className="text-xs font-medium text-gray-500">
                          {v.live_final_price != null ? `₹${Number(v.live_final_price).toFixed(2)}` : '—'}
                        </span>
                      </div>
                      {Number(v.live_final_price ?? -1) !== sp + m && (
                        <p className="text-[10px] text-amber-600 flex items-center gap-1">
                          <Clock size={10} /> Not live yet — click Go Live to publish
                        </p>
                      )}
                      <button
                        onClick={() => savePrice(v)}
                        disabled={savingId === v.id || !dirty}
                        className="mt-auto flex items-center justify-center gap-1.5 bg-teal-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {savingId === v.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vegetable modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Vegetable" size="md">
        <div className="space-y-4">
          {addError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{addError}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vegetable Name (English)</label>
            <input
              value={addForm.name_en}
              onChange={e => setAddForm(f => ({ ...f, name_en: e.target.value }))}
              onBlur={onNameBlur}
              placeholder="e.g. Bottle Gourd"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tamil name {translating && <Loader2 size={11} className="inline animate-spin ml-1" />}</label>
              <input
                value={addForm.name_ta}
                onChange={e => setAddForm(f => ({ ...f, name_ta: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Malayalam name {translating && <Loader2 size={11} className="inline animate-spin ml-1" />}</label>
              <input
                value={addForm.name_ml}
                onChange={e => setAddForm(f => ({ ...f, name_ml: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <select
                value={addForm.unit}
                onChange={e => setAddForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Starting price (₹)</label>
              <input
                type="number"
                value={addForm.supplier_price}
                onChange={e => setAddForm(f => ({ ...f, supplier_price: e.target.value }))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Packing unit</label>
              <select
                value={addForm.packing_unit}
                onChange={e => setAddForm(f => ({ ...f, packing_unit: e.target.value as PackingUnit }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {PACKING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Standard quantity (kg)</label>
              <select
                value={addForm.packing_qty}
                onChange={e => setAddForm(f => ({ ...f, packing_qty: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {PACKING_QTYS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 -mt-2">e.g. "1 {addForm.packing_unit} = {addForm.packing_qty}kg" — how this vegetable is ordered on a quotation.</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
            <input type="file" accept="image/*" onChange={onImageChange} className="text-sm" />
            {uploading && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Uploading...</p>}
            {addForm.image_url && <img src={addForm.image_url} className="mt-2 h-16 w-16 object-cover rounded-lg border border-gray-200" />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
            <button onClick={saveVegetable} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit name / image modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Vegetable" size="md">
        <div className="space-y-4">
          {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{editError}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Vegetable Name (English)</label>
            <input
              value={editForm.name_en}
              onChange={e => setEditForm(f => ({ ...f, name_en: e.target.value }))}
              onBlur={onEditNameBlur}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tamil name {editTranslating && <Loader2 size={11} className="inline animate-spin ml-1" />}</label>
              <input
                value={editForm.name_ta}
                onChange={e => setEditForm(f => ({ ...f, name_ta: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Malayalam name {editTranslating && <Loader2 size={11} className="inline animate-spin ml-1" />}</label>
              <input
                value={editForm.name_ml}
                onChange={e => setEditForm(f => ({ ...f, name_ml: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
            <select
              value={editForm.unit}
              onChange={e => setEditForm(f => ({ ...f, unit: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
            <input type="file" accept="image/*" onChange={onEditImageChange} className="text-sm" />
            {editUploading && <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Uploading...</p>}
            {editForm.image_url && <img src={editForm.image_url} className="mt-2 h-16 w-16 object-cover rounded-lg border border-gray-200" />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
            <button onClick={saveEdit} disabled={editSaving} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {editSaving && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Update Margin modal */}
      <Modal open={marginOpen} onClose={() => setMarginOpen(false)} title="Update Margin" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Apply a flat margin (₹) to every vegetable in the catalog. This unlocks supplier price editing again and stamps the price-update time shown on the public page.</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Margin amount (₹ per unit)</label>
            <input
              type="number"
              autoFocus
              value={marginValue}
              onChange={e => setMarginValue(e.target.value)}
              placeholder="e.g. 5"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setMarginOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
            <button onClick={applyMargin} disabled={marginSaving || marginValue === ''} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {marginSaving && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
