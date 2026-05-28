/**
 * SearchPage.tsx — LeadRadar v2
 * Improvements:
 *  - Outreach / CRM tabs hidden (focus on lead gen only for now)
 *  - Enrichment batch size increased to 5 (faster)
 *  - Results shown progressively as enrichment completes (no more waiting)
 *  - Email column shows all found emails with copy button
 *  - Better empty/loading states
 *  - "Has Email" / "Has Website" quick filters
 *  - Limit selector (20 / 50 / 100 / All)
 */

import { useState, useRef, useCallback } from 'react';
import {
  Search, Building2, Globe, Mail, Phone,
  Linkedin, Facebook, Instagram, Twitter,
  Bookmark, BookmarkCheck, Download, Copy, Check,
  ChevronDown, Loader2, RefreshCw, Filter,
  MapPin, Tag, Star, ExternalLink,
} from 'lucide-react';
import { useSearch, useLeads } from './useLeadRadar';
import { enrichBatch } from './searchService';
import { scrapeWebsite } from './emailScraper';
import { exportCSV, exportExcel } from './exportUtils';
import type { Lead, SearchMode } from './types';

// ── Source badge ───────────────────────────────────────────────
function SourceBadge({ src }: { src: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    google: { label: 'Maps',   bg: '#E8F5E9', color: '#2E7D32' },
    web:    { label: 'Web',    bg: '#E3F2FD', color: '#1565C0' },
    ai:     { label: 'AI',     bg: '#EDE7F6', color: '#4527A0' },
  };
  const s = map[src] || { label: src, bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 600, letterSpacing: '0.3px',
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

// ── Copy-to-clipboard button ─────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copy"
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        borderRadius: 4, color: copied ? '#16A34A' : '#9CA3AF', lineHeight: 0,
        transition: 'color .2s', flexShrink: 0,
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

// ── Social icons row ──────────────────────────────────────────
function SocialIcons({ lead }: { lead: Lead }) {
  const icons = [
    { url: lead.linkedin,  Icon: Linkedin,  color: '#0A66C2', label: 'LinkedIn'  },
    { url: lead.facebook,  Icon: Facebook,  color: '#1877F2', label: 'Facebook'  },
    { url: lead.instagram, Icon: Instagram, color: '#E1306C', label: 'Instagram' },
    { url: lead.twitter,   Icon: Twitter,   color: '#1DA1F2', label: 'Twitter/X' },
  ];
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {icons.map(({ url, Icon, color, label }) =>
        url ? (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer" title={label}
            style={{ color, lineHeight: 0 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Icon size={14} />
          </a>
        ) : (
          <span key={label} title={`${label} — not found`}
            style={{ color: '#E5E7EB', lineHeight: 0 }}>
            <Icon size={14} />
          </span>
        )
      )}
    </div>
  );
}

// ── Location autocomplete ─────────────────────────────────────
function LocationAutocomplete({ value, onChange, style, placeholder }: {
  value: string; onChange: (v: string) => void;
  style?: React.CSSProperties; placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<{ label: string; type: string }[]>([]);
  const [show, setShow] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetch_(q: string) {
    if (q.length < 2) { setSuggestions([]); return; }
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=10&addressdetails=1&featuretype=country,city,state`, { headers: { 'Accept-Language': 'en' } });
      const data: any[] = await res.json();
      const seen = new Set<string>();
      const results = data
        .filter(item => {
          const t = item.type || ''; const addr = item.address || {};
          return ['country','city','town','municipality','administrative','state'].includes(t) && (addr.country || t === 'country');
        })
        .map(item => {
          const addr = item.address || {}; const type = item.type || '';
          let name: string; let badge: string;
          if (type === 'country' || !addr.country) { name = addr.country || item.display_name.split(',')[0].trim(); badge = 'Country'; }
          else if (addr.state && !addr.city) { name = `${addr.state}, ${addr.country}`; badge = 'State'; }
          else { name = `${addr.city || addr.town || item.display_name.split(',')[0].trim()}, ${addr.country}`; badge = 'City'; }
          return { label: name, type: badge };
        })
        .filter(r => { if (!r.label || seen.has(r.label)) return false; seen.add(r.label); return true; })
        .slice(0, 6);
      setSuggestions(results); setShow(results.length > 0);
    } catch { setSuggestions([]); }
  }

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <Globe size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', zIndex: 1 }} />
      <input style={{ ...style, paddingLeft: 36 }} placeholder={placeholder} value={value}
        onChange={e => { onChange(e.target.value); if (debRef.current) clearTimeout(debRef.current); debRef.current = setTimeout(() => fetch_(e.target.value), 350); }}
        onFocus={() => { if (suggestions.length) setShow(true); }}
        onBlur={() => setTimeout(() => setShow(false), 150)}
        autoComplete="off" />
      {show && suggestions.length > 0 && (
        <div style={{ position: 'fixed', top: 'auto', left: 'auto', zIndex: 99999, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,.18)', marginTop: 4, overflow: 'hidden', minWidth: 280, maxWidth: 420 }}>
          {suggestions.map((s, i) => (
            <div key={i} onMouseDown={() => { onChange(s.label); setSuggestions([]); setShow(false); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: i < suggestions.length - 1 ? '1px solid #f9fafb' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              <span style={{ color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={12} style={{ color: '#9CA3AF' }} />{s.label}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: s.type === 'Country' ? '#f0fdf4' : s.type === 'State' ? '#f3f4f6' : '#EFF6FF', color: s.type === 'Country' ? '#15803D' : s.type === 'State' ? '#6B7280' : '#2563EB' }}>{s.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Progress dots ─────────────────────────────────────────────
function SearchProgress({ progress }: { progress: Record<string, string> }) {
  const sources = [
    { key: 'google', label: 'Google Maps' },
    { key: 'web',    label: 'Web Search'  },
    { key: 'claude', label: 'AI Search'   },
  ].filter(s => s.key in progress);
  if (!sources.length) return null;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>Fetching:</span>
      {sources.map(({ key, label }) => {
        const state = progress[key];
        return (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: state === 'done' ? '#22C55E' : state === 'loading' ? '#F59E0B' : '#ddd', animation: state === 'loading' ? 'pulse 1s infinite' : 'none' }} />
            <span style={{ color: state === 'done' ? '#22C55E' : state === 'loading' ? '#F59E0B' : '#aaa' }}>{label}</span>
          </span>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { results, loading, progress, search, setResults } = useSearch();
  const { saveLead, saveMany } = useLeads();

  const [query,          setQuery]          = useState('');
  const [location,       setLocation]       = useState('');
  const [limit,          setLimit]          = useState(50);
  const [mode,           setMode]           = useState<SearchMode>('leads');
  const [saved,          setSaved]          = useState<Set<string>>(new Set());
  const [selected,       setSelected]       = useState<Set<number>>(new Set());
  const [expandedRow,    setExpandedRow]    = useState<number | null>(null);
  // Filter states — null = show all, true = has it, false = no it
  const [filterEmail,    setFilterEmail]    = useState<boolean | null>(null);
  const [filterWebsite,  setFilterWebsite]  = useState<boolean | null>(null);
  const [globalSearch,   setGlobalSearch]   = useState('');
  const [sortDir,        setSortDir]        = useState<'asc' | 'desc' | null>(null);
  const [rowsPerPage,    setRowsPerPage]    = useState(25);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [isEnriching,    setIsEnriching]    = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [enrichedCount,  setEnrichedCount]  = useState(0);
  const [totalCount,     setTotalCount]     = useState(0);
  const [searchDone,     setSearchDone]     = useState(false);

  const BATCH_SIZE = 3; // 3 per call — edge fn processes these concurrently

  // ── Search + auto-enrich ──────────────────────────────────────
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !location.trim()) return;
    setSelected(new Set()); setSaved(new Set()); setExpandedRow(null);
    setResults([]); setIsEnriching(false); setEnrichProgress(0); setCurrentPage(1); setGlobalSearch(''); setSortDir(null);
    setEnrichedCount(0); setTotalCount(0); setSearchDone(false);

    const leads = await search({ query: query.trim(), location: location.trim(), limit, mode, useOSM: false, useGoogle: true, useClaude: true });
    setSearchDone(true);

    if (leads?.length) {
      setTotalCount(leads.length);
      await autoEnrich(leads, location.trim());
    }
  }

  // ── Progressive enrichment ───────────────────────────────────
  // TWO parallel tracks:
  // Track A — client-side email scraping (user's residential IP, bypasses Wix/blocks)
  // Track B — edge function for social links (LinkedIn, Facebook, Instagram, Twitter)
  async function autoEnrich(leads: Lead[], loc: string) {
    setIsEnriching(true);
    setEnrichProgress(0);
    setEnrichedCount(0);

    // Show raw results immediately
    setResults([...leads]);
    const enriched = [...leads];

    // Client-side scraping for BOTH email + socials
    // Runs from user's browser (residential IP) — bypasses all blocks
    // BATCH_SIZE leads processed concurrently per round
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (lead: Lead, j: number) => {
        const idx = i + j;
        if (!lead.website) return;

        try {
          const result = await scrapeWebsite(lead.website);
          enriched[idx] = {
            ...enriched[idx],
            email:     result.emails[0]  || enriched[idx].email     || null,
            linkedin:  result.linkedin   || enriched[idx].linkedin  || null,
            facebook:  result.facebook   || enriched[idx].facebook  || null,
            instagram: result.instagram  || enriched[idx].instagram || null,
            twitter:   result.twitter    || enriched[idx].twitter   || null,
          };
        } catch { /* silent */ }
      }));

      setResults([...enriched]);
      const done = Math.min(i + BATCH_SIZE, leads.length);
      setEnrichedCount(done);
      setEnrichProgress(Math.round((done / leads.length) * 100));
    }

    setIsEnriching(false);
    setEnrichProgress(100);
  }

  // ── Save handlers ─────────────────────────────────────────────
  async function handleSave(lead: Lead, idx: number) {
    const err = await saveLead(lead);
    if (!err) setSaved(s => new Set(s).add(String(idx)));
  }

  async function handleSaveSelected() {
    const toSave = displayResults.filter((_, i) => selected.has(i));
    await saveMany(toSave);
    setSaved(s => { const n = new Set(s); selected.forEach(i => n.add(String(i))); return n; });
    setSelected(new Set());
  }

  function toggleSelect(i: number) {
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  function toggleSelectAll() {
    setSelected(s => s.size === displayResults.length ? new Set() : new Set(displayResults.map((_, i) => i)));
  }

  // ── Filters + Search + Sort + Pagination ─────────────────────
  const filteredResults = results.filter(r => {
    if (filterEmail   === true  && !r.email)   return false;
    if (filterEmail   === false &&  r.email)   return false;
    if (filterWebsite === true  && !r.website) return false;
    if (filterWebsite === false &&  r.website) return false;
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase();
      return (
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedResults = sortDir
    ? [...filteredResults].sort((a, b) => {
        const an = (a.name || '').toLowerCase();
        const bn = (b.name || '').toLowerCase();
        return sortDir === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
      })
    : filteredResults;

  const totalPages    = Math.max(1, Math.ceil(sortedResults.length / rowsPerPage));
  const safePage      = Math.min(currentPage, totalPages);
  const pageStart     = (safePage - 1) * rowsPerPage;
  const displayResults = sortedResults.slice(pageStart, pageStart + rowsPerPage);

  const emailCount   = results.filter(r => r.email).length;
  const noEmailCount = results.filter(r => !r.email).length;
  const websiteCount = results.filter(r => r.website).length;
  const noWebsiteCount = results.filter(r => !r.website).length;
  const isSupplier   = mode === 'suppliers';

  // ── Styles ────────────────────────────────────────────────────
  const S = {
    page:  { fontFamily: "'DM Sans','Inter',sans-serif", color: '#1a1a1a' } as React.CSSProperties,
    card:  { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' } as React.CSSProperties,
    input: { border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', width: '100%', background: '#fff', boxSizing: 'border-box' as const } as React.CSSProperties,
    th:    { padding: '9px 12px', fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase' as const, textAlign: 'left' as const, borderBottom: '1px solid #f3f4f6', background: '#fafafa', whiteSpace: 'nowrap' as const } as React.CSSProperties,
    td:    { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #f9fafb', verticalAlign: 'middle' as const } as React.CSSProperties,
    btn:   { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none' } as React.CSSProperties,
  };

  return (
    <div style={S.page}>

      {/* ── Search form ── */}
      <div style={{ ...S.card, padding: '20px 24px', marginBottom: 16 }}>
        <form onSubmit={handleSearch}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['leads','suppliers'] as SearchMode[]).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                style={{ ...S.btn, background: mode === m ? '#0F9B6E' : '#f3f4f6', color: mode === m ? '#fff' : '#374151', fontWeight: mode === m ? 600 : 400 }}>
                {m === 'leads' ? '🎯 Find Buyers / Leads' : '📦 Find Suppliers'}
              </button>
            ))}
          </div>

          {/* Query + location + limit + search */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                {isSupplier ? 'Product / Category' : 'Business Type'}
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input style={{ ...S.input, paddingLeft: 36 }}
                  placeholder={isSupplier ? 'e.g. Spices Importer, Pepper Wholesaler' : 'e.g. Dentist, Restaurant, IT Company'}
                  value={query} onChange={e => setQuery(e.target.value)} />
              </div>
            </div>

            <div style={{ flex: 1.5, minWidth: 180 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Location</label>
              <LocationAutocomplete value={location} onChange={setLocation} style={S.input} placeholder="Country, City, or Region" />
            </div>

            <div style={{ minWidth: 110 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Results</label>
              <select value={limit} onChange={e => setLimit(Number(e.target.value))}
                style={{ ...S.input, paddingRight: 8, appearance: 'auto', cursor: 'pointer' }}>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={0}>All</option>
              </select>
            </div>

            <button type="submit" disabled={loading || isEnriching}
              style={{ ...S.btn, background: loading || isEnriching ? '#d1fae5' : '#0F9B6E', color: '#fff', padding: '10px 20px', minWidth: 120 }}>
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Searching...</>
                : isEnriching ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enriching...</>
                : <><Search size={14} /> Search</>}
            </button>
          </div>

          {/* Progress */}
          {(loading || isEnriching) && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <SearchProgress progress={progress} />
              {isEnriching && totalCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 6, height: 6, overflow: 'hidden', maxWidth: 240 }}>
                    <div style={{ width: enrichProgress + '%', height: '100%', background: 'linear-gradient(90deg,#0F9B6E,#22C55E)', borderRadius: 6, transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    Fetching emails — {enrichedCount}/{totalCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* ── Results toolbar ── */}
      {results.length > 0 && (
        <div style={{ marginBottom: 10 }}>

          {/* Row 1: Stats + Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
              {results.length} leads found
              {sortedResults.length !== results.length && <span style={{ color: '#6B7280', fontWeight: 400 }}> · {sortedResults.length} filtered</span>}
            </span>
            {isEnriching
              ? <span style={{ fontSize: 12, color: '#F59E0B' }}>⏳ Fetching data ({enrichedCount}/{totalCount})…</span>
              : <span style={{ fontSize: 12, color: '#16A34A' }}>✓ {emailCount} with email · {websiteCount} with website</span>
            }
            <div style={{ flex: 1 }} />
            {selected.size > 0 && (
              <button onClick={handleSaveSelected}
                style={{ ...S.btn, background: '#0F9B6E', color: '#fff', fontSize: 12, padding: '7px 12px' }}>
                <Bookmark size={13} /> Save {selected.size}
              </button>
            )}
            <button onClick={() => exportCSV(sortedResults)}
              style={{ ...S.btn, background: '#f3f4f6', color: '#374151', fontSize: 12, padding: '7px 12px' }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={() => exportExcel(sortedResults)}
              style={{ ...S.btn, background: '#f3f4f6', color: '#374151', fontSize: 12, padding: '7px 12px' }}>
              <Download size={13} /> Excel
            </button>
          </div>

          {/* Row 2: Global search + Sort + Filters + Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>

            {/* Global search */}
            <div style={{ position: 'relative', minWidth: 200, flex: 1, maxWidth: 320 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                value={globalSearch}
                onChange={e => { setGlobalSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, email, phone…"
                style={{ ...S.input, paddingLeft: 30, padding: '7px 10px 7px 30px', fontSize: 12 }}
              />
            </div>

            {/* Sort by name */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Sort:</span>
              {([['asc', 'A→Z'], ['desc', 'Z→A']] as const).map(([dir, label]) => (
                <button key={dir} onClick={() => setSortDir(s => s === dir ? null : dir)}
                  style={{ ...S.btn, padding: '5px 10px', fontSize: 11, borderRadius: 6,
                    background: sortDir === dir ? '#0F9B6E' : '#f3f4f6',
                    color: sortDir === dir ? '#fff' : '#6B7280' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Email filter — 3-state toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>Email:</span>
              <button onClick={() => { setFilterEmail(null); setCurrentPage(1); }}
                style={{ ...S.btn, padding: '4px 9px', fontSize: 11, borderRadius: '6px 0 0 6px',
                  background: filterEmail === null ? '#0F9B6E' : '#f3f4f6',
                  color: filterEmail === null ? '#fff' : '#6B7280' }}>All</button>
              <button onClick={() => { setFilterEmail(true); setCurrentPage(1); }}
                style={{ ...S.btn, padding: '4px 9px', fontSize: 11, borderRadius: 0, borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
                  background: filterEmail === true ? '#16A34A' : '#f3f4f6',
                  color: filterEmail === true ? '#fff' : '#6B7280' }}>✓ Has ({emailCount})</button>
              <button onClick={() => { setFilterEmail(false); setCurrentPage(1); }}
                style={{ ...S.btn, padding: '4px 9px', fontSize: 11, borderRadius: '0 6px 6px 0',
                  background: filterEmail === false ? '#DC2626' : '#f3f4f6',
                  color: filterEmail === false ? '#fff' : '#6B7280' }}>✗ No ({noEmailCount})</button>
            </div>

            {/* Website filter — 3-state toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, color: '#9CA3AF' }}>Website:</span>
              <button onClick={() => { setFilterWebsite(null); setCurrentPage(1); }}
                style={{ ...S.btn, padding: '4px 9px', fontSize: 11, borderRadius: '6px 0 0 6px',
                  background: filterWebsite === null ? '#0F9B6E' : '#f3f4f6',
                  color: filterWebsite === null ? '#fff' : '#6B7280' }}>All</button>
              <button onClick={() => { setFilterWebsite(true); setCurrentPage(1); }}
                style={{ ...S.btn, padding: '4px 9px', fontSize: 11, borderRadius: 0, borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb',
                  background: filterWebsite === true ? '#16A34A' : '#f3f4f6',
                  color: filterWebsite === true ? '#fff' : '#6B7280' }}>✓ Has ({websiteCount})</button>
              <button onClick={() => { setFilterWebsite(false); setCurrentPage(1); }}
                style={{ ...S.btn, padding: '4px 9px', fontSize: 11, borderRadius: '0 6px 6px 0',
                  background: filterWebsite === false ? '#DC2626' : '#f3f4f6',
                  color: filterWebsite === false ? '#fff' : '#6B7280' }}>✗ No ({noWebsiteCount})</button>
            </div>

            {/* Rows per page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Rows:</span>
              <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 8px', fontSize: 12, cursor: 'pointer', outline: 'none' }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Results table ── */}
      {displayResults.length > 0 && (
        <div style={S.card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 36 }} />
                <col style={{ width: '23%' }} />
                <col style={{ width: '19%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: 80 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={S.th}>
                    <input type="checkbox" checked={selected.size === displayResults.length && displayResults.length > 0}
                      onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
                  </th>
                  <th style={S.th}>Company</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>Phone</th>
                  <th style={S.th}>Location</th>
                  {isSupplier
                    ? <th style={S.th}>Products</th>
                    : <th style={S.th}>Category</th>}
                  <th style={S.th}>Socials</th>
                  <th style={S.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayResults.map((lead, idx) => (
                  <>
                    <tr key={idx}
                      onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                      style={{ cursor: 'pointer', background: expandedRow === idx ? '#f9fefb' : selected.has(idx) ? '#f0fdf4' : '#fff', transition: 'background .15s' }}
                      onMouseEnter={e => { if (expandedRow !== idx && !selected.has(idx)) e.currentTarget.style.background = '#fafafa'; }}
                      onMouseLeave={e => { if (expandedRow !== idx && !selected.has(idx)) e.currentTarget.style.background = '#fff'; }}>

                      {/* Checkbox */}
                      <td style={S.td} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(idx)} onChange={() => toggleSelect(idx)} style={{ cursor: 'pointer' }} />
                      </td>

                      {/* Company name */}
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={13} style={{ color: '#0F9B6E' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }} title={lead.name}>
                              {lead.name}
                            </div>
                            {lead.website && (
                              <a href={lead.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                                style={{ fontSize: 11, color: '#0F9B6E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <ExternalLink size={9} />
                                {lead.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={S.td}>
                        {lead.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Mail size={12} style={{ color: '#0F9B6E', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }} title={lead.email}>
                              {lead.email}
                            </span>
                            <CopyBtn text={lead.email} />
                          </div>
                        ) : isEnriching ? (
                          <span style={{ fontSize: 11, color: '#D1D5DB', fontStyle: 'italic' }}>fetching…</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#D1D5DB' }}>—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td style={S.td}>
                        {lead.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={11} style={{ color: '#6B7280', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.phone}</span>
                            <CopyBtn text={lead.phone} />
                          </div>
                        ) : <span style={{ color: '#D1D5DB', fontSize: 11 }}>—</span>}
                      </td>

                      {/* Country/address */}
                      <td style={S.td}>
                        {lead.country || lead.address ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={11} style={{ color: '#6B7280', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {lead.country || lead.address?.split(',').pop()?.trim()}
                            </span>
                          </div>
                        ) : <span style={{ color: '#D1D5DB', fontSize: 11 }}>—</span>}
                      </td>

                      {/* Category / Products */}
                      <td style={S.td}>
                        <span style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {isSupplier ? (lead.products || lead.category || '—') : (lead.category || '—')}
                        </span>
                      </td>

                      {/* Socials */}
                      <td style={S.td}><SocialIcons lead={lead} /></td>

                      {/* Actions */}
                      <td style={S.td} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => handleSave(lead, idx)} title={saved.has(String(idx)) ? 'Saved' : 'Save lead'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: saved.has(String(idx)) ? '#0F9B6E' : '#D1D5DB' }}>
                            {saved.has(String(idx)) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                          </button>
                          <button onClick={() => setExpandedRow(expandedRow === idx ? null : idx)} title="Details"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4, color: '#D1D5DB' }}>
                            <ChevronDown size={15} style={{ transform: expandedRow === idx ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded detail row ── */}
                    {expandedRow === idx && (
                      <tr key={`exp-${idx}`}>
                        <td colSpan={8} style={{ padding: 0, background: '#f9fefb', borderBottom: '1px solid #e5e7eb' }}>
                          <div style={{ padding: '16px 20px 16px 48px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {lead.address && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Full Address</div>
                                <div style={{ fontSize: 13, color: '#374151' }}>{lead.address}</div>
                              </div>
                            )}
                            {lead.email && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Email</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <a href={`mailto:${lead.email}`} style={{ fontSize: 13, color: '#0F9B6E' }}>{lead.email}</a>
                                  <CopyBtn text={lead.email} />
                                </div>
                              </div>
                            )}
                            {lead.website && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Website</div>
                                <a href={lead.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#0F9B6E' }}>{lead.website}</a>
                              </div>
                            )}
                            {isSupplier && lead.products && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Products</div>
                                <div style={{ fontSize: 13, color: '#374151' }}>{lead.products}</div>
                              </div>
                            )}
                            {isSupplier && lead.min_order && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Min Order</div>
                                <div style={{ fontSize: 13, color: '#374151' }}>{lead.min_order}</div>
                              </div>
                            )}
                            {isSupplier && lead.certifications && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Certifications</div>
                                <div style={{ fontSize: 13, color: '#374151' }}>{lead.certifications}</div>
                              </div>
                            )}
                            {lead.rating && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Rating</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                                  <Star size={12} style={{ color: '#F59E0B' }} />{lead.rating}
                                </div>
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>Social Media</div>
                              <SocialIcons lead={lead} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {sortedResults.length > 0 && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '0 0 12px 12px', borderTop: 'none', flexWrap: 'wrap', gap: 10 }}>

          {/* Info */}
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            Showing {pageStart + 1}–{Math.min(pageStart + rowsPerPage, sortedResults.length)} of {sortedResults.length}
          </span>

          {/* Page buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Prev */}
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              style={{ ...S.btn, padding: '5px 10px', fontSize: 12, background: safePage === 1 ? '#f9fafb' : '#f3f4f6', color: safePage === 1 ? '#D1D5DB' : '#374151', cursor: safePage === 1 ? 'default' : 'pointer' }}>
              ← Prev
            </button>

            {/* Page numbers */}
            {(() => {
              const pages: (number | '...')[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (safePage > 3) pages.push('...');
                for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
                if (safePage < totalPages - 2) pages.push('...');
                pages.push(totalPages);
              }
              return pages.map((p, i) =>
                p === '...'
                  ? <span key={`dots-${i}`} style={{ padding: '5px 4px', fontSize: 12, color: '#9CA3AF' }}>…</span>
                  : <button key={p} onClick={() => setCurrentPage(p as number)}
                      style={{ ...S.btn, padding: '5px 10px', fontSize: 12, minWidth: 34, justifyContent: 'center',
                        background: safePage === p ? '#0F9B6E' : '#f3f4f6',
                        color: safePage === p ? '#fff' : '#374151',
                        fontWeight: safePage === p ? 600 : 400 }}>
                      {p}
                    </button>
              );
            })()}

            {/* Next */}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              style={{ ...S.btn, padding: '5px 10px', fontSize: 12, background: safePage === totalPages ? '#f9fafb' : '#f3f4f6', color: safePage === totalPages ? '#D1D5DB' : '#374151', cursor: safePage === totalPages ? 'default' : 'pointer' }}>
              Next →
            </button>
          </div>

          {/* Jump to page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Go to:</span>
            <input type="number" min={1} max={totalPages} defaultValue={safePage}
              onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt((e.target as HTMLInputElement).value); if (v >= 1 && v <= totalPages) setCurrentPage(v); }}}
              style={{ width: 50, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 12, textAlign: 'center', outline: 'none' }} />
          </div>
        </div>
      )}

      {/* ── Empty / initial state ── */}
      {!loading && !isEnriching && results.length === 0 && searchDone && (
        <div style={{ ...S.card, padding: '60px 20px', textAlign: 'center', color: '#9CA3AF' }}>
          <Building2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 500, color: '#374151' }}>No results found</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Try a broader search term or different location.</p>
        </div>
      )}

      {!loading && !isEnriching && results.length === 0 && !searchDone && (
        <div style={{ ...S.card, padding: '60px 20px', textAlign: 'center' }}>
          <Search size={40} style={{ margin: '0 auto 16px', opacity: 0.15, display: 'block' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
            {isSupplier ? 'Find importers, wholesalers & distributors' : 'Find leads & businesses anywhere'}
          </p>
          <p style={{ fontSize: 13, color: '#9CA3AF', maxWidth: 400, margin: '0 auto' }}>
            {isSupplier
              ? 'Search by product (e.g. "Spices Importer") + country. Gets you real companies with emails from Google Maps, Web directories, and AI.'
              : 'Enter a business type and location. Google Maps + Web Search + AI combined for maximum coverage.'}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {(isSupplier
              ? ['Spices Importer Netherlands','Pepper Wholesaler Germany','Food Importer UK']
              : ['Dentist Amsterdam','Restaurant London','IT Company Berlin']
            ).map(example => (
              <button key={example} type="button"
                onClick={() => {
                  const parts = example.split(' ');
                  setLocation(parts.slice(-1)[0]);
                  setQuery(parts.slice(0, -1).join(' '));
                }}
                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', cursor: 'pointer' }}>
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
