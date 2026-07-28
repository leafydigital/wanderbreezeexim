import { useEffect, useRef, useState } from 'react';
import { Plus, Search, Eye, Trash2, FileText, Download, X, Receipt, ArrowRightCircle } from 'lucide-react';
import { supabase, Quotation, QuotationItem, Customer } from '../lib/supabase';
import Modal from '../components/Modal';
import { formatCurrency, formatDate, today } from '../lib/utils';

interface LineItemForm {
  product_name: string;
  price_per_kg: string;
  quantity_kg: string;
}

interface CompanyProfile {
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
}

interface BankAccount {
  bank_name: string;
  branch: string;
  account_name: string;
  account_number: string;
  ifsc_code: string;
  swift_code: string;
}

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_').trim();
}

const emptyLine = (): LineItemForm => ({ product_name: '', price_per_kg: '', quantity_kg: '' });

const emptyForm = {
  customer_name: '',
  company_name: '',
  phone: '',
  email: '',
  address: '',
  validity_days: '3',
  validity_time_of_day: 'evening',
  payment_terms: '70% advance on order booking, 30% before shipment',
  gst_percentage: '5',
  notes: '',
};

function n(v: string): number {
  return parseFloat(v) || 0;
}

// DD/MM/YYYY, matching how the validity sentence is meant to read
function formatDMY(dateStr: string): string {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function validitySentence(days: number, validUntil: string, timeOfDay: string): string {
  if (!days || !validUntil) return '';
  return `This quotation is valid for ${days} day${days !== 1 ? 's' : ''} until ${formatDMY(validUntil)} ${timeOfDay}.`;
}

function gstAmountOf(subtotal: number, gstPct: number): number {
  return subtotal * ((gstPct || 0) / 100);
}

function grandTotalOf(subtotal: number, gstPct: number): number {
  return subtotal + gstAmountOf(subtotal, gstPct);
}

export default function Quotations({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [converting, setConverting] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [nextNumber, setNextNumber] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [lineItems, setLineItems] = useState<LineItemForm[]>([emptyLine()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [bank, setBank] = useState<BankAccount | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQuotations();
    fetchCompany();
    fetchBank();
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('customer_name');
    setCustomers((data as Customer[]) ?? []);
  }

  async function fetchCompany() {
    const { data } = await supabase.from('company_settings').select('*').limit(1).maybeSingle();
    setCompany((data as CompanyProfile) ?? null);
  }

  async function fetchBank() {
    const { data } = await supabase.from('bank_accounts').select('*').eq('is_active', true).limit(1).maybeSingle();
    setBank((data as BankAccount) ?? null);
  }

  async function fetchQuotations() {
    setLoading(true);
    const { data } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
    setQuotations((data as Quotation[]) ?? []);
    setLoading(false);
  }

  async function openNew() {
    setForm(emptyForm);
    setLineItems([emptyLine()]);
    setErrors({});
    setSelectedCustomerId('');
    const year = new Date().getFullYear();
    const { count } = await supabase.from('quotations').select('id', { count: 'exact', head: true });
    setNextNumber(`WBE-QT-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`);
    setModalOpen(true);
  }

  function pickCustomer(id: string) {
    setSelectedCustomerId(id);
    if (!id) return;
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setForm((f) => ({
      ...f,
      customer_name: c.customer_name,
      company_name: c.company_name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
    }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customer_name.trim()) e.customer_name = 'Customer name is required';
    if (!lineItems.some((l) => l.product_name.trim())) e.items = 'Add at least one product';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const validUntilPreview = addDays(today(), n(form.validity_days));
  const subtotal = lineItems.reduce((s, l) => s + n(l.price_per_kg) * n(l.quantity_kg), 0);

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const items: QuotationItem[] = lineItems
      .filter((l) => l.product_name.trim())
      .map((l) => ({
        product_name: l.product_name,
        price_per_kg: n(l.price_per_kg),
        quantity_kg: n(l.quantity_kg),
        total: n(l.price_per_kg) * n(l.quantity_kg),
      }));
    const total_amount = items.reduce((s, i) => s + i.total, 0);
    const validity_days = n(form.validity_days) || 0;
    const valid_until = validity_days > 0 ? addDays(today(), validity_days) : null;

    let customer_id = selectedCustomerId || null;
    if (!customer_id) {
      const { data: newCust, error: custError } = await supabase
        .from('customers')
        .insert({
          customer_name: form.customer_name,
          company_name: form.company_name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          country: 'India',
          type: 'Domestic',
        })
        .select('id')
        .single();
      if (custError) {
        setSaving(false);
        alert(`Could not save the customer:\n${custError.message}`);
        return;
      }
      customer_id = newCust?.id ?? null;
    }

    const { data } = await supabase
      .from('quotations')
      .insert({
        quote_number: nextNumber,
        customer_id,
        customer_name: form.customer_name,
        company_name: form.company_name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        items,
        total_amount,
        validity_days,
        valid_until,
        validity_time_of_day: form.validity_time_of_day,
        payment_terms: form.payment_terms,
        gst_percentage: n(form.gst_percentage),
        notes: form.notes,
        issue_date: today(),
      })
      .select('*')
      .single();

    setSaving(false);
    setModalOpen(false);
    await fetchQuotations();
    await fetchCustomers();
    if (data) setPreviewQuote(data as Quotation);
  }

  async function handleDelete(id: string) {
    await supabase.from('quotations').delete().eq('id', id);
    setDeleteId(null);
    fetchQuotations();
  }

  async function convertToBill(q: Quotation) {
    setConverting(q.id);
    try {
      let customer_id = q.customer_id;
      if (!customer_id) {
        const { data: newCust, error } = await supabase
          .from('customers')
          .insert({
            customer_name: q.customer_name,
            company_name: q.company_name,
            phone: q.phone,
            email: q.email,
            address: q.address,
            country: 'India',
            type: 'Domestic',
          })
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        customer_id = newCust?.id ?? null;
      }

      const payload = {
        customer_id,
        payment_terms: q.payment_terms || '',
        notes: q.notes || '',
        lineItems: (q.items ?? []).map((item) => ({
          product_name: item.product_name,
          hs_code: '',
          description: '',
          quantity: String(item.quantity_kg),
          unit: 'KG',
          unit_price: String(item.price_per_kg),
          gst_percentage: String(q.gst_percentage || 0),
        })),
      };
      sessionStorage.setItem('wbe_convert_quote_to_bill', JSON.stringify(payload));
      onNavigate?.('invoices');
    } catch (e: any) {
      alert(`Could not convert this quotation to a bill:\n${e.message || e}`);
    }
    setConverting(null);
  }

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content || !previewQuote) return;
    const nameForFile = previewQuote.company_name?.trim() || previewQuote.customer_name;
    const dateForFile = formatDMY(previewQuote.issue_date).replace(/\//g, '-');
    const title = `Quotation_${sanitizeFilename(nameForFile)}_${dateForFile}`;
    const w = window.open('', '', 'width=900,height=700');
    if (!w) return;
    w.document.write(`<html><head><title>${title}</title><style>
      body{font-family:Arial,sans-serif;color:#1a1a1a;margin:0;padding:20px}
      table{width:100%;border-collapse:collapse}
      th,td{padding:8px 12px;text-align:left}
      th{background:#f0fdfa}td{border-bottom:1px solid #e2e8f0}
    </style></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  }

  const filtered = quotations.filter(
    (q) =>
      !search ||
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      q.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  function isExpired(q: Quotation): boolean {
    if (!q.valid_until) return false;
    return new Date(q.valid_until) < new Date(new Date().toDateString());
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">{quotations.length} quotations</p>
        <button onClick={openNew} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus size={15} /> New Quotation
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by quote number, customer, or company..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Receipt size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No quotations yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Quote #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Product(s)</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Validity</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-teal-600">{q.quote_number}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-800">{q.customer_name}</p>
                      {q.company_name && <p className="text-xs text-gray-400">{q.company_name}</p>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-500">
                      {(q.items ?? []).map((i) => i.product_name).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(grandTotalOf(q.total_amount, q.gst_percentage), 'INR')}
                      {q.gst_percentage > 0 && <span className="block text-xs font-normal text-gray-400">incl. GST @ {q.gst_percentage}%</span>}
                    </td>
                    <td className="px-4 py-3">
                      {q.valid_until ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isExpired(q) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                          {isExpired(q) ? 'Expired' : `Until ${formatDMY(q.valid_until)}`}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => convertToBill(q)}
                          disabled={converting === q.id}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors disabled:opacity-50"
                          title="Convert to Bill"
                        >
                          <ArrowRightCircle size={14} />
                        </button>
                        <button onClick={() => setPreviewQuote(q)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setDeleteId(q.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
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

      {/* New quotation modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Quotation" size="2xl">
        <div className="space-y-4">
          <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <FileText size={15} className="text-teal-600" />
            <span className="text-sm text-teal-700">
              Quote Number: <strong>{nextNumber}</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Existing Customer</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => pickCustomer(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">+ New Customer (type details below)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name}{c.company_name ? ` (${c.company_name})` : ''} — {c.type}
                </option>
              ))}
            </select>
            {selectedCustomerId && (
              <p className="text-xs text-gray-400 mt-1">Loaded from Customers — edits below won't change their saved record.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                value={form.customer_name}
                onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.customer_name ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
              <input
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address / Details</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Products</label>
              <button onClick={() => setLineItems((l) => [...l, emptyLine()])} className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1">
                <Plus size={13} /> Add Row
              </button>
            </div>
            {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items}</p>}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium">Product Name</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium w-28">Price / KG (₹)</th>
                    <th className="text-left px-3 py-2 text-xs text-gray-500 font-medium w-24">Qty (KG)</th>
                    <th className="text-right px-3 py-2 text-xs text-gray-500 font-medium w-28">Amount</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((l, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <input
                          value={l.product_name}
                          onChange={(e) => setLineItems((items) => items.map((x, j) => (j === i ? { ...x, product_name: e.target.value } : x)))}
                          placeholder="e.g. Black Pepper 550 GL"
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={l.price_per_kg}
                          onChange={(e) => setLineItems((items) => items.map((x, j) => (j === i ? { ...x, price_per_kg: e.target.value } : x)))}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={l.quantity_kg}
                          onChange={(e) => setLineItems((items) => items.map((x, j) => (j === i ? { ...x, quantity_kg: e.target.value } : x)))}
                          className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-700">{formatCurrency(n(l.price_per_kg) * n(l.quantity_kg), 'INR')}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => setLineItems((items) => items.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-500">
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-3 py-2 text-sm font-semibold text-gray-700 text-right">
                      Subtotal
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(subtotal, 'INR')}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">GST %</label>
              <select
                value={form.gst_percentage}
                onChange={(e) => setForm((f) => ({ ...f, gst_percentage: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="0">0% — Exempt / Export</option>
                <option value="0.1">0.1% — Merchant Exporter (Concessional)</option>
                <option value="5">5% — Branded / Packaged Spices</option>
                <option value="18">18% — Blended / Mixed Condiments</option>
              </select>
            </div>
            {n(form.gst_percentage) > 0 && (
              <div className="text-xs text-gray-500 space-y-0.5 pb-2">
                <p>
                  GST @ {form.gst_percentage}%: <span className="font-medium text-gray-700">{formatCurrency(gstAmountOf(subtotal, n(form.gst_percentage)), 'INR')}</span>
                </p>
                <p>
                  Grand Total: <span className="font-semibold text-gray-900">{formatCurrency(grandTotalOf(subtotal, n(form.gst_percentage)), 'INR')}</span>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Validity (days)</label>
              <input
                type="number"
                value={form.validity_days}
                onChange={(e) => setForm((f) => ({ ...f, validity_days: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time of Day</label>
              <select
                value={form.validity_time_of_day}
                onChange={(e) => setForm((f) => ({ ...f, validity_time_of_day: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="morning">morning</option>
                <option value="afternoon">afternoon</option>
                <option value="evening">evening</option>
                <option value="end of day">end of day</option>
              </select>
            </div>
          </div>
          {n(form.validity_days) > 0 && (
            <p className="text-xs text-gray-500 italic">
              {validitySentence(n(form.validity_days), validUntilPreview, form.validity_time_of_day)}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
            <input
              value={form.payment_terms}
              onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))}
              placeholder="e.g. 70% advance on order booking, 30% before shipment"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Generate Quotation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview / print */}
      {previewQuote && (
        <Modal open={!!previewQuote} onClose={() => setPreviewQuote(null)} title="Quotation Preview" size="2xl">
          <div className="mb-4 flex justify-end gap-2">
            <button onClick={() => setPreviewQuote(null)} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              <X size={15} /> Close
            </button>
            <button
              onClick={() => convertToBill(previewQuote)}
              disabled={converting === previewQuote.id}
              className="flex items-center gap-2 border border-teal-200 text-teal-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-50 disabled:opacity-50"
            >
              <ArrowRightCircle size={15} /> {converting === previewQuote.id ? 'Converting...' : 'Convert to Bill'}
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
              <Download size={15} /> Print / Download PDF
            </button>
          </div>
          <div ref={printRef}>
            <QuotationDocument quote={previewQuote} company={company} bank={bank} />
          </div>
        </Modal>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Quotation" size="sm">
        <p className="text-sm text-gray-600 mb-5">Are you sure you want to delete this quotation?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">
            Cancel
          </button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

function QuotationDocument({ quote, company, bank }: { quote: Quotation; company: CompanyProfile | null; bank: BankAccount | null }) {
  const sentence = quote.valid_until ? validitySentence(quote.validity_days, quote.valid_until, quote.validity_time_of_day) : '';
  const companyName = company?.company_name || 'Wander Breeze Exim';
  const addressParts = [company?.address, company?.city, company?.state, company?.pincode].filter(Boolean);
  const contactParts = [company?.phone, company?.email].filter(Boolean);
  const hasGst = quote.gst_percentage > 0;
  const gstAmt = gstAmountOf(quote.total_amount, quote.gst_percentage);
  const grandTotal = grandTotalOf(quote.total_amount, quote.gst_percentage);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#1a1a1a' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0f766e' }}>{companyName.toUpperCase()}</div>
          {addressParts.length > 0 && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{addressParts.join(', ')}</div>}
          {contactParts.length > 0 && <div style={{ fontSize: 12, color: '#64748b' }}>{contactParts.join(' · ')}</div>}
          {company?.gstin && <div style={{ fontSize: 12, color: '#64748b' }}>GSTIN: {company.gstin}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>QUOTATION</div>
          <div style={{ color: '#0f766e', fontWeight: 600, marginTop: 4 }}>{quote.quote_number}</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Date: {formatDate(quote.issue_date)}</div>
        </div>
      </div>

      <div style={{ background: '#f0fdfa', padding: '12px 16px', borderRadius: 8, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', marginBottom: 6 }}>Quoted To</div>
        <div style={{ fontWeight: 600 }}>{quote.customer_name}</div>
        {quote.company_name && <div>{quote.company_name}</div>}
        {quote.address && <div style={{ color: '#475569', fontSize: 12 }}>{quote.address}</div>}
        {quote.phone && <div style={{ color: '#475569', fontSize: 12 }}>{quote.phone}</div>}
        {quote.email && <div style={{ color: '#475569', fontSize: 12 }}>{quote.email}</div>}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr style={{ background: '#f0fdfa' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>Product</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>Price / KG</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>Qty (KG)</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 11, color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {(quote.items ?? []).map((item, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.product_name}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.price_per_kg, 'INR')}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.quantity_kg}</td>
              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total, 'INR')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
            <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: hasGst ? 400 : 700, color: hasGst ? '#64748b' : undefined }}>
              {hasGst ? 'Subtotal' : 'TOTAL'}
            </td>
            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: hasGst ? 400 : 700, fontSize: hasGst ? 13 : 15, color: hasGst ? '#64748b' : undefined }}>
              {formatCurrency(quote.total_amount, 'INR')}
            </td>
          </tr>
          {hasGst && (
            <>
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={3} style={{ padding: '4px 12px', textAlign: 'right', color: '#64748b', fontSize: 13 }}>
                  GST @ {quote.gst_percentage}%
                </td>
                <td style={{ padding: '4px 12px', textAlign: 'right', color: '#64748b', fontSize: 13 }}>{formatCurrency(gstAmt, 'INR')}</td>
              </tr>
              <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <td colSpan={3} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                  GRAND TOTAL
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: 15 }}>{formatCurrency(grandTotal, 'INR')}</td>
              </tr>
            </>
          )}
        </tfoot>
      </table>

      {quote.payment_terms && (
        <div style={{ fontSize: 12, marginBottom: 10 }}>
          <span style={{ fontWeight: 700, color: '#0f766e' }}>Payment Terms: </span>
          {quote.payment_terms}
        </div>
      )}

      {bank && (bank.bank_name || bank.account_number) && (
        <div style={{ background: '#f0fdfa', padding: '10px 14px', borderRadius: 6, marginBottom: 12, border: '1px solid #ccfbf1' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', marginBottom: 6 }}>Bank Details</div>
          <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
            {bank.account_name && <div>Account Name: {bank.account_name}</div>}
            {bank.bank_name && <div>Bank: {bank.bank_name}{bank.branch ? `, ${bank.branch}` : ''}</div>}
            {bank.account_number && <div>Account No: {bank.account_number}</div>}
            {bank.ifsc_code && <div>IFSC: {bank.ifsc_code}</div>}
            {bank.swift_code && <div>SWIFT: {bank.swift_code}</div>}
          </div>
        </div>
      )}

      {quote.notes && (
        <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 12, color: '#475569' }}>{quote.notes}</div>
        </div>
      )}

      {sentence && (
        <div style={{ fontSize: 12, fontStyle: 'italic', color: '#334155', marginTop: 8, marginBottom: 8 }}>{sentence}</div>
      )}

      <div style={{ marginTop: 16, textAlign: 'center', color: '#94a3b8', fontSize: 11, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
        {companyName} · Computer Generated Quotation · Prices subject to change without prior notice
      </div>
    </div>
  );
}