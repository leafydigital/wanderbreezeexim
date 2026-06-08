import { useEffect, useState, useRef } from 'react';
import {
  Plus, Search, CreditCard as Edit2, Trash2, Eye, Download,
  Receipt, X, FileText, ShoppingBag, MapPin, Truck,
} from 'lucide-react';
import {
  supabase, Invoice, Customer, ProformaInvoice,
  Currency, Incoterms, InvoiceStatus,
} from '../lib/supabase';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, today } from '../lib/utils';

// ─── Extra types for new fields ───────────────────────────────────────────────

type OrderStatus   = 'Order Placed' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
type PaymentStatus = 'Pending' | 'Advance Paid' | 'Fully Paid' | 'Credit';
type PaymentMethod = '' | 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
type ModalMode     = 'invoice' | 'bill';

// ─── Line item ────────────────────────────────────────────────────────────────

interface LineItemForm {
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

// ─── Form defaults ────────────────────────────────────────────────────────────

const emptyForm = {
  invoice_number:    '',
  customer_id:       '',
  pi_id:             '',
  issue_date:        today(),
  due_date:          '',
  delivery_date:     '',
  incoterms:         'FOB' as Incoterms,
  currency:          'USD' as Currency,
  country_of_origin: 'India',
  port_of_loading:   '',
  port_of_discharge: '',
  payment_terms:     '',
  notes:             '',
  // invoice status (existing)
  status:            'Draft' as InvoiceStatus,
  // new bill-tracking fields
  order_status:      'Order Placed' as OrderStatus,
  payment_status:    'Pending'      as PaymentStatus,
  payment_method:    ''             as PaymentMethod,
  advance_amount:    '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  'Order Placed':     'bg-blue-50 text-blue-700',
  'Out for Delivery': 'bg-amber-50 text-amber-700',
  'Delivered':        'bg-green-50 text-green-700',
  'Cancelled':        'bg-red-50 text-red-600',
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  'Pending':      'bg-gray-100 text-gray-600',
  'Advance Paid': 'bg-amber-50 text-amber-700',
  'Fully Paid':   'bg-green-50 text-green-700',
  'Credit':       'bg-purple-50 text-purple-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Invoices() {
  const [invoices, setInvoices]           = useState<Invoice[]>([]);
  const [customers, setCustomers]         = useState<Customer[]>([]);
  const [pis, setPIs]                     = useState<ProformaInvoice[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterType, setFilterType]       = useState<'all' | 'invoice' | 'bill'>('all');
  const [filterOrderSt, setFilterOrderSt] = useState('all');

  const [modalOpen, setModalOpen]   = useState(false);
  const [modalMode, setModalMode]   = useState<ModalMode>('invoice');
  const [previewInv, setPreviewInv] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  const [form, setForm]           = useState(emptyForm);
  const [lineItems, setLineItems] = useState<LineItemForm[]>([emptyLine()]);
  const [editId, setEditId]       = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const printRef                  = useRef<HTMLDivElement>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchData();
    const onVis = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  async function fetchData() {
    setLoading(true);
    const [invRes, custRes, piRes] = await Promise.all([
      supabase.from('invoices')
        .select('*, customers(*), invoice_line_items(*)')
        .order('created_at', { ascending: false }),
      supabase.from('customers')
        .select('id, customer_name, company_name, country, type, address, email, phone')
        .order('customer_name'),
      supabase.from('proforma_invoices')
        .select('id, pi_number, customer_id')
        .order('created_at', { ascending: false }),
    ]);
    setInvoices((invRes.data as Invoice[]) ?? []);
    setCustomers((custRes.data as Customer[]) ?? []);
    setPIs((piRes.data as ProformaInvoice[]) ?? []);
    setLoading(false);
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const modalCustomers   = customers.filter(c =>
    modalMode === 'invoice' ? c.type === 'International' : c.type === 'Domestic'
  );
  const selectedCustomer = customers.find(c => c.id === form.customer_id);
  const isDomestic       = selectedCustomer?.type === 'Domestic';
  const currencySymbol   = isDomestic ? 'INR' : form.currency;
  const filteredPIs      = pis.filter(p => !form.customer_id || p.customer_id === form.customer_id);
  const subtotal         = lineItems.reduce((s, l) =>
    s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);
  const balance          = subtotal - (parseFloat(form.advance_amount) || 0);

  const isBillRecord = (inv: Invoice) =>
    inv.currency === 'INR' || (inv.customers as Customer | undefined)?.type === 'Domestic';

  // ── Validate ──────────────────────────────────────────────────────────────

  function validate() {
    const e: Record<string, string> = {};
    if (!form.invoice_number.trim()) e.invoice_number = 'Number required';
    if (!form.customer_id)           e.customer_id    = 'Customer required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload: Record<string, any> = {
      ...form,
      pi_id:          form.pi_id || null,
      currency:       isDomestic ? 'INR' : form.currency,
      due_date:       form.due_date     || null,
      delivery_date:  form.delivery_date || null,
      advance_amount: parseFloat(form.advance_amount) || 0,
      subtotal,
      total: subtotal,
      updated_at: new Date().toISOString(),
    };
    // Remove bill-specific fields for export invoices to keep clean
    if (!isDomestic) {
      payload.order_status   = null;
      payload.payment_status = null;
      payload.payment_method = null;
      payload.advance_amount = 0;
      payload.delivery_date  = null;
    }

    let invId = editId;
    if (editId) {
      await supabase.from('invoices').update(payload).eq('id', editId);
      await supabase.from('invoice_line_items').delete().eq('invoice_id', editId);
    } else {
      const { data } = await supabase.from('invoices').insert(payload).select('id').single();
      invId = data?.id;
    }
    if (invId) {
      const items = lineItems
        .filter(l => l.product_name.trim())
        .map((l, i) => ({
          invoice_id:   invId,
          product_name: l.product_name,
          hs_code:      l.hs_code,
          description:  l.description,
          quantity:     parseFloat(l.quantity)   || 0,
          unit:         l.unit,
          unit_price:   parseFloat(l.unit_price) || 0,
          total_price:  (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0),
          sort_order:   i,
        }));
      if (items.length > 0) await supabase.from('invoice_line_items').insert(items);
    }
    await fetchData();
    setModalOpen(false);
    setSaving(false);
    resetForm();
  }

  function resetForm() {
    setForm(emptyForm); setLineItems([emptyLine()]); setEditId(null); setErrors({});
  }

  async function handleDelete(id: string) {
    await supabase.from('invoices').delete().eq('id', id);
    setDeleteId(null);
    fetchData();
  }

  // ── Open edit ─────────────────────────────────────────────────────────────

  function openEdit(inv: Invoice) {
    const r = inv as any;
    setModalMode(isBillRecord(inv) ? 'bill' : 'invoice');
    setForm({
      invoice_number:    inv.invoice_number,
      customer_id:       inv.customer_id    ?? '',
      pi_id:             inv.pi_id          ?? '',
      issue_date:        inv.issue_date,
      due_date:          inv.due_date       ?? '',
      delivery_date:     r.delivery_date    ?? '',
      incoterms:         inv.incoterms,
      currency:          inv.currency,
      country_of_origin: inv.country_of_origin,
      port_of_loading:   inv.port_of_loading,
      port_of_discharge: inv.port_of_discharge,
      payment_terms:     inv.payment_terms,
      notes:             inv.notes,
      status:            inv.status,
      order_status:      r.order_status   ?? 'Order Placed',
      payment_status:    r.payment_status ?? 'Pending',
      payment_method:    r.payment_method ?? '',
      advance_amount:    r.advance_amount > 0 ? String(r.advance_amount) : '',
    });
    setLineItems((inv.invoice_line_items ?? []).map(l => ({
      product_name: l.product_name,
      hs_code:      l.hs_code,
      description:  l.description,
      quantity:     String(l.quantity),
      unit:         l.unit,
      unit_price:   String(l.unit_price),
    })));
    setEditId(inv.id);
    setErrors({});
    setModalOpen(true);
  }

  async function openCreate(mode: ModalMode) {
    setModalMode(mode);
    const prefix = mode === 'invoice' ? 'WBE-INV' : 'WBE-BILL';
    const { count } = await supabase.from('invoices').select('id', { count: 'exact', head: true });
    const year = new Date().getFullYear();
    setForm({
      ...emptyForm,
      invoice_number: `${prefix}-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`,
    });
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
    w.document.write(`<html><head><title>Bill / Invoice</title><style>
      body{font-family:Arial,sans-serif;color:#1a1a1a;margin:0;padding:20px}
      table{width:100%;border-collapse:collapse}
      th,td{padding:8px 12px;text-align:left}
      th{background:#f1f5f9}td{border-bottom:1px solid #e2e8f0}
    </style></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  }

  // ── Filter ────────────────────────────────────────────────────────────────

  const filtered = invoices.filter(inv => {
    const r = inv as any;
    const matchSearch   = !search
      || inv.invoice_number.toLowerCase().includes(search.toLowerCase())
      || (inv.customers as any)?.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = filterStatus  === 'all' || inv.status === filterStatus;
    const matchType     = filterType    === 'all'
      || (filterType === 'bill'    &&  isBillRecord(inv))
      || (filterType === 'invoice' && !isBillRecord(inv));
    const matchOrderSt  = filterOrderSt === 'all' || r.order_status === filterOrderSt;
    return matchSearch && matchStatus && matchType && matchOrderSt;
  });

  const modalTitle = editId
    ? (modalMode === 'bill' ? 'Edit Bill' : 'Edit Invoice')
    : (modalMode === 'bill' ? 'Create Bill' : 'Create Invoice');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">{invoices.length} records</p>
        <div className="flex gap-2">
          <button onClick={() => openCreate('bill')} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
            <ShoppingBag size={15} /> Create Bill
          </button>
          <button onClick={() => openCreate('invoice')} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
            <FileText size={15} /> Create Invoice
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by number or customer..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Types</option>
          <option value="invoice">Invoices (Export)</option>
          <option value="bill">Bills (Domestic)</option>
        </select>
        <select value={filterOrderSt} onChange={e => setFilterOrderSt(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Orders</option>
          <option>Order Placed</option>
          <option>Out for Delivery</option>
          <option>Delivered</option>
          <option>Cancelled</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Statuses</option>
          <option>Draft</option><option>Sent</option><option>Paid</option>
          <option>Overdue</option><option>Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Receipt size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Number</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Delivery</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Payment</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(inv => {
                  const r      = inv as any;
                  const isBill = isBillRecord(inv);
                  const ostyle = ORDER_STATUS_COLORS[(r.order_status as OrderStatus) ?? 'Order Placed'];
                  const pstyle = PAYMENT_STATUS_COLORS[(r.payment_status as PaymentStatus) ?? 'Pending'];
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className={`text-sm font-semibold ${isBill ? 'text-amber-600' : 'text-teal-600'}`}>{inv.invoice_number}</p>
                        <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${isBill ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>
                          {isBill ? <ShoppingBag size={10} /> : <FileText size={10} />}
                          {isBill ? ' Bill' : ' Invoice'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-gray-800">{(inv.customers as any)?.customer_name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{(inv.customers as any)?.phone}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">{formatDate(inv.issue_date)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {r.delivery_date ? (
                          <span className="flex items-center gap-1 text-sm text-gray-600">
                            <Truck size={12} className="text-gray-400" />{formatDate(r.delivery_date)}
                          </span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isBill && r.order_status ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ostyle}`}>{r.order_status}</span>
                        ) : (
                          <StatusBadge status={inv.status} />
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {isBill && r.payment_status ? (
                          <div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pstyle}`}>{r.payment_status}</span>
                            {r.payment_method && <p className="text-xs text-gray-400 mt-0.5">{r.payment_method}</p>}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.total, inv.currency)}</p>
                        {isBill && r.advance_amount > 0 && (
                          <p className="text-xs text-amber-600">Adv: {formatCurrency(r.advance_amount, 'INR')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setPreviewInv(inv)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Eye size={14} /></button>
                          <button onClick={() => openEdit(inv)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteId(inv.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={modalTitle} size="2xl">
        <div className="space-y-5">

          {/* Mode banner */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${modalMode === 'bill' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
            {modalMode === 'bill'
              ? <><ShoppingBag size={13} /> Domestic Bill — INR, with order &amp; payment tracking</>
              : <><FileText size={13} /> Export Invoice — International customers, foreign currency</>}
          </div>

          {/* ── Number + Customer ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{modalMode === 'bill' ? 'Bill Number *' : 'Invoice Number *'}</label>
              <input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.invoice_number ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.invoice_number && <p className="text-xs text-red-500 mt-1">{errors.invoice_number}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{modalMode === 'bill' ? 'Domestic Customer *' : 'Export Customer *'}</label>
              <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value, pi_id: '' }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.customer_id ? 'border-red-400' : 'border-gray-200'}`}>
                <option value="">{modalMode === 'bill' ? 'Select domestic customer...' : 'Select export customer...'}</option>
                {modalCustomers.map(c => <option key={c.id} value={c.id}>{c.customer_name}{c.company_name ? ` (${c.company_name})` : ''}</option>)}
              </select>
              {errors.customer_id && <p className="text-xs text-red-500 mt-1">{errors.customer_id}</p>}
              {modalCustomers.length === 0 && <p className="text-xs text-amber-500 mt-1">No {modalMode === 'bill' ? 'domestic' : 'international'} customers found.</p>}
            </div>
          </div>

          {/* ── Customer address auto-display ──────────────────────────────── */}
          {selectedCustomer && (selectedCustomer.address || selectedCustomer.phone || selectedCustomer.email) && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
              <MapPin size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-gray-700">{selectedCustomer.customer_name}</span>
                {selectedCustomer.address && <span className="ml-1">{selectedCustomer.address}</span>}
                {selectedCustomer.phone && <span className="ml-2 text-gray-500">· {selectedCustomer.phone}</span>}
                {selectedCustomer.email && <span className="ml-2 text-gray-500">· {selectedCustomer.email}</span>}
              </div>
            </div>
          )}

          {/* PI link — export only */}
          {modalMode === 'invoice' && form.customer_id && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Link to Proforma Invoice (optional)</label>
              <select value={form.pi_id} onChange={e => setForm(f => ({ ...f, pi_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">None</option>
                {filteredPIs.map(p => <option key={p.id} value={p.id}>{p.pi_number}</option>)}
              </select>
            </div>
          )}

          {/* ── Dates ──────────────────────────────────────────────────────── */}
          {modalMode === 'bill' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bill Date</label>
                <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Expected Delivery Date</label>
                <input type="date" value={form.delivery_date} onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date</label>
                <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          )}

          {/* ── Export-only: incoterms / currency / origin ─────────────────── */}
          {modalMode === 'invoice' && (
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
          {modalMode === 'invoice' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Port of Loading</label>
                <input value={form.port_of_loading} onChange={e => setForm(f => ({ ...f, port_of_loading: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Port of Discharge</label>
                <input value={form.port_of_discharge} onChange={e => setForm(f => ({ ...f, port_of_discharge: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          )}

          {/* ── Bill tracking fields ────────────────────────────────────────── */}
          {modalMode === 'bill' && (
            <>
              {/* Order status + Payment status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Order Status</label>
                  <select value={form.order_status} onChange={e => setForm(f => ({ ...f, order_status: e.target.value as OrderStatus }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Order Placed</option>
                    <option>Out for Delivery</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
                  <select value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value as PaymentStatus }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Pending</option>
                    <option>Advance Paid</option>
                    <option>Fully Paid</option>
                    <option>Credit</option>
                  </select>
                </div>
              </div>

              {/* Payment method + Advance amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Payment Method</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value as PaymentMethod }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">Not specified</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Advance Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">₹</span>
                    <input
                      type="number"
                      value={form.advance_amount}
                      onChange={e => setForm(f => ({ ...f, advance_amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Payment terms + Invoice status ─────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms / Notes</label>
              <input value={form.payment_terms} onChange={e => setForm(f => ({ ...f, payment_terms: e.target.value }))} placeholder={modalMode === 'bill' ? 'e.g. 50% advance, 50% on delivery' : 'e.g. 30 days LC'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {modalMode === 'invoice' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as InvoiceStatus }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option>Draft</option><option>Sent</option><option>Paid</option>
                  <option>Overdue</option><option>Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {/* ── Line items ──────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Products / Items</label>
              <button onClick={() => setLineItems(l => [...l, emptyLine()])} className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                <Plus size={13} /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Product / Description</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium w-20">Qty</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium w-20">Unit</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium w-32">Price ({currencySymbol})</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium w-28">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((l, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <input
                          value={l.product_name}
                          onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, product_name: e.target.value } : x))}
                          placeholder="Product name or description (e.g. Transportation)"
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={l.quantity} onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.unit} onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm">
                          <option>KG</option><option>MT</option><option>PCS</option>
                          <option>BAG</option><option>CTN</option><option>LTR</option>
                          <option>TON</option><option>Trip</option><option>Lot</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" value={l.unit_price} onChange={e => setLineItems(items => items.map((x, j) => j === i ? { ...x, unit_price: e.target.value } : x))} className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none" />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                        {formatCurrency((parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), currencySymbol)}
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => setLineItems(items => items.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={4} className="px-3 py-2 text-sm font-semibold text-gray-700 text-right">Total</td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(subtotal, currencySymbol)}</td>
                    <td></td>
                  </tr>
                  {/* Advance / balance summary — bill only */}
                  {modalMode === 'bill' && parseFloat(form.advance_amount) > 0 && (
                    <>
                      <tr className="bg-amber-50">
                        <td colSpan={4} className="px-3 py-1.5 text-xs text-amber-700 text-right">Advance Paid</td>
                        <td className="px-3 py-1.5 text-right text-xs font-semibold text-amber-700">− {formatCurrency(parseFloat(form.advance_amount), 'INR')}</td>
                        <td></td>
                      </tr>
                      <tr className="bg-amber-50 border-t border-amber-200">
                        <td colSpan={4} className="px-3 py-1.5 text-sm font-bold text-amber-800 text-right">Balance Due</td>
                        <td className="px-3 py-1.5 text-right text-sm font-bold text-amber-800">{formatCurrency(balance, 'INR')}</td>
                        <td></td>
                      </tr>
                    </>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Any additional notes..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className={`flex-1 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60 ${modalMode === 'bill' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'}`}>
              {saving ? 'Saving...' : editId
                ? (modalMode === 'bill' ? 'Update Bill' : 'Update Invoice')
                : (modalMode === 'bill' ? 'Create Bill' : 'Create Invoice')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      {previewInv && (
        <Modal open={!!previewInv} onClose={() => setPreviewInv(null)} title={isBillRecord(previewInv) ? 'Bill Preview' : 'Invoice Preview'} size="2xl">
          <div className="mb-4 flex justify-end">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
              <Download size={15} /> Print / Download PDF
            </button>
          </div>
          <div ref={printRef}><InvoicePreview inv={previewInv} /></div>
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Record" size="sm">
        <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this record?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Print Preview ────────────────────────────────────────────────────────────

function InvoicePreview({ inv }: { inv: Invoice }) {
  const r        = inv as any;
  const customer = inv.customers as Customer | undefined;
  const items    = inv.invoice_line_items ?? [];
  const isDomestic = customer?.type === 'Domestic';
  const cur      = isDomestic ? 'INR' : inv.currency;
  const docLabel = isDomestic ? 'BILL' : 'INVOICE';
  const advance  = r.advance_amount ?? 0;
  const balance  = inv.total - advance;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#1a1a1a' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f766e' }}>WANDER BREEZE EXIM</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{isDomestic ? 'Domestic Trade' : 'Export CRM'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{docLabel}</div>
          <div style={{ color: isDomestic ? '#d97706' : '#0f766e', fontWeight: 600, marginTop: 4 }}>{inv.invoice_number}</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Date: {formatDate(inv.issue_date)}</div>
          {r.delivery_date && <div style={{ color: '#64748b', fontSize: 12 }}>Delivery: {formatDate(r.delivery_date)}</div>}
          {/* Status badges */}
          {isDomestic && r.order_status && (
            <div style={{ marginTop: 6, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{r.order_status}</span>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{r.payment_status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bill-to + Details */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        <div style={{ flex: 1, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Bill To</div>
          {customer && (
            <>
              <div style={{ fontWeight: 600 }}>{customer.customer_name}</div>
              {customer.company_name && <div>{customer.company_name}</div>}
              {customer.address && <div style={{ color: '#475569', fontSize: 12 }}>{customer.address}</div>}
              {customer.country && !isDomestic && <div style={{ color: '#475569', fontSize: 12 }}>{customer.country}</div>}
              {customer.phone && <div style={{ color: '#475569', fontSize: 12 }}>{customer.phone}</div>}
              {customer.email && <div style={{ color: '#475569', fontSize: 12 }}>{customer.email}</div>}
            </>
          )}
        </div>
        <div style={{ flex: 1, background: '#f8fafc', padding: '12px 16px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Details</div>
          {isDomestic ? (
            <>
              <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Currency: </span><strong>INR (₹)</strong></div>
              {r.payment_method && <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Payment via: </span><strong>{r.payment_method}</strong></div>}
              {inv.payment_terms && <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Terms: </span>{inv.payment_terms}</div>}
              {advance > 0 && <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Advance: </span><strong>₹{advance.toLocaleString('en-IN')}</strong></div>}
            </>
          ) : (
            <>
              {inv.incoterms        && <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Incoterms: </span><strong>{inv.incoterms}</strong></div>}
              {inv.currency         && <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Currency: </span><strong>{inv.currency}</strong></div>}
              {inv.country_of_origin && <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Origin: </span>{inv.country_of_origin}</div>}
              {inv.port_of_loading   && <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Loading: </span>{inv.port_of_loading}</div>}
              {inv.port_of_discharge && <div style={{ fontSize: 12, marginBottom: 3 }}><span style={{ color: '#64748b' }}>Discharge: </span>{inv.port_of_discharge}</div>}
              {inv.payment_terms    && <div style={{ fontSize: 12 }}><span style={{ color: '#64748b' }}>Payment: </span>{inv.payment_terms}</div>}
            </>
          )}
        </div>
      </div>

      {/* Line items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Product / Description</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Qty</th>
            <th style={{ padding: '8px 12px', textAlign: 'left',  fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Unit</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Rate</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 12px' }}>
                <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                {item.description && <div style={{ fontSize: 12, color: '#64748b' }}>{item.description}</div>}
              </td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ padding: '8px 12px' }}>{item.unit}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.unit_price, cur)}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total_price, cur)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
            <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>TOTAL</td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{formatCurrency(inv.total, cur)}</td>
          </tr>
          {isDomestic && advance > 0 && (
            <>
              <tr style={{ background: '#fffbeb' }}>
                <td colSpan={4} style={{ padding: '6px 12px', textAlign: 'right', color: '#92400e', fontSize: 12 }}>Advance Received ({r.payment_method || 'Paid'})</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', color: '#92400e', fontSize: 12, fontWeight: 600 }}>− {formatCurrency(advance, 'INR')}</td>
              </tr>
              <tr style={{ background: '#fffbeb', borderTop: '1px solid #fde68a' }}>
                <td colSpan={4} style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, color: '#92400e' }}>BALANCE DUE</td>
                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#92400e' }}>{formatCurrency(balance, 'INR')}</td>
              </tr>
            </>
          )}
        </tfoot>
      </table>

      {/* Notes */}
      {inv.notes && (
        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 12, color: '#475569' }}>{inv.notes}</div>
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center', color: '#94a3b8', fontSize: 11, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
        Wander Breeze Exim | Computer Generated {isDomestic ? 'Bill' : 'Invoice'}
      </div>
    </div>
  );
}