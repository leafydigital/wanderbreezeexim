import { useEffect, useState } from 'react';
import { Sprout, LogOut, Search, Image as ImageIcon, FileText, Users as UsersIcon } from 'lucide-react';
import { supabase, Vegetable } from '../crm/lib/supabase';
import { useAuth } from '../crm/lib/auth';
import PriceTrend from '../crm/components/PriceTrend';
import CustomerModal from './CustomerModal';
import QuotationModal from './QuotationModal';
import QuotationsList from './QuotationsList';

/**
 * WBE Staff's home inside /wbe-fresh: view the final price list (read-only
 * — staff cannot edit prices, only Admin/Supplier can), create customers,
 * and create/track quotations for WBE-Fresh customers.
 */
export default function StaffDashboard() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<'prices' | 'quotations'>('prices');
  const [veggies, setVeggies] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerOpen, setCustomerOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchVeggies();
    // Keep the price list current — staff shouldn't quote off a stale
    // (pre-"Go Live") price they happened to load earlier.
    const interval = setInterval(() => fetchVeggies(false), 30_000);
    const channel = supabase
      .channel('staff-prices-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wbefresh_vegetables' }, () => fetchVeggies(false))
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  async function fetchVeggies(showSpinner = true) {
    if (showSpinner) setLoading(true);
    const { data } = await supabase.from('wbefresh_vegetables').select('*').eq('is_approved', true).eq('is_active', true).order('name_en');
    setVeggies((data as Vegetable[]) ?? []);
    if (showSpinner) setLoading(false);
  }

  const visible = veggies.filter(v =>
    !search.trim() || [v.name_en, v.name_ta, v.name_ml].some(n => n?.toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">WBE Fresh — Staff</h1>
              <p className="text-[11px] text-gray-400 leading-tight">{user?.name}</p>
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
            <button onClick={() => setTab('prices')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'prices' ? 'border-teal-500 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Price List</button>
            <button onClick={() => setTab('quotations')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'quotations' ? 'border-teal-500 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Quotations</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCustomerOpen(true)} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <UsersIcon size={15} /> New Customer
            </button>
            <button onClick={() => setQuoteOpen(true)} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
              <FileText size={15} /> New Quotation
            </button>
          </div>
        </div>

        {tab === 'prices' ? (
          <>
            <div className="relative max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vegetables..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {visible.map(v => (
                  <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
                    <div className="h-24 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {v.image_url ? <img src={v.image_url} alt={v.name_en} className="w-full h-full object-cover" /> : <ImageIcon size={26} className="text-gray-300" />}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{v.name_en}</p>
                      <p className="text-xs text-gray-500 truncate">{v.name_ta}{v.name_ta && v.name_ml ? ' / ' : ''}{v.name_ml}</p>
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
            )}
          </>
        ) : (
          <QuotationsList viewer="staff" refreshKey={refreshKey} />
        )}
      </main>

      <CustomerModal open={customerOpen} onClose={() => setCustomerOpen(false)} onCreated={() => {}} />
      <QuotationModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        mode="staff"
        onCreated={() => { setRefreshKey(k => k + 1); setTab('quotations'); }}
      />
    </div>
  );
}
