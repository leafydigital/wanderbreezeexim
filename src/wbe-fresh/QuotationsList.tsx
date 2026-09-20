import { useEffect, useState } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { supabase, Quotation } from '../crm/lib/supabase';
import { useAuth } from '../crm/lib/auth';
import { formatDate } from '../crm/lib/wbeFormat';

const STATUS_COLORS: Record<string, string> = {
  'Created': 'bg-gray-100 text-gray-700',
  'Sent to Customer': 'bg-blue-50 text-blue-700',
  'Modified': 'bg-amber-50 text-amber-700',
  'Approved': 'bg-green-50 text-green-700',
};

/**
 * Lists WBE Fresh quotations (module='wbe_fresh').
 * viewer="staff": sees every WBE Fresh quotation, can move Created -> Sent
 *   to Customer, and Sent/Modified -> Approved (representing a phone/WhatsApp
 *   confirmation from the customer). Editing a quotation after it's been
 *   sent is what flips it to Modified elsewhere; this list just shows status.
 * viewer="customer": sees only their own quotations, can Approve one that's
 *   been Sent to them.
 */
export default function QuotationsList({
  viewer,
  customerId,
  refreshKey,
}: {
  viewer: 'staff' | 'customer';
  customerId?: string;
  refreshKey?: number;
}) {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { load(); }, [viewer, customerId, refreshKey]);

  async function load() {
    setLoading(true);
    let query = supabase.from('wbefresh_quotations').select('*').order('created_at', { ascending: false });
    if (viewer === 'customer' && customerId) query = query.eq('customer_id', customerId);
    const { data } = await query;
    setQuotations((data as Quotation[]) ?? []);
    setLoading(false);
  }

  async function setStatus(q: Quotation, status: string) {
    setBusyId(q.id);
    const patch: Record<string, unknown> = { status };
    if (status === 'Approved') {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = user?.id ?? null;
    }
    await supabase.from('wbefresh_quotations').update(patch).eq('id', q.id);
    setBusyId(null);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (quotations.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">No quotations yet.</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quote #</th>
            {viewer === 'staff' && <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Customer</th>}
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th className="px-4 py-3 w-40"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {quotations.map(q => (
            <tr key={q.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-sm font-semibold text-teal-600">{q.quote_number}</td>
              {viewer === 'staff' && <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-700">{q.customer_name}</td>}
              <td className="px-4 py-3 hidden sm:table-cell text-sm text-gray-500">{formatDate(q.issue_date)}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₹{q.total_amount.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[q.status ?? 'Created']}`}>{q.status ?? 'Created'}</span>
              </td>
              <td className="px-4 py-3">
                {viewer === 'staff' && q.status === 'Created' && (
                  <button
                    onClick={() => setStatus(q, 'Sent to Customer')}
                    disabled={busyId === q.id}
                    className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {busyId === q.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Send to Customer
                  </button>
                )}
                {viewer === 'staff' && (q.status === 'Sent to Customer' || q.status === 'Modified') && (
                  <button
                    onClick={() => setStatus(q, 'Approved')}
                    disabled={busyId === q.id}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {busyId === q.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Mark Approved
                  </button>
                )}
                {viewer === 'customer' && q.status === 'Sent to Customer' && (
                  <button
                    onClick={() => setStatus(q, 'Approved')}
                    disabled={busyId === q.id}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {busyId === q.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
