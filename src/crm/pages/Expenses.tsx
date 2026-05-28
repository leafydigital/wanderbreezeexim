import { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, DollarSign } from 'lucide-react';
import { supabase, Expense } from '../lib/supabase';
import Modal from '../components/Modal';
import { formatCurrency, formatDate, today, currentMonthRange } from '../lib/utils';

const CATEGORIES = ['General', 'Transportation', 'Logistics', 'Port Charges', 'Documentation', 'Staff', 'Marketing', 'Office', 'Other'];

const emptyForm = {
  expense_date: today(),
  description: '',
  category: 'General',
  amount: '',
};

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchExpenses();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchExpenses(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  async function fetchExpenses() {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    setExpenses(data ?? []);
    setLoading(false);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = 'Description required';
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Valid amount required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount), updated_at: new Date().toISOString() };
    if (editId) {
      await supabase.from('expenses').update(payload).eq('id', editId);
    } else {
      await supabase.from('expenses').insert(payload);
    }
    await fetchExpenses();
    setModalOpen(false);
    setSaving(false);
    setEditId(null);
    setForm(emptyForm);
  }

  async function handleDelete(id: string) {
    await supabase.from('expenses').delete().eq('id', id);
    setDeleteId(null);
    fetchExpenses();
  }

  function openEdit(e: Expense) {
    setForm({ expense_date: e.expense_date, description: e.description, category: e.category, amount: String(e.amount) });
    setEditId(e.id);
    setErrors({});
    setModalOpen(true);
  }

  // Monthly summary
  const { start: monthStart, end: monthEnd } = currentMonthRange();
  const monthlyExpenses = expenses.filter(e => e.expense_date >= monthStart && e.expense_date <= monthEnd);
  const monthlyTotal = monthlyExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const catTotals = monthlyExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || e.category === filterCat;
    const matchFrom = !dateFrom || e.expense_date >= dateFrom;
    const matchTo = !dateTo || e.expense_date <= dateTo;
    return matchSearch && matchCat && matchFrom && matchTo;
  });

  const filteredTotal = filtered.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-5">
      {/* Monthly summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-500 font-medium mb-1">This Month Total</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(monthlyTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{monthlyExpenses.length} expenses</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sm:col-span-2">
          <p className="text-xs text-gray-500 font-medium mb-3">By Category (This Month)</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="text-xs font-medium text-gray-600">{cat}</span>
                <span className="text-xs text-gray-900 font-semibold ml-2">{formatCurrency(amt)}</span>
              </div>
            ))}
            {Object.keys(catTotals).length === 0 && <p className="text-xs text-gray-400">No data for this month</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">{expenses.length} total expenses</p>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setErrors({}); setModalOpen(true); }} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="From" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="To" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <DollarSign size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No expenses found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                    <th className="px-5 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{formatDate(e.expense_date)}</td>
                      <td className="px-5 py-3.5"><p className="text-sm font-medium text-gray-900">{e.description}</p></td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{e.category}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(e.amount)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteId(e.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-700">Filtered Total</td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-red-600">{formatCurrency(filteredTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Expense' : 'Add Expense'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.description ? 'border-red-400' : 'border-gray-200'}`} placeholder="What was this expense for?" />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount (INR) *</label>
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.amount ? 'border-red-400' : 'border-gray-200'}`} placeholder="0.00" />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
              {saving ? 'Saving...' : editId ? 'Update' : 'Add Expense'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Expense" size="sm">
        <p className="text-sm text-gray-600 mb-5">Delete this expense record?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
