/**
 * Buyers.tsx — WBE Fresh domestic buyers.
 *
 * A "buyer" here is NOT a separate table — it's a row in the same
 * `customers` table the export side uses (type = 'Domestic'), with a
 * buyer_type sub-category (Exporter / Normal Buyer / Bulk Buyer) plus a
 * few extra fields (shop name, WhatsApp, city/district, map location).
 * This keeps one customer list for the whole business and means bills
 * already reference the right row via the existing invoices.customer_id.
 */
import { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, ShoppingBag, Phone, MapPin, Building2, BadgeCheck } from 'lucide-react';
import { supabase, Customer, BuyerType, CustomerSegment } from '../lib/supabase';
import Modal from '../components/Modal';

const BUYER_TYPES: BuyerType[] = ['Normal Buyer', 'Bulk Buyer', 'Exporter'];
const SEGMENTS: CustomerSegment[] = ['General', 'WBE-Fresh'];

const emptyForm = {
  customer_name: '', shop_name: '', phone: '', whatsapp_number: '',
  address: '', city: '', district: '', map_location: '', gstin: '',
  buyer_type: 'Normal Buyer' as BuyerType,
  segment: 'General' as CustomerSegment,
};

const typeBadge: Record<BuyerType, string> = {
  'Exporter': 'bg-purple-100 text-purple-700',
  'Bulk Buyer': 'bg-amber-100 text-amber-700',
  'Normal Buyer': 'bg-gray-100 text-gray-600',
};

export default function Buyers() {
  const [buyers, setBuyers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | BuyerType>('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchBuyers(); }, []);

  async function fetchBuyers() {
    setLoading(true);
    // WBE Fresh buyers = domestic customers that carry a buyer_type.
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('type', 'Domestic')
      .not('buyer_type', 'is', null)
      .order('created_at', { ascending: false });
    setBuyers((data as Customer[]) ?? []);
    setLoading(false);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setFormError('');
    setCreateOpen(true);
  }

  function openEdit(b: Customer) {
    setForm({
      customer_name: b.customer_name, shop_name: b.shop_name ?? '', phone: b.phone,
      whatsapp_number: b.whatsapp_number ?? '', address: b.address ?? '', city: b.city ?? '',
      district: b.district ?? '', map_location: b.map_location ?? '', gstin: b.gstin ?? '',
      buyer_type: (b.buyer_type as BuyerType) ?? 'Normal Buyer',
      segment: (b.segment as CustomerSegment) ?? 'General',
    });
    setEditId(b.id);
    setFormError('');
    setCreateOpen(true);
  }

  async function handleSave() {
    setFormError('');
    if (!form.customer_name.trim() || !form.phone.trim()) {
      setFormError('Full name and contact number are required');
      return;
    }
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', form.phone.trim())
        .neq('id', editId ?? '00000000-0000-0000-0000-000000000000');
      if (existing && existing.length > 0) {
        setFormError('A customer with this contact number already exists');
        return;
      }

      const payload = {
        ...form,
        customer_name: form.customer_name.trim(),
        phone: form.phone.trim(),
        type: 'Domestic' as const,
      };
      const { error } = editId
        ? await supabase.from('customers').update(payload).eq('id', editId)
        : await supabase.from('customers').insert(payload);

      if (error) { setFormError(error.message); return; }
      setCreateOpen(false);
      fetchBuyers();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('customers').delete().eq('id', deleteId);
    setDeleteId(null);
    setDeleting(false);
    fetchBuyers();
  }

  const filtered = buyers.filter(b => {
    if (typeFilter !== 'all' && b.buyer_type !== typeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return b.customer_name.toLowerCase().includes(q) || (b.shop_name ?? '').toLowerCase().includes(q) || b.phone.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">{buyers.length} buyer{buyers.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus size={16} /> Add Buyer
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, shop, or contact number..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All types</option>
          {BUYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingBag size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No buyers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Buyer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Location</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="px-5 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-700 text-xs font-bold">{(b.customer_name || 'B')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{b.customer_name}</p>
                          {b.shop_name && <p className="text-xs text-gray-400 flex items-center gap-1"><Building2 size={10} /> {b.shop_name}</p>}
                          {b.gstin && <p className="text-xs text-gray-400 flex items-center gap-1"><BadgeCheck size={10} /> {b.gstin}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={11} className="text-gray-400" /> {b.phone}</div>
                        {b.whatsapp_number && <div className="text-xs text-gray-400">WA: {b.whatsapp_number}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {(b.city || b.district) ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin size={11} className="text-gray-400" /> {[b.city, b.district].filter(Boolean).join(', ')}</div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadge[(b.buyer_type as BuyerType) ?? 'Normal Buyer']}`}>{b.buyer_type}</span>
                      {b.buyer_type === 'Exporter' && <p className="text-[10px] text-gray-400 mt-1 max-w-[160px]">Domestic price shown; export grade +₹5–10/kg</p>}
                      {b.buyer_type === 'Bulk Buyer' && <p className="text-[10px] text-gray-400 mt-1">Discount applied on invoice</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => setDeleteId(b.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={editId ? 'Edit Buyer' : 'Add Buyer'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shop Name</label>
              <input value={form.shop_name} onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number *</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp Number</label>
              <input value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
              <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="Used for delivery zone" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Map Location</label>
              <input value={form.map_location} onChange={e => setForm(f => ({ ...f, map_location: e.target.value }))} placeholder="Google Maps link or coordinates" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GST Number</label>
              <input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Buyer Type</label>
              <select value={form.buyer_type} onChange={e => setForm(f => ({ ...f, buyer_type: e.target.value as BuyerType }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {BUYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {form.buyer_type === 'Exporter' && <p className="text-xs text-gray-400 mt-1">Exporters see standard domestic prices; export-grade produce costs ₹5–10/kg extra, quoted separately.</p>}
              {form.buyer_type === 'Bulk Buyer' && <p className="text-xs text-gray-400 mt-1">Bulk buyers see standard prices; apply a discount on the invoice instead.</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Segment</label>
              <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value as CustomerSegment }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {form.segment === 'WBE-Fresh'
                  ? 'Eligible for a WBE Fresh portal login (set up under Users) to view final prices and place orders.'
                  : 'No login needed.'}
              </p>
            </div>
          </div>
          {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{formError}</div>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setCreateOpen(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
              {saving ? 'Saving...' : editId ? 'Save Changes' : 'Create Buyer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Buyer" size="sm">
        <p className="text-sm text-gray-600 mb-5">This removes the customer record entirely (same table used across the CRM).</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
            {deleting ? 'Removing...' : 'Remove Buyer'}
          </button>
        </div>
      </Modal>
    </div>
  );
}