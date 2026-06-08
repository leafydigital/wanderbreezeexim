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

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Search, Building2, Globe, Mail, Phone,
  Linkedin, Facebook, Instagram, Twitter, Music2, Youtube,
  Bookmark, BookmarkCheck, Download, Copy, Check,
  ChevronDown, Loader2, RefreshCw, Filter,
  MapPin, Tag, Star, ExternalLink, Edit2,
} from 'lucide-react';
import { useSearch, useLeads } from './useLeadRadar';
import { enrichBatch } from './searchService';
import { scrapeWebsite } from './emailScraper';
import { exportCSV, exportExcel } from './exportUtils';
import type { Lead, SearchMode } from './types';
import { useSearchGuard } from '../../components/InactivityWarning';

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

// ── Inline editable cell ──────────────────────────────────────
function EditCell({ value, onSave, placeholder, type = 'text' }: {
  value?: string | null;
  onSave: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(value || '');
  useEffect(() => setVal(value || ''), [value]);

  if (editing) return (
    <input
      autoFocus type={type} value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={() => { setEditing(false); if (val !== (value || '')) onSave(val); }}
      onKeyDown={e => {
        if (e.key === 'Enter') { setEditing(false); if (val !== (value || '')) onSave(val); }
        if (e.key === 'Escape') { setVal(value || ''); setEditing(false); }
      }}
      onClick={e => e.stopPropagation()}
      style={{ border: '1px solid #0F9B6E', borderRadius: 6, padding: '3px 7px', fontSize: 11, outline: 'none', width: '100%', minWidth: 120, fontFamily: 'inherit' }}
    />
  );
  return (
    <div
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      title="Click to edit"
      style={{ cursor: 'text', fontSize: 11, color: val ? '#374151' : '#D1D5DB', display: 'flex', alignItems: 'center', gap: 3, minWidth: 60 }}
    >
      {val || <span style={{ fontStyle: 'italic', color: '#D1D5DB' }}>{placeholder || 'click to add'}</span>}
      <Edit2 size={9} style={{ opacity: 0.3, flexShrink: 0 }} />
    </div>
  );
}

// ── Social icons row ──────────────────────────────────────────
function SocialIcons({ lead }: { lead: Lead }) {
  const icons = [
    { url: lead.linkedin,  Icon: Linkedin,  color: '#0A66C2', label: 'LinkedIn'  },
    { url: lead.facebook,  Icon: Facebook,  color: '#1877F2', label: 'Facebook'  },
    { url: lead.instagram, Icon: Instagram, color: '#E1306C', label: 'Instagram' },
    { url: lead.twitter,   Icon: Twitter,   color: '#1DA1F2', label: 'Twitter/X' },
    { url: lead.tiktok,    Icon: Music2,    color: '#010101', label: 'TikTok'    },
    { url: lead.youtube,   Icon: Youtube,   color: '#FF0000', label: 'YouTube'   },
  ];
  const found   = icons.filter(i => i.url);
  const missing = icons.filter(i => !i.url);
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {/* Found socials — clickable, colored */}
      {found.map(({ url, Icon, color, label }) => (
        <a key={label} href={url!} target="_blank" rel="noopener noreferrer" title={label}
          style={{ color, lineHeight: 0, transition: 'opacity .15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          <Icon size={14} />
        </a>
      ))}
      {/* Missing socials — greyed out placeholders */}
      {missing.map(({ Icon, label }) => (
        <span key={label} title={`${label} — not found`}
          style={{ color: '#E5E7EB', lineHeight: 0 }}>
          <Icon size={14} />
        </span>
      ))}
    </div>
  );
}

// ── Location autocomplete ─────────────────────────────────────
// ── Extend window type for Google Maps ───────────────────────
declare global {
  interface Window { google: any; }
}

// ── Location autocomplete — Google Places API ─────────────────
function LocationAutocomplete({ value, onChange, style, placeholder }: {
  value: string; onChange: (v: string) => void;
  style?: React.CSSProperties; placeholder?: string;
}) {
  const inputRef     = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<any>(null);
  const listenerRef  = useRef<any>(null);

  useEffect(() => {
    function init() {
      if (!inputRef.current || !window.google?.maps?.places) return;
      autocomplete.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["geocode"],
        fields: ["formatted_address", "name", "address_components"],
      });
      listenerRef.current = autocomplete.current.addListener("place_changed", () => {
        const place = autocomplete.current!.getPlace();
        if (place?.formatted_address) onChange(place.formatted_address);
        else if (place?.name) onChange(place.name);
      });
    }

    if (window.google?.maps?.places) {
      init();
    } else {
      const iv = setInterval(() => {
        if (window.google?.maps?.places) { clearInterval(iv); init(); }
      }, 150);
      return () => clearInterval(iv);
    }
    return () => {
      if (listenerRef.current && window.google?.maps?.event)
        window.google.maps.event.removeListener(listenerRef.current);
    };
  }, []);

  // Sync external value changes (e.g. example button clicks) into the input
  useEffect(() => {
    if (inputRef.current && value !== inputRef.current.value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <Globe size={15} style={{
        position: "absolute", left: 12, top: "50%",
        transform: "translateY(-50%)", color: "#9CA3AF",
        zIndex: 1, pointerEvents: "none",
      }} />
      <input
        ref={inputRef}
        style={{ ...style, paddingLeft: 36 }}
        placeholder={placeholder}
        defaultValue={value}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
      />
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
  const { setSearchRunning } = useSearchGuard();

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
  const [isSearching,    setIsSearching]    = useState(false);
  const [isEnriching,    setIsEnriching]    = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [enrichedCount,  setEnrichedCount]  = useState(0);
  const [totalCount,     setTotalCount]     = useState(0);
  const [searchDone,     setSearchDone]     = useState(false);
  const [readyResults,   setReadyResults]   = useState<Lead[]>([]);

  const BATCH_SIZE = 3;

  // ── Search + auto-enrich ──────────────────────────────────────
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !location.trim()) return;
    setSelected(new Set()); setSaved(new Set()); setExpandedRow(null);
    setResults([]); setReadyResults([]); setIsEnriching(false);
    setEnrichProgress(0); setCurrentPage(1); setGlobalSearch('');
    setSortDir(null); setEnrichedCount(0); setTotalCount(0);
    setSearchDone(false); setIsSearching(true);

    const leads = await search({ query: query.trim(), location: location.trim(), limit, mode, useOSM: false, useGoogle: true, useClaude: true });
    setIsSearching(false);
    setSearchDone(true);

    if (leads?.length) {
      setTotalCount(leads.length);
      setSearchRunning(true);
      await autoEnrich(leads, location.trim());
    }
    setSearchRunning(false);
  }

  // ── Enrichment — rows appear one-by-one only after fully enriched ─
  async function autoEnrich(leads: Lead[], loc: string) {
    setIsEnriching(true);
    setEnrichProgress(0);
    setEnrichedCount(0);
    setResults([...leads]);

    const enriched = [...leads];
    let completedCount = 0;

    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(async (lead: Lead, j: number) => {
        const idx = i + j;

        if (lead.website) {
          try {
            const result = await scrapeWebsite(lead.website);
            const existingEmails = enriched[idx].emails || (enriched[idx].email ? [enriched[idx].email as string] : []);
            const mergedEmails = [...new Set([...result.emails, ...existingEmails])].filter(Boolean);
            enriched[idx] = {
              ...enriched[idx],
              email:     mergedEmails[0]   || null,
              emails:    mergedEmails,
              linkedin:  result.linkedin   || enriched[idx].linkedin  || null,
              facebook:  result.facebook   || enriched[idx].facebook  || null,
              instagram: result.instagram  || enriched[idx].instagram || null,
              twitter:   result.twitter    || enriched[idx].twitter   || null,
              tiktok:    result.tiktok     || enriched[idx].tiktok    || null,
              youtube:   result.youtube    || enriched[idx].youtube   || null,
            };
          } catch { /* silent */ }
        }

        // Only add to visible table after this row is fully done
        completedCount++;
        const snapshot = enriched[idx];
        setReadyResults(prev => {
          const next = [...prev];
          next[idx] = snapshot;
          return next.filter(Boolean) as Lead[];
        });
        setEnrichedCount(completedCount);
        setEnrichProgress(Math.round((completedCount / leads.length) * 100));
      }));
    }

    setResults([...enriched]);
    setIsEnriching(false);
    setEnrichProgress(100);
    setSearchRunning(false);
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
  const filteredResults = readyResults.filter(r => {
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
    card:  { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 } as React.CSSProperties,
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

            <button type="submit" disabled={loading || isSearching || isEnriching}
              style={{ ...S.btn, background: loading || isSearching || isEnriching ? '#d1fae5' : '#0F9B6E', color: '#fff', padding: '10px 20px', minWidth: 120 }}>
              {isSearching ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Finding leads...</>
                : isEnriching ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enriching...</>
                : loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Searching...</>
                : <><Search size={14} /> Search</>}
            </button>
          </div>

          {/* Progress */}
          {(loading || isSearching || isEnriching) && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Stage 1 — Google Maps fetching */}
              {(loading || isSearching) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                  <Loader2 size={14} color="#0F9B6E" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600 }}>
                    Fetching businesses from Google Maps…
                  </span>
                  <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 4 }}>
                    This takes 10–20 seconds
                  </span>
                </div>
              )}
              {/* Stage 2 — Email + social enrichment */}
              {isEnriching && totalCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
                  <Loader2 size={14} color="#D97706" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                        Fetching emails & socials — rows appear as they complete
                      </span>
                      <span style={{ fontSize: 12, color: '#92400E', fontWeight: 700 }}>
                        {enrichedCount}/{totalCount}
                      </span>
                    </div>
                    <div style={{ background: '#FEF3C7', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: enrichProgress + '%', height: '100%', background: 'linear-gradient(90deg,#D97706,#F59E0B)', borderRadius: 6, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                </div>
              )}
              {/* SearchProgress dots */}
              <SearchProgress progress={progress} />
            </div>
          )}
        </form>
      </div>

      {/* ── Results toolbar ── */}
      {(readyResults.length > 0 || isEnriching) && (
        <div style={{ marginBottom: 10 }}>

          {/* Row 1: Stats + Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
              {isEnriching
                ? <>{enrichedCount} of {totalCount} leads ready<span style={{ color: '#6B7280', fontWeight: 400 }}> · more loading…</span></>
                : <>{readyResults.length} leads found{sortedResults.length !== readyResults.length && <span style={{ color: '#6B7280', fontWeight: 400 }}> · {sortedResults.length} filtered</span>}</>
              }
            </span>
            {isEnriching
              ? <span style={{ fontSize: 12, color: '#D97706' }}>⏳ Enriching {enrichedCount}/{totalCount}…</span>
              : <span style={{ fontSize: 12, color: '#16A34A' }}>✓ {emailCount} with email · {websiteCount} with website</span>
            }
            <div style={{ flex: 1 }} />
            {selected.size > 0 && (
              <button onClick={handleSaveSelected}
                style={{ ...S.btn, background: '#0F9B6E', color: '#fff', fontSize: 12, padding: '7px 12px' }}>
                <Bookmark size={13} /> Save {selected.size}
              </button>
            )}
            <button onClick={() => exportCSV(sortedResults, query, location)}
              style={{ ...S.btn, background: '#f3f4f6', color: '#374151', fontSize: 12, padding: '7px 12px' }}>
              <Download size={13} /> CSV
            </button>
            <button onClick={() => exportExcel(sortedResults, query, location)}
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
        <div style={{ ...S.card, overflow: 'hidden' }}>
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

                      {/* Email — inline editable when missing */}
                      <td style={S.td}>
                        {(() => {
                          const allEmails = lead.emails?.length ? lead.emails : (lead.email ? [lead.email] : []);
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {allEmails.map((em, ei) => (
                                <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Mail size={11} style={{ color: '#0F9B6E', flexShrink: 0 }} />
                                  <span style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }} title={em}>{em}</span>
                                  <CopyBtn text={em} />
                                </div>
                              ))}
                              {allEmails.length === 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Mail size={11} style={{ color: '#D1D5DB', flexShrink: 0 }} />
                                  <EditCell
                                    value=""
                                    placeholder={isEnriching ? 'fetching…' : 'add email'}
                                    type="email"
                                    onSave={v => {
                                      if (!v.trim()) return;
                                      setReadyResults(prev => prev.map((r, i) =>
                                        i === idx ? { ...r, email: v.trim(), emails: [v.trim()] } : r
                                      ));
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Phone — inline editable when missing */}
                      <td style={S.td}>
                        {lead.phone ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={11} style={{ color: '#6B7280', flexShrink: 0 }} />
                            <EditCell
                              value={lead.phone}
                              onSave={v => setReadyResults(prev => prev.map((r, i) => i === idx ? { ...r, phone: v } : r))}
                            />
                            <CopyBtn text={lead.phone} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={11} style={{ color: '#D1D5DB', flexShrink: 0 }} />
                            <EditCell
                              value=""
                              placeholder="add phone"
                              onSave={v => setReadyResults(prev => prev.map((r, i) => i === idx ? { ...r, phone: v } : r))}
                            />
                          </div>
                        )}
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
                            {(lead.emails?.length ? lead.emails : (lead.email ? [lead.email] : [])).length > 0 && (
                              <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>
                                  Email{(lead.emails?.length ?? 0) > 1 ? `s (${lead.emails!.length})` : ''}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                  {(lead.emails?.length ? lead.emails : (lead.email ? [lead.email] : [])).map((em, ei) => (
                                    <div key={ei} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <a href={`mailto:${em}`} style={{ fontSize: 13, color: '#0F9B6E' }}>{em}</a>
                                      <CopyBtn text={em} />
                                    </div>
                                  ))}
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
      {!loading && !isSearching && !isEnriching && readyResults.length === 0 && searchDone && (
        <div style={{ ...S.card, padding: '60px 20px', textAlign: 'center', color: '#9CA3AF' }}>
          <Building2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
          <p style={{ fontSize: 15, fontWeight: 500, color: '#374151' }}>No results found</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Try a broader search term or different location.</p>
        </div>
      )}

      {!loading && !isSearching && !isEnriching && readyResults.length === 0 && !searchDone && (
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