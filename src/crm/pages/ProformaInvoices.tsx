import { useEffect, useState, useRef } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, Eye, Download, FileText, X } from 'lucide-react';
import { supabase, ProformaInvoice, Customer, Currency, Incoterms, PIStatus } from '../lib/supabase';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, today } from '../lib/utils';

interface LineItemForm {
  id?: string;
  product_name: string;
  hs_code: string;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
}

const emptyLine = (): LineItemForm => ({
  product_name: '', hs_code: '', description: '', quantity: '', unit: 'KG', unit_price: '',
});

const emptyForm = {
  pi_number: '',
  customer_id: '',
  issue_date: today(),
  valid_until: '',
  incoterms: 'FOB' as Incoterms,
  currency: 'USD' as Currency,
  country_of_origin: 'India',
  port_of_loading: '',
  port_of_discharge: '',
  payment_terms: '',
  notes: '',
  status: 'Draft' as PIStatus,
};

export default function ProformaInvoices() {
  const [pis, setPIs] = useState<ProformaInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [previewPI, setPreviewPI] = useState<ProformaInvoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [lineItems, setLineItems] = useState<LineItemForm[]>([emptyLine()]);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  async function fetchData() {
    setLoading(true);
    const [pisRes, custRes] = await Promise.all([
      supabase.from('proforma_invoices').select('*, customers(*), pi_line_items(*)').order('created_at', { ascending: false }),
      supabase.from('customers').select('id, customer_name, company_name, country, type, address, email, phone').order('customer_name'),
    ]);
    setPIs((pisRes.data as ProformaInvoice[]) ?? []);
    setCustomers((custRes.data as Customer[]) ?? []);
    setLoading(false);
  }

  const selectedCustomer = customers.find(c => c.id === form.customer_id);
  const isDomestic = selectedCustomer?.type === 'Domestic';

  const lineItemsCalc = lineItems.map(l => ({
    ...l,
    total: (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0),
  }));
  const subtotal = lineItemsCalc.reduce((s, l) => s + l.total, 0);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.pi_number.trim()) e.pi_number = 'PI number required';
    if (!form.customer_id) e.customer_id = 'Customer required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const piPayload = {
      ...form,
      currency: isDomestic ? 'INR' : form.currency,
      subtotal,
      total: subtotal,
      updated_at: new Date().toISOString(),
    };
    let piId = editId;
    if (editId) {
      await supabase.from('proforma_invoices').update(piPayload).eq('id', editId);
      await supabase.from('pi_line_items').delete().eq('pi_id', editId);
    } else {
      const { data } = await supabase.from('proforma_invoices').insert(piPayload).select('id').single();
      piId = data?.id;
    }
    if (piId) {
      const itemsPayload = lineItems
        .filter(l => l.product_name.trim())
        .map((l, i) => ({
          pi_id: piId,
          product_name: l.product_name,
          hs_code: l.hs_code,
          description: l.description,
          quantity: parseFloat(l.quantity) || 0,
          unit: l.unit,
          unit_price: parseFloat(l.unit_price) || 0,
          total_price: (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0),
          sort_order: i,
        }));
      if (itemsPayload.length > 0) await supabase.from('pi_line_items').insert(itemsPayload);
    }
    await fetchData();
    setModalOpen(false);
    setSaving(false);
    resetForm();
  }

  function resetForm() {
    setForm(emptyForm);
    setLineItems([emptyLine()]);
    setEditId(null);
    setErrors({});
  }

  async function handleDelete(id: string) {
    await supabase.from('proforma_invoices').delete().eq('id', id);
    setDeleteId(null);
    fetchData();
  }

  function openEdit(pi: ProformaInvoice) {
    setForm({
      pi_number: pi.pi_number,
      customer_id: pi.customer_id ?? '',
      issue_date: pi.issue_date,
      valid_until: pi.valid_until ?? '',
      incoterms: pi.incoterms,
      currency: pi.currency,
      country_of_origin: pi.country_of_origin,
      port_of_loading: pi.port_of_loading,
      port_of_discharge: pi.port_of_discharge,
      payment_terms: pi.payment_terms,
      notes: pi.notes,
      status: pi.status,
    });
    setLineItems((pi.pi_line_items ?? []).map(l => ({
      id: l.id,
      product_name: l.product_name,
      hs_code: l.hs_code,
      description: l.description,
      quantity: String(l.quantity),
      unit: l.unit,
      unit_price: String(l.unit_price),
    })));
    setEditId(pi.id);
    setErrors({});
    setModalOpen(true);
  }

  async function openAdd() {
    const { count } = await supabase.from('proforma_invoices').select('id', { count: 'exact', head: true });
    const year = new Date().getFullYear();
    setForm({ ...emptyForm, pi_number: `WBE-PI-${year}-${String((count ?? 0) + 1).padStart(4, '0')}` });
    setLineItems([emptyLine()]);
    setEditId(null);
    setErrors({});
    setModalOpen(true);
  }

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open('', '', 'width=900,height=700');
    if (!w) return;
    w.document.write(`
      <html><head><title>Proforma Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px 12px; text-align: left; }
        th { background: #f1f5f9; }
        td { border-bottom: 1px solid #e2e8f0; }
        .right { text-align: right; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .total-row td { font-weight: bold; background: #f8fafc; }
      </style>
      </head><body>${content}</body></html>
    `);
    w.document.close();
    w.print();
  }

  const filtered = pis.filter(p =>
    !search ||
    p.pi_number.toLowerCase().includes(search.toLowerCase()) ||
    (p.customers as any)?.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const currencySymbol = isDomestic ? 'INR' : form.currency;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">{pis.length} proforma invoices</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus size={16} /> Create PI
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by PI number or customer..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No proforma invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">PI Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Incoterms</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-5 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(pi => (
                  <tr key={pi.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-teal-600">{pi.pi_number}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-gray-800">{(pi.customers as any)?.customer_name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{(pi.customers as any)?.company_name}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-gray-600">{formatDate(pi.issue_date)}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell"><StatusBadge status={pi.incoterms} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={pi.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(pi.total, pi.currency)}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setPreviewPI(pi)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Preview"><Eye size={14} /></button>
                        <button onClick={() => openEdit(pi)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(pi.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete"><Trash2 size={14} /></button>
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
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editId ? 'Edit Proforma Invoice' : 'Create Proforma Invoice'} size="2xl">
        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">PI Number *</label>
              <input value={form.pi_number} onChange={e => setForm(f => ({ ...f, pi_number: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.pi_number ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.pi_number && <p className="text-xs text-red-500 mt-1">{errors.pi_number}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
              <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.customer_id ? 'border-red-400' : 'border-gray-200'}`}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name} {c.company_name ? `(${c.company_name})` : ''}</option>)}
              </select>
              {errors.customer_id && <p className="text-xs text-red-500 mt-1">{errors.customer_id}</p>}
            </div>
          </div>

          {selectedCustomer && (
            <div className={`px-3 py-2 rounded-lg text-xs ${isDomestic ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
              {isDomestic ? 'Domestic customer — using INR format' : `International customer — ${selectedCustomer.country}`}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date</label>
              <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valid Until</label>
              <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          {!isDomestic && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Incoterms</label>
                <select value={form.incoterms} onChange={e => setForm(f => ({ ...f, incoterms: e.target.value as Incoterms }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>FOB</option><option>CIF</option><option>EXW</option><option>CFR</option><option>DDP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value as Currency }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>USD</option><option>AED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country of Origin</label>
                <input value={form.country_of_origin} onChange={e => setForm(f => ({ ...f, country_of_origin: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          )}

          {!isDomestic && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Port of Loading</label>
                <input value={form.port_of_loading} onChange={e => setForm(f => ({ ...f, port_of_loading: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Nhava Sheva, India" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Port of Discharge</label>
                <input value={form.port_of_discharge} onChange={e => setForm(f => ({ ...f, port_of_discharge: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Jebel Ali, UAE" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
              <input value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. 50% advance, 50% before shipment" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PIStatus }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option>Draft</option><option>Sent</option><option>Accepted</option><option>Cancelled</option>
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Products</label>
              <button onClick={() => setLineItems(l => [...l, emptyLine()])} className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                <Plus size={13} /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Product</th>
                    {!isDomestic && <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">HS Code</th>}
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Qty</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Unit</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Unit Price ({currencySymbol})</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((l, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2"><input value={l.product_name} onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, product_name: e.target.value } : x))} className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder="Product name" /></td>
                      {!isDomestic && <td className="px-3 py-2"><input value={l.hs_code} onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, hs_code: e.target.value } : x))} className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder="0000.00" /></td>}
                      <td className="px-3 py-2"><input type="number" value={l.quantity} onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} className="w-20 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" /></td>
                      <td className="px-3 py-2"><select value={l.unit} onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} className="border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none"><option>KG</option><option>MT</option><option>PCS</option><option>BAG</option><option>CTN</option></select></td>
                      <td className="px-3 py-2"><input type="number" value={l.unit_price} onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, unit_price: e.target.value } : x))} className="w-28 border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500" /></td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-700">{formatCurrency((parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), currencySymbol)}</td>
                      <td className="px-3 py-2"><button onClick={() => setLineItems(items => items.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={isDomestic ? 4 : 5} className="px-3 py-2 text-sm font-semibold text-gray-700 text-right">Total</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(subtotal, currencySymbol)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
              {saving ? 'Saving...' : editId ? 'Update PI' : 'Create PI'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      {previewPI && (
        <Modal open={!!previewPI} onClose={() => setPreviewPI(null)} title="Preview Proforma Invoice" size="2xl">
          <div className="mb-4 flex justify-end">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
              <Download size={15} /> Print / Download PDF
            </button>
          </div>
          <div ref={printRef}>
            <PIPreview pi={previewPI} />
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete PI" size="sm">
        <p className="text-sm text-gray-600 mb-5">Delete this proforma invoice?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

function PIPreview({ pi }: { pi: ProformaInvoice }) {
  const customer = pi.customers as Customer | undefined;
  const items = pi.pi_line_items ?? [];
  const isDomestic = customer?.type === 'Domestic';
  const cur = pi.currency;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f766e' }}>WANDER BREEZE EXIM</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Export CRM</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>PROFORMA INVOICE</div>
          <div style={{ color: '#0f766e', fontWeight: 600, marginTop: 4 }}>{pi.pi_number}</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Date: {formatDate(pi.issue_date)}</div>
          {pi.valid_until && <div style={{ color: '#64748b', fontSize: 12 }}>Valid Until: {formatDate(pi.valid_until)}</div>}
        </div>
      </div>

      {/* Buyer/Shipper */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Buyer / Consignee</div>
          {customer ? (
            <>
              <div style={{ fontWeight: 600 }}>{customer.customer_name}</div>
              {customer.company_name && <div>{customer.company_name}</div>}
              {customer.address && <div style={{ color: '#475569', fontSize: 12 }}>{customer.address}</div>}
              {customer.country && <div style={{ color: '#475569', fontSize: 12 }}>{customer.country}</div>}
              {customer.email && <div style={{ color: '#475569', fontSize: 12 }}>{customer.email}</div>}
              {customer.phone && <div style={{ color: '#475569', fontSize: 12 }}>{customer.phone}</div>}
            </>
          ) : <div style={{ color: '#94a3b8' }}>No customer</div>}
        </div>
        <div style={{ flex: 1, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Shipment Details</div>
          {!isDomestic && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Incoterms:</span>
                <span style={{ fontWeight: 600 }}>{pi.incoterms}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Currency:</span>
                <span style={{ fontWeight: 600 }}>{pi.currency}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>Origin:</span>
                <span>{pi.country_of_origin}</span>
              </div>
              {pi.port_of_loading && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Port of Loading:</span>
                  <span>{pi.port_of_loading}</span>
                </div>
              )}
              {pi.port_of_discharge && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Port of Discharge:</span>
                  <span>{pi.port_of_discharge}</span>
                </div>
              )}
            </>
          )}
          {pi.payment_terms && (
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ color: '#64748b', fontSize: 12 }}>Payment:</span>
              <span>{pi.payment_terms}</span>
            </div>
          )}
        </div>
      </div>

      {/* Products table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Product</th>
            {!isDomestic && <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>HS Code</th>}
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Qty</th>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Unit</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Unit Price</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                {item.description && <div style={{ fontSize: 12, color: '#64748b' }}>{item.description}</div>}
              </td>
              {!isDomestic && <td style={{ padding: '8px 12px', color: '#475569' }}>{item.hs_code || '—'}</td>}
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '8px 12px' }}>{item.unit}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.unit_price, cur)}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total_price, cur)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
            <td colSpan={isDomestic ? 4 : 5} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{formatCurrency(pi.total, cur)}</td>
          </tr>
        </tfoot>
      </table>

      {pi.notes && (
        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 12, color: '#475569' }}>{pi.notes}</div>
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: 'center', color: '#94a3b8', fontSize: 11, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
        This is a computer-generated proforma invoice. | Wander Breeze Exim
      </div>
    </div>
  );
}
