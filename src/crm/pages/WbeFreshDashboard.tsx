import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, Scale, Package } from 'lucide-react';
import { supabase, Vegetable } from '../lib/supabase';

interface Row {
  vegetable_id: string | null;
  product_name: string;
  qtyKg: number;
  income: number;
  cost: number;
}

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

/** Inline line chart — no external chart library, just SVG. */
function LineChart({ data }: { data: { label: string; value: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-gray-400 py-8 text-center">No sales this month yet.</p>;
  const w = 640, h = 220, pad = 32;
  const max = Math.max(...data.map(d => d.value), 1);
  const step = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = pad + step * i;
    const y = h - pad - (d.value / max) * (h - pad * 2);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg width={w} height={h} className="min-w-[640px]">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e5e7eb" strokeWidth={1} />
        <path d={path} fill="none" stroke="#0d9488" strokeWidth={2} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="#0d9488" />
            <text x={p.x} y={h - pad + 16} fontSize={10} fill="#6b7280" textAnchor="middle">
              {p.label.length > 10 ? p.label.slice(0, 9) + '…' : p.label}
            </text>
            <text x={p.x} y={p.y - 8} fontSize={10} fill="#0f766e" textAnchor="middle" fontWeight={600}>
              {p.value.toFixed(0)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function WbeFreshDashboard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const { start, end } = monthRange();
      const { data: quotes } = await supabase
        .from('wbefresh_quotations')
        .select('id')
        .eq('status', 'Approved')
        .gte('issue_date', start)
        .lt('issue_date', end);
      const quoteIds = (quotes ?? []).map(q => q.id);

      if (quoteIds.length === 0) { setRows([]); return; }

      const [{ data: items }, { data: vegs }] = await Promise.all([
        supabase.from('wbefresh_quotation_line_items').select('*').in('quotation_id', quoteIds),
        supabase.from('wbefresh_vegetables').select('*'),
      ]);

      const vegMap = new Map<string, Vegetable>((vegs as Vegetable[] ?? []).map(v => [v.id, v]));
      const byVeg = new Map<string, Row>();

      for (const li of items ?? []) {
        const veg = li.vegetable_id ? vegMap.get(li.vegetable_id) : null;
        const key = li.vegetable_id ?? li.product_name;
        const qtyKg = (li.units_ordered ?? 0) * (li.packing_qty ?? 0);
        const income = li.total_price ?? 0;
        const cost = veg ? veg.supplier_price * qtyKg : 0;
        const existing = byVeg.get(key);
        if (existing) {
          existing.qtyKg += qtyKg;
          existing.income += income;
          existing.cost += cost;
        } else {
          byVeg.set(key, { vegetable_id: li.vegetable_id, product_name: li.product_name, qtyKg, income, cost });
        }
      }
      setRows(Array.from(byVeg.values()));
    } finally {
      setLoading(false);
    }
  }

  const income = rows.reduce((s, r) => s + r.income, 0);
  const expenses = rows.reduce((s, r) => s + r.cost, 0);
  const margin = income - expenses;
  const totalQty = rows.reduce((s, r) => s + r.qtyKg, 0);

  const top10 = [...rows].sort((a, b) => b.qtyKg - a.qtyKg).slice(0, 10);
  const bottom5 = [...rows].filter(r => r.qtyKg > 0).sort((a, b) => a.qtyKg - b.qtyKg).slice(0, 5);

  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">WBE Fresh — {monthLabel}</h2>
        <p className="text-sm text-gray-500">Based on Approved orders/quotations this month.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2"><TrendingUp size={14} /> Income</div>
          <p className="text-xl font-bold text-gray-900">₹{income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2"><TrendingDown size={14} /> Expenses</div>
          <p className="text-xl font-bold text-gray-900">₹{expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2"><Wallet size={14} /> Margin</div>
          <p className={`text-xl font-bold ${margin >= 0 ? 'text-teal-700' : 'text-red-600'}`}>₹{margin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-2"><Scale size={14} /> Total Quantity</div>
          <p className="text-xl font-bold text-gray-900">{totalQty.toLocaleString('en-IN', { maximumFractionDigits: 0 })} kg</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Top 10 Best-Selling Vegetables (kg)</h3>
        <LineChart data={top10.map(r => ({ label: r.product_name, value: r.qtyKg }))} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-800 px-4 pt-4 pb-2 flex items-center gap-1.5"><Package size={15} /> Least-Selling Vegetables</h3>
        {bottom5.length === 0 ? (
          <p className="text-sm text-gray-400 px-4 pb-4">No sales this month yet.</p>
        ) : (
          <table className="w-full">
            <tbody className="divide-y divide-gray-50">
              {bottom5.map(r => (
                <tr key={r.vegetable_id ?? r.product_name}>
                  <td className="px-4 py-2.5 text-sm text-gray-800">{r.product_name}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-500 text-right">{r.qtyKg.toLocaleString('en-IN')} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
