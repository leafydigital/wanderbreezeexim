import { useEffect, useRef, useState } from 'react';
import { Sprout, LogIn, Clock } from 'lucide-react';
import { supabase } from '../crm/lib/supabase';
import { formatDateTime } from '../crm/lib/wbeFormat';
import PriceTrend from '../crm/components/PriceTrend';

interface Veg {
  id: string;
  name_en: string;
  name_ml: string;
  unit: string;
  image_url: string;
  live_final_price: number | null;
  previous_live_price: number | null;
}

// How often to re-poll for a fresh price list, so a customer sitting on this
// page picks up the admin's next "Go Live" without reloading.
const AUTO_REFRESH_MS = 30_000;

export default function PublicPrices() {
  const [veggies, setVeggies] = useState<Veg[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceUpdatedAt, setPriceUpdatedAt] = useState<string | null>(null);
  const [validTill, setValidTill] = useState<string | null>(null);
  const priceUpdatedAtRef = useRef<string | null>(null);

  useEffect(() => {
    load(true);

    // Poll on an interval — guaranteed to pick up a new "Go Live" even if
    // Realtime isn't enabled for this table.
    const interval = setInterval(() => load(false), AUTO_REFRESH_MS);

    // Also listen for live updates on `settings` (Go Live stamps
    // price_updated_at there), so a customer on this page sees the new
    // prices the moment the admin publishes, not just on the next poll.
    const channel = supabase
      .channel('public-prices-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => load(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wbefresh_vegetables' }, () => load(false))
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  async function load(showSpinner: boolean) {
    if (showSpinner) setLoading(true);
    const [vegRes, settingsRes] = await Promise.all([
      supabase.from('wbefresh_vegetables')
        .select('id, name_en, name_ml, unit, image_url, live_final_price, previous_live_price')
        .eq('is_approved', true)
        .eq('is_active', true)
        .order('name_en'),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    // Public price list hides ₹0 (not-yet-priced) or not-yet-published
    // vegetables — those still show on the Admin/Supplier screens.
    setVeggies(((vegRes.data as Veg[]) ?? []).filter(v => (v.live_final_price ?? 0) > 0));
    setPriceUpdatedAt(settingsRes.data?.price_updated_at ?? null);
    setValidTill(settingsRes.data?.valid_till ?? null);
    priceUpdatedAtRef.current = settingsRes.data?.price_updated_at ?? null;
    if (showSpinner) setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">WBE Fresh</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Domestic Vegetable Prices</p>
            </div>
          </div>
          <a
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-lg transition-colors"
          >
            <LogIn size={14} /> Login
          </a>
        </div>
      </header>

      {/* Price banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-6 text-sm">
          <span className="flex items-center gap-1.5">
            <Clock size={14} /> Price updated at <strong>{priceUpdatedAt ? formatDateTime(priceUpdatedAt) : '—'}</strong>
          </span>
          <span className="flex items-center gap-1.5 opacity-90">
            Price valid till <strong>{validTill ? formatDateTime(validTill) : '—'}</strong>
          </span>
        </div>
      </div>

      {/* Price grid */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : veggies.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No vegetables listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {veggies.map(v => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="h-24 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.name_en} className="w-full h-full object-cover" />
                  ) : (
                    <Sprout size={26} className="text-gray-300" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">{v.name_en}</p>
                  {v.name_ml && <p className="text-xs text-gray-500 truncate">{v.name_ml}</p>}
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-lg font-bold text-teal-700">₹{v.live_final_price}</span>
                    <span className="text-xs text-gray-400">/{v.unit}</span>
                  </div>
                  <PriceTrend current={v.live_final_price ?? 0} previous={v.previous_live_price} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Wander Breeze Exim — WBE Fresh Produce
      </footer>
    </div>
  );
}
