/**
 * Dashboard.tsx — WBE Intelligence Dashboard
 * All AI calls go through the market-intel Supabase edge function (server-side).
 * No direct browser→Anthropic calls (CORS-blocked).
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, ArrowRight,
  Globe, RefreshCw, AlertCircle, Users, FileText,
  Zap, Package, Target, Phone, Mail, Loader2,
  ChevronDown, ChevronUp, WifiOff,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, currentMonthRange } from '../lib/utils';

// ── Types ──────────────────────────────────────────────────────
interface DashboardProps { onNavigate: (page: string) => void; }

interface BizStats {
  totalCustomers: number;
  totalPIs: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

interface ProductPrice {
  name: string; grade: string; priceInr: string; priceUsd: string;
  trend: 'up' | 'down' | 'stable'; trendPct: string; source: string; hsCode: string;
}
interface DemandEntry {
  product: string; country: string; flag: string; demandPct: number;
  volumeMT: string; topImporter: string; notes: string; blVerified: boolean;
}
interface DomesticOpp {
  product: string; market: string; avgRate: string;
  demand: 'High' | 'Medium' | 'Low'; season: string; notes: string; action: string;
}
interface Importer {
  company: string; country: string; countryCode: string; product: string;
  email: string; phone: string; verifiedBL: boolean; lastShipment: string; volumeMT: string;
}
interface IntelData {
  briefing: string; prices: ProductPrice[]; demand: DemandEntry[];
  domestic: DomesticOpp[]; importers: Importer[]; generated_at: string; cached?: boolean;
}
interface SmartAction {
  type: string; title: string; count: number; detail: string;
  action: string; page: string; urgent: boolean; color: string;
}

// ── Constants ──────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const INTEL_URL     = `${SUPABASE_URL}/functions/v1/market-intel`;
const CACHE_KEY     = 'wbe_intel_v2';
const CACHE_TTL     = 12 * 60 * 60 * 1000; // 12 hours

const OUR_PRODUCTS = [
  { name: 'Black Pepper',   grade: 'MG1/TGSEB',    hsCode: '0904.11', emoji: '⚫' },
  { name: 'Green Cardamom', grade: '6-8mm Bold',   hsCode: '0908.31', emoji: '🌿' },
  { name: 'Fresh Coconut',  grade: 'Semi-husked',  hsCode: '0801.11', emoji: '🥥' },
  { name: 'Onion',          grade: 'Export grade', hsCode: '0703.10', emoji: '🧅' },
  { name: 'Green Chilli',   grade: 'A-grade',      hsCode: '0709.60', emoji: '🌶' },
  { name: 'G9 Banana',      grade: 'Premium',      hsCode: '0803.90', emoji: '🍌' },
  { name: 'Moringa',        grade: 'Dried leaf',   hsCode: '0712.90', emoji: '🌱' },
  { name: 'Pomegranate',    grade: 'Export grade', hsCode: '0810.10', emoji: '🔴' },
];

// ISO code → flag emoji
function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

// ── Edge function helpers ──────────────────────────────────────
const edgeHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SUPABASE_KEY}`,
};

async function fetchCachedIntel(): Promise<IntelData | null> {
  const res = await fetch(INTEL_URL, { method: 'GET', headers: edgeHeaders });
  if (!res.ok) return null;
  return res.json();
}

async function generateFreshIntel(): Promise<IntelData> {
  const res = await fetch(INTEL_URL, { method: 'POST', headers: edgeHeaders, body: '{}' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── localStorage cache ─────────────────────────────────────────
function readCache(): IntelData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}
function writeCache(data: IntelData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

// ── Skeleton loader ────────────────────────────────────────────
function Skeleton({ rows = 3, height = 60 }: { rows?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height, borderRadius: 8,
          background: 'linear-gradient(90deg,#f3f4f6 25%,#e9eaec 50%,#f3f4f6 75%)',
          backgroundSize: '400% 100%', animation: 'wbe-shimmer 1.4s ease infinite',
        }} />
      ))}
    </div>
  );
}

// ── Trend badge ────────────────────────────────────────────────
function TrendBadge({ trend, pct }: { trend: string; pct: string }) {
  const up   = trend === 'up';
  const down = trend === 'down';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20,
      color:      up ? '#059669' : down ? '#DC2626' : '#6B7280',
      background: up ? '#ECFDF5' : down ? '#FEF2F2' : '#F3F4F6',
    }}>
      {up ? '↑' : down ? '↓' : '–'} {pct}
    </span>
  );
}

// ── Demand progress bar ────────────────────────────────────────
function DemandBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#059669' : pct >= 55 ? '#D97706' : '#6B7280';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 34, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

// ── Section card wrapper ───────────────────────────────────────
function SectionCard({
  emoji, title, subtitle, expanded, onToggle, onRefresh, refreshing, children,
}: {
  emoji: string; title: string; subtitle: string;
  expanded: boolean; onToggle: () => void;
  onRefresh?: () => void; refreshing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 18px', borderBottom: expanded ? '1px solid #F3F4F6' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={onToggle}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{emoji} {title}</h2>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onRefresh && (
            <button onClick={e => { e.stopPropagation(); onRefresh(); }}
              style={{ fontSize: 11, color: '#6B7280', background: 'none', border: '1px solid #e5e7eb',
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={11} style={{ animation: refreshing ? 'wbe-spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          )}
          {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
        </div>
      </div>
      {expanded && <div style={{ padding: '14px 18px' }}>{children}</div>}
    </div>
  );
}

// ── Empty / error state ────────────────────────────────────────
function EmptyState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) return <Skeleton rows={3} />;
  return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF' }}>
      <WifiOff size={28} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
      <p style={{ fontSize: 13, margin: '0 0 10px' }}>{error ?? 'No data available'}</p>
      <button onClick={onRetry}
        style={{ fontSize: 12, fontWeight: 600, color: '#0F9B6E', background: '#F0FDF4',
          border: 'none', borderRadius: 6, padding: '5px 14px', cursor: 'pointer' }}>
        Retry
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export default function Dashboard({ onNavigate }: DashboardProps) {
  const [bizStats, setBizStats]   = useState<BizStats | null>(null);
  const [intel, setIntel]         = useState<IntelData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [actions, setActions]     = useState<SmartAction[]>([]);
  const [open, setOpen]           = useState({ prices: true, demand: true, domestic: true, importers: true });
  const booted = useRef(false);

  const toggle = (k: keyof typeof open) => setOpen(o => ({ ...o, [k]: !o[k] }));

  // ── Biz stats ─────────────────────────────────────────────────
  const loadBiz = useCallback(async () => {
    const { start, end } = currentMonthRange();
    const [c, p, inv, exp] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact', head: true }),
      supabase.from('proforma_invoices').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('total').gte('issue_date', start).lte('issue_date', end).eq('status', 'Paid'),
      supabase.from('expenses').select('amount').gte('expense_date', start).lte('expense_date', end),
    ]);
    setBizStats({
      totalCustomers: c.count ?? 0, totalPIs: p.count ?? 0,
      monthlyIncome: (inv.data ?? []).reduce((s, r) => s + Number(r.total), 0),
      monthlyExpenses: (exp.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
    });
  }, []);

  // ── Smart actions ─────────────────────────────────────────────
  const loadActions = useCallback(async () => {
    const cutoff = new Date(Date.now() - 5 * 86400000).toISOString();
    const [fu, bo, op] = await Promise.all([
      supabase.from('sc_outreach_queue').select('id', { count: 'exact', head: true }).eq('status', 'sent').lte('sent_at', cutoff),
      supabase.from('sc_outreach_queue').select('id', { count: 'exact', head: true }).eq('status', 'bounced'),
      supabase.from('sc_outreach_queue').select('id', { count: 'exact', head: true }).eq('status', 'opened'),
    ]);
    const list: SmartAction[] = [];
    if ((fu.count ?? 0) > 0) list.push({ type: 'followup', title: 'Follow-ups due', count: fu.count!, detail: `${fu.count} leads sent 5+ days ago — no reply yet`, action: 'Send follow-up', page: 'outreachtracker', urgent: (fu.count ?? 0) > 10, color: '#F59E0B' });
    if ((bo.count ?? 0) > 0) list.push({ type: 'bounce', title: 'Bounced emails', count: bo.count!, detail: `${bo.count} bounced — remove invalid addresses now`, action: 'View bounces', page: 'outreachtracker', urgent: true, color: '#EF4444' });
    if ((op.count ?? 0) > 0) list.push({ type: 'opened', title: 'Opened, no reply', count: op.count!, detail: `${op.count} leads opened your email — hot prospects`, action: 'Reach out now', page: 'outreachtracker', urgent: false, color: '#10B981' });
    list.push({ type: 'rcmc', title: 'RCMC Registration', count: 1, detail: 'Spices Board RCMC pending — required before any spice export shipment', action: 'Check status', page: 'documents', urgent: true, color: '#EF4444' });
    setActions(list);
  }, []);

  // ── Intel load: try cache → try DB → generate fresh ──────────
  const loadIntel = useCallback(async (forceRefresh = false) => {
    // 1. Try localStorage cache (if not forcing)
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) { setIntel(cached); return; }
    }

    setLoading(true);
    setError(null);

    try {
      // 2. Try DB cache via GET
      if (!forceRefresh) {
        const dbData = await fetchCachedIntel();
        if (dbData && dbData.briefing) {
          setIntel(dbData);
          writeCache(dbData);
          setLoading(false);
          return;
        }
      }

      // 3. Generate fresh via POST (calls Claude server-side)
      const fresh = await generateFreshIntel();
      if (fresh.error) throw new Error(fresh.error as string);
      setIntel(fresh);
      writeCache(fresh);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load intelligence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    loadBiz();
    loadActions();
    loadIntel();
    const vis = () => { if (document.visibilityState === 'visible') { loadBiz(); loadActions(); } };
    document.addEventListener('visibilitychange', vis);
    return () => document.removeEventListener('visibilitychange', vis);
  }, [loadBiz, loadActions, loadIntel]);

  const profit = (bizStats?.monthlyIncome ?? 0) - (bizStats?.monthlyExpenses ?? 0);
  const hasIntel = !!intel && !error;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @keyframes wbe-shimmer { 0%{background-position:400% 0} 100%{background-position:-400% 0} }
        @keyframes wbe-spin    { to{transform:rotate(360deg)} }
        @keyframes wbe-fade    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .wbe-action:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .wbe-metric:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
        .wbe-row:hover    { background: #FAFAFA !important; }
      `}</style>

      {/* ── Intelligence briefing ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#0d4a38 100%)',
        borderRadius: 14, padding: '20px 24px', marginBottom: 20, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, background: 'rgba(20,184,166,0.1)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Zap size={14} color="#14B8A6" />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#14B8A6', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Intelligence Briefing — {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
          </span>
          {intel?.generated_at && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#475569' }}>
              {intel.cached ? '📦 Cached' : '✨ Fresh'} · {new Date(intel.generated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {loading && !intel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94A3B8', fontSize: 13 }}>
            <Loader2 size={15} style={{ animation: 'wbe-spin 1s linear infinite' }} />
            Fetching today's market intelligence...
          </div>
        ) : error && !intel ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</span>
            <button onClick={() => loadIntel(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none',
              color: '#CBD5E1', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>Retry</button>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: '#E2E8F0', margin: 0, lineHeight: 1.7 }}>
            {intel?.briefing ?? '—'}
          </p>
        )}
      </div>

      {/* ── Smart actions ── */}
      {actions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px' }}>Action Required</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
            {actions.map((a, i) => (
              <div key={i} className="wbe-action" onClick={() => onNavigate(a.page)}
                style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                  border: '1px solid #F3F4F6', borderLeft: `3px solid ${a.color}`,
                  transition: 'all 0.15s ease', animation: 'wbe-fade 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{a.title}</span>
                  {a.urgent && <span style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', background: '#FEF2F2', padding: '1px 7px', borderRadius: 20 }}>URGENT</span>}
                </div>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 8px', lineHeight: 1.4 }}>{a.detail}</p>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0F9B6E', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {a.action} <ArrowRight size={10} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Business metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Customers',        val: bizStats?.totalCustomers ?? '—',                   icon: Users,        c: '#3B82F6', bg: '#EFF6FF', page: 'customers' },
          { label: 'Proforma Invoices',val: bizStats?.totalPIs ?? '—',                         icon: FileText,     c: '#0891B2', bg: '#ECFEFF', page: 'proforma'  },
          { label: 'Monthly Revenue',  val: bizStats ? formatCurrency(bizStats.monthlyIncome) : '—', icon: TrendingUp,  c: '#059669', bg: '#ECFDF5', page: 'invoices'  },
          { label: 'Monthly Expenses', val: bizStats ? formatCurrency(bizStats.monthlyExpenses) : '—', icon: TrendingDown, c: '#DC2626', bg: '#FEF2F2', page: 'expenses'  },
          { label: 'Net Profit',       val: bizStats ? formatCurrency(profit) : '—',           icon: DollarSign,   c: profit >= 0 ? '#059669' : '#DC2626', bg: profit >= 0 ? '#ECFDF5' : '#FEF2F2', page: 'invoices' },
        ].map(({ label, val, icon: Icon, c, bg, page }) => (
          <button key={label} className="wbe-metric" onClick={() => onNavigate(page)}
            style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 10,
              padding: 14, textAlign: 'left', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
            <div style={{ width: 30, height: 30, background: bg, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Icon size={15} color={c} />
            </div>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{val}</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{label}</p>
          </button>
        ))}
      </div>

      {/* ── Live Market Prices ── */}
      <SectionCard emoji="📊" title="Live Market Prices"
        subtitle="Indian mandi wholesale prices — updated every 12 hours"
        expanded={open.prices} onToggle={() => toggle('prices')}
        onRefresh={() => loadIntel(true)} refreshing={loading}>
        {!hasIntel ? <EmptyState loading={loading} error={error} onRetry={() => loadIntel(true)} /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 10 }}>
            {intel.prices.map((p, i) => {
              const prod = OUR_PRODUCTS.find(x => x.name === p.name);
              return (
                <div key={i} style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                      {prod?.emoji ?? '📦'} {p.name}
                    </span>
                    <TrendBadge trend={p.trend} pct={p.trendPct} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>₹{p.priceInr}</span>
                    <span style={{ fontSize: 12, color: '#6B7280' }}>${p.priceUsd}/kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF' }}>
                    <span>{p.grade}</span><span>HS {p.hsCode}</span>
                  </div>
                  <p style={{ fontSize: 10, color: '#14B8A6', fontWeight: 700, margin: '6px 0 0' }}>📍 {p.source}</p>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── Overseas Demand ── */}
      <SectionCard emoji="🌍" title="Overseas Demand Intelligence"
        subtitle="Daily demand analysis with BL data — which products to push to which countries today"
        expanded={open.demand} onToggle={() => toggle('demand')}>
        {!hasIntel ? <EmptyState loading={loading} error={error} onRetry={() => loadIntel(true)} /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Product', 'Market', 'Demand %', 'Est. Volume', 'Top Importer', 'Insight', 'BL'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                      color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.4px',
                      borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {intel.demand.map((d, i) => {
                  const prod = OUR_PRODUCTS.find(p => p.name === d.product);
                  const flag = d.flag?.length === 2 ? flagEmoji(d.flag) : d.flag;
                  return (
                    <tr key={i} className="wbe-row" style={{ borderBottom: '1px solid #F9FAFB', transition: 'background 0.1s' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                        {prod?.emoji ?? '📦'} {d.product}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 16, marginRight: 4 }}>{flag}</span>
                        <span style={{ color: '#374151' }}>{d.country}</span>
                      </td>
                      <td style={{ padding: '10px 12px', minWidth: 130 }}><DemandBar pct={d.demandPct} /></td>
                      <td style={{ padding: '10px 12px', color: '#374151', whiteSpace: 'nowrap' }}>{d.volumeMT}</td>
                      <td style={{ padding: '10px 12px', color: '#374151', fontSize: 12 }}>{d.topImporter}</td>
                      <td style={{ padding: '10px 12px', color: '#6B7280', fontSize: 12, maxWidth: 200 }}>{d.notes}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {d.blVerified
                          ? <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 20 }}>✓ Verified</span>
                          : <span style={{ fontSize: 10, color: '#9CA3AF', background: '#F3F4F6', padding: '2px 8px', borderRadius: 20 }}>Unverified</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Two-column: Domestic + Importers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16, marginBottom: 16 }}>

        {/* Domestic Opportunities */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: open.domestic ? '1px solid #F3F4F6' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => toggle('domestic')}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>🏪 Domestic Trading Opportunities</h2>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>Kerala & Tamil Nadu — B2B targets</p>
            </div>
            {open.domestic ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
          </div>
          {open.domestic && (
            <div>
              {!hasIntel ? <div style={{ padding: '14px 16px' }}><EmptyState loading={loading} error={error} onRetry={() => loadIntel(true)} /></div> : (
                intel.domestic.map((d, i) => {
                  const demColor = d.demand === 'High' ? '#059669' : d.demand === 'Medium' ? '#D97706' : '#6B7280';
                  const demBg    = d.demand === 'High' ? '#ECFDF5' : d.demand === 'Medium' ? '#FEF3C7' : '#F3F4F6';
                  const prod = OUR_PRODUCTS.find(p => p.name === d.product);
                  return (
                    <div key={i} style={{ padding: '12px 16px', borderBottom: i < intel.domestic.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                          {prod?.emoji ?? '📦'} {d.product}
                          <span style={{ fontWeight: 400, color: '#6B7280', fontSize: 12 }}> → {d.market}</span>
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: demColor, background: demBg,
                          padding: '2px 8px', borderRadius: 20, marginLeft: 8, whiteSpace: 'nowrap' }}>
                          {d.demand}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>₹{d.avgRate}/kg</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>🌿 {d.season}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px', lineHeight: 1.4 }}>{d.notes}</p>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#14B8A6', margin: 0 }}>→ {d.action}</p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Verified Importers */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: open.importers ? '1px solid #F3F4F6' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            onClick={() => toggle('importers')}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>🤝 Try These Importers Today</h2>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>AI-selected verified buyers — refreshed daily</p>
            </div>
            {open.importers ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
          </div>
          {open.importers && (
            <div>
              {!hasIntel ? <div style={{ padding: '14px 16px' }}><EmptyState loading={loading} error={error} onRetry={() => loadIntel(true)} /></div> : (
                intel.importers.map((imp, i) => {
                  const prod = OUR_PRODUCTS.find(p => p.name === imp.product);
                  const flag = imp.countryCode?.length === 2 ? flagEmoji(imp.countryCode) : '🌐';
                  return (
                    <div key={i} className="wbe-row" style={{ padding: '12px 16px',
                      borderBottom: i < intel.importers.length - 1 ? '1px solid #F9FAFB' : 'none',
                      transition: 'background 0.1s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 14 }}>{flag}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{imp.company}</span>
                        {imp.verifiedBL && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: 20 }}>✓ BL</span>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9CA3AF' }}>{imp.country}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{prod?.emoji ?? '📦'} {imp.product}</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>{imp.volumeMT}</span>
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>📦 {imp.lastShipment}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
                        {imp.email && (
                          <a href={`mailto:${imp.email}`}
                            style={{ fontSize: 11, color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                            <Mail size={10} /> {imp.email}
                          </a>
                        )}
                        {imp.phone && (
                          <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Phone size={10} /> {imp.phone}
                          </span>
                        )}
                      </div>
                      <button onClick={() => onNavigate('leadradar')}
                        style={{ fontSize: 11, fontWeight: 700, color: '#0F9B6E', background: '#F0FDF4',
                          border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                        Add to LeadRadar →
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', padding: '10px 0 4px', borderTop: '1px solid #F3F4F6', marginTop: 4 }}>
        <p style={{ fontSize: 11, color: '#D1D5DB', margin: 0 }}>
          Intelligence via Claude AI (server-side) · Prices: APMC/Mandi data · BL data: Volza/Zauba
          {intel?.generated_at ? ` · ${new Date(intel.generated_at).toLocaleString('en-IN')}` : ''}
        </p>
      </div>
    </div>
  );
}
