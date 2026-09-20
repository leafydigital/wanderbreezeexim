import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Minus, Trash2, Search, ShoppingBasket, Sprout } from 'lucide-react';
import { supabase, Vegetable, Customer } from '../crm/lib/supabase';
import { useAuth } from '../crm/lib/auth';

interface Line {
  vegetable_id: string;
  units_ordered: string;
}

/**
 * Create a WBE Fresh quotation, priced by each vegetable's configured
 * packing unit (e.g. 1 Box = 25kg at the per-kg final price).
 *
 * POS-style: tap a vegetable tile to add it to the cart at its default
 * packing quantity (e.g. Tomato → 1 Box = 25kg, priced at per-kg price ×
 * 25kg). Tapping again, or using the +/- steppers in the cart, adjusts how
 * many packing units (boxes/bags/etc.) are on the order. Totals for KG's
 * and Amount run live at the bottom.
 *
 * mode="staff": staff picks which WBE-Fresh customer this is for.
 * mode="customer": the customer is fixed (their own portal), quotation is
 *   created already Approved — there's no staff intermediary to send/modify
 *   it, so it goes straight into the admin's verification queue.
 */
export default function QuotationModal({
  open,
  onClose,
  mode,
  fixedCustomer,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  mode: 'staff' | 'customer';
  fixedCustomer?: Customer | null;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLines([]);
    setSearch('');
    setNotes('');
    setError('');
    setCustomerId(fixedCustomer?.id ?? '');
    (async () => {
      const { data: vegs } = await supabase
        .from('wbefresh_vegetables')
        .select('*')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('name_en');
      // Only vegetables the admin has actually published (Go Live) are
      // orderable — a draft supplier/margin edit shouldn't be quotable yet.
      setVegetables(((vegs as Vegetable[]) ?? []).filter(v => (v.live_final_price ?? 0) > 0));

      if (mode === 'staff') {
        const { data: custs } = await supabase
          .from('customers')
          .select('*')
          .eq('segment', 'WBE-Fresh')
          .order('customer_name');
        setCustomers((custs as Customer[]) ?? []);
      }
    })();
  }, [open, mode, fixedCustomer?.id]);

  function veg(id: string) {
    return vegetables.find(v => v.id === id) ?? null;
  }

  // Tap a tile: add it to the cart at 1 packing unit (its default kg's),
  // or bump the existing line's quantity by one packing unit.
  function tapVegetable(id: string) {
    setLines(l => {
      const idx = l.findIndex(x => x.vegetable_id === id);
      if (idx === -1) return [...l, { vegetable_id: id, units_ordered: '1' }];
      const existing = l[idx];
      const next = (parseFloat(existing.units_ordered) || 0) + 1;
      return l.map((x, i) => (i === idx ? { ...x, units_ordered: String(next) } : x));
    });
  }

  function bumpLine(i: number, delta: number) {
    setLines(l => l.map((x, idx) => {
      if (idx !== i) return x;
      const next = Math.max(0, (parseFloat(x.units_ordered) || 0) + delta);
      return { ...x, units_ordered: String(next) };
    }).filter(x => (parseFloat(x.units_ordered) || 0) > 0));
  }

  function setLineQty(i: number, value: string) {
    setLines(l => l.map((x, idx) => (idx === i ? { ...x, units_ordered: value } : x)));
  }

  function removeLine(i: number) {
    setLines(l => l.filter((_, idx) => idx !== i));
  }

  function lineTotal(l: Line) {
    const v = veg(l.vegetable_id);
    if (!v) return 0;
    const units = parseFloat(l.units_ordered) || 0;
    return (v.live_final_price ?? 0) * v.packing_qty * units;
  }
  function lineKg(l: Line) {
    const v = veg(l.vegetable_id);
    if (!v) return 0;
    const units = parseFloat(l.units_ordered) || 0;
    return v.packing_qty * units;
  }

  const grandTotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const totalKg = lines.reduce((s, l) => s + lineKg(l), 0);

  const cartQtyByVeg = useMemo(() => {
    const m: Record<string, number> = {};
    lines.forEach(l => { m[l.vegetable_id] = parseFloat(l.units_ordered) || 0; });
    return m;
  }, [lines]);

  const filteredVegetables = vegetables.filter(v =>
    !search.trim() || [v.name_en, v.name_ta, v.name_ml].some(n => n?.toLowerCase().includes(search.trim().toLowerCase()))
  );

  async function handleSave() {
    setError('');
    const activeCustomer = mode === 'staff' ? customers.find(c => c.id === customerId) : fixedCustomer;
    if (!activeCustomer) { setError('Select a customer'); return; }
    const validLines = lines.filter(l => l.vegetable_id && (parseFloat(l.units_ordered) || 0) > 0);
    if (validLines.length === 0) { setError('Add at least one vegetable'); return; }

    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const { data: nextNum } = await supabase.rpc('claim_next_document_number', { p_doc_type: 'quotation' });
      const quote_number = `WBE-QT-${year}-${String(nextNum ?? 1).padStart(4, '0')}`;

      const { data: quotation, error: qErr } = await supabase
        .from('wbefresh_quotations')
        .insert({
          quote_number,
          module: 'wbe_fresh',
          status: mode === 'customer' ? 'Approved' : 'Created',
          customer_id: activeCustomer.id,
          customer_name: activeCustomer.customer_name,
          company_name: activeCustomer.shop_name || activeCustomer.company_name || '',
          phone: activeCustomer.phone || '',
          email: activeCustomer.email || '',
          address: activeCustomer.address || '',
          items: [],
          total_amount: grandTotal,
          notes,
          issue_date: new Date().toISOString().slice(0, 10),
          created_by: user?.id ?? null,
          approved_at: mode === 'customer' ? new Date().toISOString() : null,
          approved_by: mode === 'customer' ? (user?.id ?? null) : null,
        })
        .select('id')
        .single();
      if (qErr || !quotation) { setError(qErr?.message ?? 'Could not create quotation'); return; }

      const rows = validLines.map((l, idx) => {
        const v = veg(l.vegetable_id)!;
        const units = parseFloat(l.units_ordered) || 0;
        return {
          quotation_id: quotation.id,
          vegetable_id: v.id,
          product_name: v.name_en,
          packing_unit: v.packing_unit,
          packing_qty: v.packing_qty,
          units_ordered: units,
          unit_price: (v.live_final_price ?? 0) * v.packing_qty,
          total_price: (v.live_final_price ?? 0) * v.packing_qty * units,
          sort_order: idx,
        };
      });
      const { error: liErr } = await supabase.from('wbefresh_quotation_line_items').insert(rows);
      if (liErr) { setError(liErr.message); return; }

      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === 'customer' ? 'Place an Order' : 'New Quotation'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {error && (
          <div className="px-6 pt-3 flex-shrink-0">
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          </div>
        )}

        {mode === 'staff' && (
          <div className="px-6 pt-3 flex-shrink-0">
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select WBE-Fresh customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}{c.shop_name ? ` — ${c.shop_name}` : ''}</option>)}
            </select>
            {customers.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">No WBE-Fresh customers yet — create one first (segment = WBE-Fresh).</p>
            )}
          </div>
        )}

        {/* POS body: vegetable tiles (left) + cart (right) */}
        <div className="flex-1 flex min-h-0 mt-3">
          {/* Left: tap-to-add vegetable grid */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-gray-100">
            <div className="px-6 pb-2 flex-shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search vegetables..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {filteredVegetables.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No vegetables found.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredVegetables.map(v => {
                    const inCart = cartQtyByVeg[v.id] ?? 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => tapVegetable(v.id)}
                        className={`relative text-left rounded-xl border overflow-hidden transition-colors ${
                          inCart > 0 ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/40'
                        }`}
                      >
                        {inCart > 0 && (
                          <span className="absolute top-1.5 right-1.5 bg-teal-600 text-white text-[11px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                            {inCart}
                          </span>
                        )}
                        <div className="h-16 bg-gray-100 flex items-center justify-center overflow-hidden">
                          {v.image_url ? (
                            <img src={v.image_url} alt={v.name_en} className="w-full h-full object-cover" />
                          ) : (
                            <Sprout size={22} className="text-gray-300" />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-semibold text-gray-900 truncate">{v.name_en}</p>
                          <p className="text-[10px] text-gray-400">1 {v.packing_unit} = {v.packing_qty}{v.unit}</p>
                          <p className="text-xs font-bold text-teal-700 mt-0.5">₹{((v.live_final_price ?? 0) * v.packing_qty).toFixed(2)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: cart */}
          <div className="w-80 flex-shrink-0 flex flex-col min-h-0">
            <div className="px-4 py-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">
              <ShoppingBasket size={13} /> Order ({lines.length})
            </div>
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
              {lines.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">Tap a vegetable to add it here.</p>
              ) : (
                lines.map((l, i) => {
                  const v = veg(l.vegetable_id);
                  if (!v) return null;
                  return (
                    <div key={l.vegetable_id} className="border border-gray-200 rounded-lg p-2.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{v.name_en}</p>
                        <button onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500 flex-shrink-0"><Trash2 size={13} /></button>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => bumpLine(i, -1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={l.units_ordered}
                            onChange={e => setLineQty(i, e.target.value)}
                            className="w-12 text-center text-sm border border-gray-200 rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => bumpLine(i, 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-teal-100 text-teal-700 hover:bg-teal-200"
                          >
                            <Plus size={12} />
                          </button>
                          <span className="text-[11px] text-gray-400">{v.packing_unit}{parseFloat(l.units_ordered) !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="text-sm font-semibold text-teal-700">₹{lineTotal(l).toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{lineKg(l)}{v.unit} total</p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 pt-2 flex-shrink-0">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Notes (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total KG's</span>
                <span className="font-semibold text-gray-900">{totalKg.toFixed(1)} kg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Total Amount</span>
                <span className="text-xl font-bold text-teal-700">₹{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />} {mode === 'customer' ? 'Place Order' : 'Create Quotation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
