import { useEffect, useState } from 'react';
import { Sprout, LogOut, Plus, Check, Loader2, Clock, Search, Image as ImageIcon, Send, Lock } from 'lucide-react';
import { supabase, Vegetable } from '../crm/lib/supabase';
import { useAuth } from '../crm/lib/auth';
import { translateToTamilAndMalayalam } from '../crm/lib/translate';

const UNITS = ['kg', 'g', 'bunch', 'piece', 'dozen'];

export default function SupplierDashboard() {
  const { user, signOut } = useAuth();
  const [veggies, setVeggies] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [suggestOpen, setSuggestOpen] = useState(false);
  const [form, setForm] = useState({ name_en: '', name_ta: '', name_ml: '', unit: 'kg', supplier_price: '' });
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchVeggies(); }, []);

  async function fetchVeggies() {
    setLoading(true);
    const { data } = await supabase.from('wbefresh_vegetables').select('*').order('name_en');
    setVeggies((data as Vegetable[]) ?? []);
    setLoading(false);
  }

  const approved = veggies.filter(v => v.is_approved);
  const mySuggestions = veggies.filter(v => !v.is_approved && v.suggested_by === user?.id);
  const visible = approved.filter(v =>
    !search.trim() || [v.name_en, v.name_ta].some(n => n?.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const anyLocked = approved.some(v => v.price_locked);

  function edit(id: string, current: number) {
    return priceEdits[id] ?? String(current);
  }

  async function savePrice(v: Vegetable) {
    const val = parseFloat(priceEdits[v.id] ?? String(v.supplier_price)) || 0;
    setSavingId(v.id);
    const { error } = await supabase
      .from('wbefresh_vegetables')
      .update({ supplier_price: val, supplier_updated_by: user?.id ?? null, supplier_updated_at: new Date().toISOString() })
      .eq('id', v.id);
    setSavingId(null);
    if (!error) {
      setPriceEdits(prev => { const p = { ...prev }; delete p[v.id]; return p; });
      setSavedIds(prev => new Set(prev).add(v.id));
      fetchVeggies();
    }
  }

  // Locks every price (so the supplier can't keep changing them mid-review)
  // and flags settings.pending_admin_review so the admin sees a banner to
  // come apply margins.
  async function submitPricesUpdated() {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      await supabase
        .from('wbefresh_vegetables')
        .update({ price_locked: true })
        .eq('is_approved', true);
      await supabase
        .from('settings')
        .update({ pending_admin_review: true })
        .eq('id', 1);
      setSavedIds(new Set());
      fetchVeggies();
    } finally {
      setSubmitting(false);
    }
  }

  function openSuggest() {
    setForm({ name_en: '', name_ta: '', name_ml: '', unit: 'kg', supplier_price: '' });
    setError('');
    setSuggestOpen(true);
  }

  async function onNameBlur() {
    const name = form.name_en.trim();
    if (!name || form.name_ta || form.name_ml) return;
    setTranslating(true);
    try {
      const { ta, ml } = await translateToTamilAndMalayalam(name);
      setForm(f => ({ ...f, name_ta: f.name_ta || ta || '', name_ml: f.name_ml || ml || '' }));
    } finally {
      setTranslating(false);
    }
  }

  async function submitSuggestion() {
    const name = form.name_en.trim();
    if (!name) { setError('Vegetable name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const { data: existing } = await supabase.from('wbefresh_vegetables').select('id').ilike('name_en', name);
      if (existing && existing.length > 0) { setError('This vegetable already exists.'); return; }
      const { error } = await supabase.from('wbefresh_vegetables').insert({
        name_en: name,
        name_ta: form.name_ta.trim(),
        name_ml: form.name_ml.trim(),
        unit: form.unit,
        supplier_price: parseFloat(form.supplier_price) || 0,
        margin: 0,
        is_approved: false,
        suggested_by: user?.id ?? null,
      });
      if (error) { setError(error.message); return; }
      setSuggestOpen(false);
      fetchVeggies();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">WBE Fresh — Supplier</h1>
              <p className="text-[11px] text-gray-400 leading-tight">{user?.name}</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
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
            <button onClick={openSuggest} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <Plus size={16} /> Suggest a Vegetable
            </button>
            {anyLocked ? (
              <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium">
                <Lock size={14} /> Submitted — awaiting admin review
              </span>
            ) : (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={submitting}
                className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Prices Updated
              </button>
            )}
          </div>
        </div>

        {mySuggestions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 mb-2"><Clock size={14} /> Awaiting admin approval</p>
            <div className="flex flex-wrap gap-2">
              {mySuggestions.map(v => (
                <span key={v.id} className="text-xs bg-white border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full">{v.name_en}</span>
              ))}
            </div>
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
              const dirty = priceEdits[v.id] !== undefined && priceEdits[v.id] !== String(v.supplier_price);
              const justSaved = savedIds.has(v.id) && !dirty;
              const tileClass = v.price_locked
                ? 'bg-gray-50 border-gray-200'
                : dirty
                ? 'bg-red-50 border-red-300'
                : justSaved
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200';
              return (
                <div key={v.id} className={`rounded-xl border overflow-hidden flex flex-col shadow-sm transition-colors ${tileClass}`}>
                  <div className="h-24 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {v.image_url ? (
                      <img src={v.image_url} alt={v.name_en} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={26} className="text-gray-300" />
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate">{v.name_en}</p>
                      <p className="text-xs text-gray-500 truncate">{v.name_ta}</p>
                      <p className="text-[11px] text-gray-400">per {v.unit}</p>
                    </div>
                    <label className="text-[11px] text-gray-500">
                      Your price
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-gray-400">₹</span>
                        <input
                          type="number"
                          disabled={v.price_locked}
                          value={edit(v.id, v.supplier_price)}
                          onChange={e => setPriceEdits(prev => ({ ...prev, [v.id]: e.target.value }))}
                          className="w-full text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-400"
                        />
                      </div>
                    </label>
                    {v.price_locked ? (
                      <p className="mt-auto flex items-center justify-center gap-1.5 text-gray-400 text-xs font-medium py-1.5">
                        <Lock size={12} /> Locked
                      </p>
                    ) : (
                      <button
                        onClick={() => savePrice(v)}
                        disabled={savingId === v.id || !dirty}
                        className="mt-auto flex items-center justify-center gap-1.5 bg-teal-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {savingId === v.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Suggest a Vegetable modal */}
      {suggestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSuggestOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Suggest a Vegetable</h2>
              <button onClick={() => setSuggestOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <p className="text-xs text-gray-500">Your suggestion will be reviewed by the admin before it appears on the price list.</p>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vegetable Name (English)</label>
                <input
                  value={form.name_en}
                  onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))}
                  onBlur={onNameBlur}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tamil name {translating && <Loader2 size={11} className="inline animate-spin ml-1" />}</label>
                  <input value={form.name_ta} onChange={e => setForm(f => ({ ...f, name_ta: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Malayalam name</label>
                  <input value={form.name_ml} onChange={e => setForm(f => ({ ...f, name_ml: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Your price (₹)</label>
                  <input type="number" value={form.supplier_price} onChange={e => setForm(f => ({ ...f, supplier_price: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setSuggestOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button onClick={submitSuggestion} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                  {saving && <Loader2 size={14} className="animate-spin" />} Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm "Prices Updated" submission */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={20} className="text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1.5">Send prices for review?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This will lock your prices and send them to the sales team for review. You won't be able to change them again until they're reviewed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitPricesUpdated}
                disabled={submitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />} Yes, Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
