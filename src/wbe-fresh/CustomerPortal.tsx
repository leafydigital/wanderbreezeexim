import { useEffect, useState } from 'react';
import { Sprout, LogOut, ShoppingCart, Image as ImageIcon } from 'lucide-react';
import { supabase, Vegetable, Customer } from '../crm/lib/supabase';
import { useAuth } from '../crm/lib/auth';
import PriceTrend from '../crm/components/PriceTrend';
import QuotationModal from './QuotationModal';
import QuotationsList from './QuotationsList';

/**
 * WBE-Fresh customer's own portal: view final prices and place their own
 * orders (created already "Approved" — no staff intermediary — so it lands
 * straight in the admin's verification queue).
 */
export default function CustomerPortal() {
  const { user, signOut } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [veggies, setVeggies] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderOpen, setOrderOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState<'prices' | 'orders'>('prices');

  useEffect(() => {
    load(true);
    const interval = setInterval(() => load(false), 30_000);
    const channel = supabase
      .channel('customer-prices-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wbefresh_vegetables' }, () => load(false))
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [user?.id]);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    const [custRes, vegRes] = await Promise.all([
      supabase.from('customers').select('*').eq('linked_user_id', user?.id ?? '').maybeSingle(),
      supabase.from('wbefresh_vegetables').select('*').eq('is_approved', true).eq('is_active', true).order('name_en'),
    ]);
    setCustomer((custRes.data as Customer) ?? null);
    setVeggies((vegRes.data as Vegetable[]) ?? []);
    if (showSpinner) setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">WBE Fresh</h1>
              <p className="text-[11px] text-gray-400 leading-tight">{customer?.customer_name ?? user?.name}</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex gap-1 border-b border-gray-200 sm:border-0">
            <button onClick={() => setTab('prices')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'prices' ? 'border-teal-500 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Prices</button>
            <button onClick={() => setTab('orders')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'orders' ? 'border-teal-500 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>My Orders</button>
          </div>
          <button onClick={() => setOrderOpen(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
            <ShoppingCart size={15} /> Place Order
          </button>
        </div>

        {tab === 'prices' ? (
          loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {veggies.map(v => (
                <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                  <div className="h-24 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {v.image_url ? <img src={v.image_url} alt={v.name_en} className="w-full h-full object-cover" /> : <ImageIcon size={26} className="text-gray-300" />}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{v.name_en}</p>
                    <p className="text-[11px] text-gray-400 mb-1">1 {v.packing_unit} = {v.packing_qty}{v.unit}</p>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold text-teal-700">₹{v.live_final_price ?? 0}</span>
                      <span className="text-xs text-gray-400">/{v.unit}</span>
                    </div>
                    <PriceTrend current={v.live_final_price ?? 0} previous={v.previous_live_price} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <QuotationsList viewer="customer" customerId={customer?.id} refreshKey={refreshKey} />
        )}
      </main>

      <QuotationModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        mode="customer"
        fixedCustomer={customer}
        onCreated={() => { setRefreshKey(k => k + 1); setTab('orders'); }}
      />
    </div>
  );
}
