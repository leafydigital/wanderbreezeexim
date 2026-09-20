import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase, BuyerType } from '../crm/lib/supabase';

const BUYER_TYPES: BuyerType[] = ['Exporter', 'Normal Buyer', 'Bulk Buyer'];
const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const empty = {
  customer_name: '', shop_name: '', phone: '', whatsapp_number: '',
  address: '', city: '', district: '', buyer_type: 'Normal Buyer' as BuyerType,
  createLogin: false, username: '', password: '',
};

/** Create a WBE-Fresh customer (segment='WBE-Fresh'), optionally with a
 * portal login (role 'WBE Customer') that redirects them into /wbe-fresh
 * to view final prices and place their own orders. */
export default function CustomerModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setForm(empty); setError(''); }
  }, [open]);

  async function handleSave() {
    setError('');
    if (!form.customer_name.trim()) { setError('Name is required'); return; }
    if (!form.phone.trim()) { setError('Phone number is required'); return; }
    if (form.createLogin && (!form.username.trim() || !form.password.trim())) {
      setError('Username and password are required to create a login');
      return;
    }
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', form.phone.trim());
      if (existing && existing.length > 0) { setError('A customer with this phone number already exists.'); return; }

      let linked_user_id: string | null = null;
      if (form.createLogin) {
        const { data: role } = await supabase.from('roles').select('id').eq('name', 'WBE Customer').maybeSingle();
        const res = await fetch(`${EDGE_BASE}?action=create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ANON_KEY}` },
          body: JSON.stringify({
            table: 'wbefresh_users',
            name: form.customer_name,
            username: form.username,
            password: form.password,
            phone: form.phone,
            whatsapp_number: form.whatsapp_number,
            role_id: role?.id ?? null,
          }),
        });
        const result = await res.json();
        if (result.error) { setError(result.error); return; }
        linked_user_id = result.user?.id ?? null;
      }

      const { error: custErr } = await supabase.from('customers').insert({
        customer_name: form.customer_name,
        shop_name: form.shop_name,
        phone: form.phone,
        whatsapp_number: form.whatsapp_number,
        address: form.address,
        city: form.city,
        district: form.district,
        buyer_type: form.buyer_type,
        country: 'India',
        type: 'Domestic',
        segment: 'WBE-Fresh',
        linked_user_id,
      });
      if (custErr) { setError(custErr.message); return; }

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
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">New Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
            <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shop Name</label>
              <input value={form.shop_name} onChange={e => setForm(f => ({ ...f, shop_name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Buyer Type</label>
              <select value={form.buyer_type} onChange={e => setForm(f => ({ ...f, buyer_type: e.target.value as BuyerType }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {BUYER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact Number</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp Number</label>
              <input value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
              <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <input type="checkbox" checked={form.createLogin} onChange={e => setForm(f => ({ ...f, createLogin: e.target.checked }))} />
            Give this customer a login to view prices and place orders
          </label>
          {form.createLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
                <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
              {saving && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
