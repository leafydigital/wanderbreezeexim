import { useEffect, useState } from 'react';
import { Users, FileText, TrendingUp, TrendingDown, DollarSign, ArrowRight, Globe, MapPin } from 'lucide-react';
import { supabase, Customer, Invoice } from '../lib/supabase';
import { formatCurrency, formatDate, currentMonthRange } from '../lib/utils';

interface DashboardStats {
  totalCustomers: number;
  totalPIs: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  recentCustomers: Customer[];
  recentInvoices: Invoice[];
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalPIs: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    recentCustomers: [],
    recentInvoices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchStats(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  async function fetchStats() {
    const { start, end } = currentMonthRange();

    const [customersRes, pisRes, invoicesRes, expensesRes, recentCustomersRes, recentInvoicesRes] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('proforma_invoices').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('total').gte('issue_date', start).lte('issue_date', end).eq('status', 'Paid'),
      supabase.from('expenses').select('amount').gte('expense_date', start).lte('expense_date', end),
      supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('invoices').select('*, customers(customer_name, company_name)').order('created_at', { ascending: false }).limit(5),
    ]);

    const monthlyIncome = (invoicesRes.data ?? []).reduce((s, r) => s + Number(r.total), 0);
    const monthlyExpenses = (expensesRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

    setStats({
      totalCustomers: customersRes.count ?? 0,
      totalPIs: pisRes.count ?? 0,
      monthlyIncome,
      monthlyExpenses,
      recentCustomers: recentCustomersRes.data ?? [],
      recentInvoices: (recentInvoicesRes.data as Invoice[]) ?? [],
    });
    setLoading(false);
  }

  const profit = stats.monthlyIncome - stats.monthlyExpenses;

  const cards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      light: 'bg-blue-50',
      text: 'text-blue-600',
      action: () => onNavigate('customers'),
    },
    {
      label: 'Proforma Invoices',
      value: stats.totalPIs,
      icon: FileText,
      light: 'bg-teal-50',
      text: 'text-teal-600',
      action: () => onNavigate('proforma'),
    },
    {
      label: 'Monthly Income',
      value: formatCurrency(stats.monthlyIncome),
      icon: TrendingUp,
      light: 'bg-green-50',
      text: 'text-green-600',
      action: () => onNavigate('invoices'),
    },
    {
      label: 'Monthly Expenses',
      value: formatCurrency(stats.monthlyExpenses),
      icon: TrendingDown,
      light: 'bg-red-50',
      text: 'text-red-600',
      action: () => onNavigate('expenses'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Welcome back</h2>
        <p className="text-slate-300 text-sm">Here's what's happening with your export business today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, light, text, action }) => (
          <button
            key={label}
            onClick={action}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${light} rounded-lg flex items-center justify-center`}>
                <Icon size={20} className={text} />
              </div>
              <ArrowRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors mt-1" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </button>
        ))}
      </div>

      {/* Profit summary */}
      <div className={`rounded-xl p-5 border ${profit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <DollarSign size={20} className={profit >= 0 ? 'text-green-600' : 'text-red-600'} />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Current Month Profit</p>
            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(profit)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent customers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Customers</h3>
            <button onClick={() => onNavigate('customers')} className="text-teal-600 text-xs font-medium hover:text-teal-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentCustomers.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No customers yet</p>
            ) : stats.recentCustomers.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-600 text-xs font-bold">{c.customer_name[0]?.toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.customer_name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.company_name || c.country}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  {c.type === 'International' ? <Globe size={12} /> : <MapPin size={12} />}
                  {c.type === 'Domestic' ? 'Dom' : 'Intl'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Invoices</h3>
            <button onClick={() => onNavigate('invoices')} className="text-teal-600 text-xs font-medium hover:text-teal-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentInvoices.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">No invoices yet</p>
            ) : stats.recentInvoices.map(inv => (
              <div key={inv.id} className="px-5 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                  <p className="text-xs text-gray-500">{(inv.customers as any)?.customer_name ?? '—'} · {formatDate(inv.issue_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(inv.total, inv.currency)}</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
