import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Download,
  Save,
  Send,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  Globe,
  Phone,
  Mail,
  MapPin,
  Star,
  Building2,
  SlidersHorizontal,
  BarChart3,
  Bookmark,
  Settings2,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Trash2,
  FileSpreadsheet,
  FileText,
  Radar,
} from "lucide-react";
import Modal from "../components/Modal";
import { useAuth } from "../lib/auth";
import { useSearch, useLeads, useAnalytics } from "./leadradar/useLeadRadar";
import { exportCSV, exportExcel } from "./leadradar/exportUtils";
import type { Lead, LeadStage, LRPage } from "./leadradar/types";

import SearchPage from "./leadradar/SearchPage";
import OutreachPage from "./leadradar/outreach/OutreachPage";

// ── Constants ─────────────────────────────────────────────
const STAGE_LABELS: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  closed: "Closed",
};
const STAGE_COLORS: Record<LeadStage, string> = {
  new: "bg-gray-100 text-gray-600",
  contacted: "bg-blue-100 text-blue-700",
  qualified: "bg-amber-100 text-amber-700",
  proposal: "bg-purple-100 text-purple-700",
  closed: "bg-teal-100 text-teal-700",
};
const SOURCE_COLORS: Record<string, string> = {
  google: "bg-green-100 text-green-700",
  osm: "bg-cyan-100 text-cyan-700",
  ai: "bg-violet-100 text-violet-700",
  web: "bg-orange-100 text-orange-700",
};
const SOURCE_LABELS: Record<string, string> = {
  google: "Google Maps",
  osm: "OSM",
  ai: "AI",
  web: "Google Web",
};
const PAGE_SIZE = 50;

// ── Sub-nav tabs ──────────────────────────────────────────
const TABS: { id: LRPage; label: string; icon: any }[] = [
  { id: "search", label: "Search", icon: Search },
  { id: "leads", label: "Saved Leads", icon: Bookmark },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "outreach", label: "Outreach", icon: Send}
  // { id: 'settings',  label: 'API Keys',   icon: Settings2 },
];

// ── Toast ─────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<
    { id: number; msg: string; type: "success" | "error" | "info" }[]
  >([]);
  const toast = (msg: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };
  return { toasts, toast };
}

// ════════════════════════════════════════════════════════════
export default function LeadRadar() {
  const { can } = useAuth();
  const [tab, setTab] = useState<LRPage>("search");
  const { toasts, toast } = useToast();

  if (!can("leadradar")) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500 font-medium">Access Denied</p>
          <p className="text-sm text-gray-400 mt-1">
            You don't have permission to access LeadRadar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub nav */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${
                  tab === id
                    ? "border-teal-500 text-teal-600 bg-teal-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/*{tab === 'search'    && <SearchTab toast={toast} />}
      {tab === 'leads'     && <LeadsTab toast={toast} />}
      {tab === 'analytics' && <AnalyticsTab />}
       {tab === 'settings'  && <SettingsTab toast={toast} />} */}

      {tab === "search" && <SearchPage />}
      {tab === "outreach" && <OutreachPage />}

      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium
            pointer-events-auto animate-in slide-in-from-right-4 duration-200
            ${
              t.type === "success"
                ? "bg-teal-600 text-white"
                : t.type === "error"
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-white"
            }`}
          >
            {t.type === "success" && <Check size={14} />}
            {t.type === "error" && <AlertCircle size={14} />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SEARCH TAB
// ════════════════════════════════════════════════════════════
function SearchTab({ toast }: { toast: Function }) {
  //const { claudeKey, googleKey } = useApiKeys();
  const { results, loading, progress, search, setResults } = useSearch();
  const { saveLead, saveMany } = useLeads();

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState("");
  const [useOSM, setUseOSM] = useState(true);
  const [useGoogle, setUseGoogle] = useState(false);
  const [useClaude, setUseClaude] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [fRating, setFRating] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fWebsite, setFWebsite] = useState("");
  const [fSource, setFSource] = useState("");

  // Table
  const [sortCol, setSortCol] = useState<keyof Lead | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const filteredResults = useMemo(() => {
    let r = [...results];
    if (fRating)
      r = r.filter((c) => parseFloat(c.rating || "0") >= parseFloat(fRating));
    if (fPhone === "yes") r = r.filter((c) => !!c.phone);
    if (fPhone === "no") r = r.filter((c) => !c.phone);
    if (fEmail === "yes") r = r.filter((c) => !!c.email);
    if (fEmail === "no") r = r.filter((c) => !c.email);
    if (fWebsite === "yes") r = r.filter((c) => !!c.website);
    if (fWebsite === "no") r = r.filter((c) => !c.website);
    if (fSource) r = r.filter((c) => c.source === fSource);
    if (sortCol) {
      r.sort((a, b) => {
        const av = String(a[sortCol] || "").toLowerCase();
        const bv = String(b[sortCol] || "").toLowerCase();
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return r;
  }, [results, fRating, fPhone, fEmail, fWebsite, fSource, sortCol, sortDir]);

  const pageData = filteredResults.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const totalPages = Math.ceil(filteredResults.length / PAGE_SIZE);

  function handleSort(col: keyof Lead) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  async function handleSearch() {
    if (!query.trim() || !location.trim()) {
      toast("Enter a business type and location", "error");
      return;
    }
    setSelected(new Set());
    setSavedIds(new Set());
    setPage(1);
    //   await search({
    //     query: query.trim(),
    //     location: location.trim(),
    //     limit: parseInt(limit) || 0,
    //     useOSM, useGoogle, useClaude,
    //   });
    // }

    async function handleSaveOne(lead: Lead, idx: number) {
      const err = await saveLead(lead);
      if (err) {
        toast(err, "error");
        return;
      }
      setSavedIds((s) => new Set([...s, idx]));
      toast("Lead saved!", "success");
    }

    async function handleSaveSelected() {
      const toSave =
        selected.size > 0
          ? [...selected].map((i) => filteredResults[i])
          : filteredResults;
      const count = await saveMany(toSave);
      toast(`${count} leads saved`, "success");
    }

    function getSelectedLeads() {
      return selected.size > 0
        ? [...selected].map((i) => filteredResults[i])
        : filteredResults;
    }

    function SortIcon({ col }: { col: keyof Lead }) {
      if (sortCol !== col)
        return <ChevronUp size={12} className="opacity-20" />;
      return sortDir === "asc" ? (
        <ChevronUp size={12} />
      ) : (
        <ChevronDown size={12} />
      );
    }

    const sourcePills = useMemo(() => {
      const counts: Record<string, number> = {};
      filteredResults.forEach((r) => {
        counts[r.source] = (counts[r.source] || 0) + 1;
      });
      return counts;
    }, [filteredResults]);

    return (
      <div className="space-y-4">
        {/* Search panel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          {/* API key banner */}
          {/* {(!claudeKey && !googleKey) && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-amber-800">
              <strong>No API keys configured.</strong> Results will come from OpenStreetMap only (no phone/email/rating).
              Add <strong>GOOGLE_PLACES_KEY</strong> and <strong>ANTHROPIC_API_KEY</strong> to your Supabase secrets for full results with contact details.
            </span>
          </div>
        )} */}

          {/* Inputs row */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-[2] min-w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
                Business Type / Keyword
              </label>
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. spice importers, dental clinics, beauty salons..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex-[1.2] min-w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
                Location / Country
              </label>
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. USA, Trivandrum..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">
                Result Limit
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="All"
                min={1}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Search size={14} />
              )}
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Source toggles */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs text-gray-400 uppercase font-medium tracking-wide mr-1">
              Sources:
            </span>
            {[
              {
                id: "google",
                label: "Google Maps",
                note: "Needs key",
                color: "bg-green-500",
                val: useGoogle,
                set: setUseGoogle,
              },
              {
                id: "web",
                label: "Google Web",
                note: "Needs key",
                color: "bg-orange-500",
                val: useGoogle,
                set: setUseGoogle,
              },
              {
                id: "claude",
                label: "Claude AI",
                note: "Needs key",
                color: "bg-violet-500",
                val: useClaude,
                set: setUseClaude,
              },
              {
                id: "osm",
                label: "OpenStreetMap",
                note: "Free",
                color: "bg-cyan-500",
                val: useOSM,
                set: setUseOSM,
              },
            ].map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer text-xs font-medium transition-colors
              ${s.val ? "border-gray-300 bg-gray-50 text-gray-700" : "border-gray-200 text-gray-400 bg-white"}`}
              >
                <input
                  type="checkbox"
                  checked={s.val}
                  onChange={(e) => s.set(e.target.checked)}
                  className="w-3 h-3 accent-teal-500"
                />
                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                {s.label}
                <span className="text-gray-400 font-normal">{s.note}</span>
              </label>
            ))}
          </div>

          {/* Loading progress */}
          {loading && (
            <div className="flex items-center gap-4">
              {Object.entries(progress).map(([src, state]) => (
                <div
                  key={src}
                  className={`flex items-center gap-1.5 text-xs font-medium
                ${state === "done" ? "text-teal-600" : "text-gray-500"}`}
                >
                  {state === "loading" && (
                    <RefreshCw size={11} className="animate-spin" />
                  )}
                  {state === "done" && <Check size={11} />}
                  {SOURCE_LABELS[src] || src}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results area */}
        {results.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Results toolbar */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900 text-sm">
                  <span className="text-teal-600">
                    {filteredResults.length}
                  </span>{" "}
                  companies found
                </span>
                <div className="flex gap-1.5">
                  {Object.entries(sourcePills).map(([src, n]) => (
                    <span
                      key={src}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[src] || "bg-gray-100 text-gray-600"}`}
                    >
                      {n} {SOURCE_LABELS[src]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <span className="text-xs text-gray-500">
                    {selected.size} selected
                  </span>
                )}
                <button
                  onClick={() => setShowFilters((f) => !f)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors
                  ${showFilters ? "bg-teal-50 border-teal-200 text-teal-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  <SlidersHorizontal size={12} /> Filters
                </button>
                <button
                  onClick={() => exportCSV(getSelectedLeads(), "leads")}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <FileText size={12} /> CSV
                </button>
                <button
                  onClick={() => exportExcel(getSelectedLeads(), "leads")}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <FileSpreadsheet size={12} /> Excel
                </button>
                <button
                  onClick={handleSaveSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700"
                >
                  <Save size={12} />{" "}
                  {selected.size > 0 ? `Save ${selected.size}` : "Save All"}
                </button>
              </div>
            </div>

            {/* Filters row */}
            {showFilters && (
              <div className="flex items-end flex-wrap gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
                {[
                  {
                    label: "Min Rating",
                    el: (
                      <select
                        value={fRating}
                        onChange={(e) => setFRating(e.target.value)}
                        className="filter-sel"
                      >
                        <option value="">Any</option>
                        <option value="3">3.0+</option>
                        <option value="3.5">3.5+</option>
                        <option value="4">4.0+</option>
                        <option value="4.5">4.5+</option>
                      </select>
                    ),
                  },
                  {
                    label: "Phone",
                    el: (
                      <select
                        value={fPhone}
                        onChange={(e) => setFPhone(e.target.value)}
                        className="filter-sel"
                      >
                        <option value="">Any</option>
                        <option value="yes">Has phone</option>
                        <option value="no">No phone</option>
                      </select>
                    ),
                  },
                  {
                    label: "Email",
                    el: (
                      <select
                        value={fEmail}
                        onChange={(e) => setFEmail(e.target.value)}
                        className="filter-sel"
                      >
                        <option value="">Any</option>
                        <option value="yes">Has email</option>
                        <option value="no">No email</option>
                      </select>
                    ),
                  },
                  {
                    label: "Website",
                    el: (
                      <select
                        value={fWebsite}
                        onChange={(e) => setFWebsite(e.target.value)}
                        className="filter-sel"
                      >
                        <option value="">Any</option>
                        <option value="yes">Has website</option>
                        <option value="no">No website</option>
                      </select>
                    ),
                  },
                  {
                    label: "Source",
                    el: (
                      <select
                        value={fSource}
                        onChange={(e) => setFSource(e.target.value)}
                        className="filter-sel"
                      >
                        <option value="">All</option>
                        <option value="google">Google</option>
                        <option value="osm">OSM</option>
                        <option value="ai">AI</option>
                      </select>
                    ),
                  },
                ].map(({ label, el }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">
                      {label}
                    </label>
                    {el}
                  </div>
                ))}
                <button
                  onClick={() => {
                    setFRating("");
                    setFPhone("");
                    setFEmail("");
                    setFWebsite("");
                    setFSource("");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 border border-gray-200 rounded-lg"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selected.size === filteredResults.length &&
                          filteredResults.length > 0
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? new Set(filteredResults.map((_, i) => i))
                              : new Set(),
                          )
                        }
                        className="w-3.5 h-3.5 accent-teal-500"
                      />
                    </th>
                    {(
                      [
                        "name",
                        "email",
                        "phone",
                        "website",
                        "address",
                        "country",
                      ] as (keyof Lead)[]
                    ).map((col) => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                      >
                        <div className="flex items-center gap-1">
                          {col === "name"
                            ? "Company Name"
                            : col.charAt(0).toUpperCase() + col.slice(1)}
                          <SortIcon col={col} />
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Source
                    </th>
                    <th className="px-4 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pageData.map((lead, i) => {
                    const absIdx = (page - 1) * PAGE_SIZE + i;
                    const isSaved = savedIds.has(absIdx);
                    return (
                      <tr
                        key={absIdx}
                        className={`hover:bg-gray-50/70 transition-colors ${selected.has(absIdx) ? "bg-teal-50/40" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(absIdx)}
                            onChange={(e) => {
                              const s = new Set(selected);
                              e.target.checked
                                ? s.add(absIdx)
                                : s.delete(absIdx);
                              setSelected(s);
                            }}
                            className="w-3.5 h-3.5 accent-teal-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900 max-w-[180px] truncate">
                          {lead.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">
                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-teal-600 flex items-center gap-1"
                            >
                              <Mail size={11} />
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="hover:text-teal-600 flex items-center gap-1"
                            >
                              <Phone size={11} />
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-teal-600 flex items-center gap-1 truncate"
                            >
                              <Globe size={11} className="flex-shrink-0" />
                              {
                                lead.website
                                  .replace(/https?:\/\//, "")
                                  .split("/")[0]
                              }
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-gray-500 max-w-[160px] truncate"
                          title={lead.address || ""}
                        >
                          {lead.address || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {lead.country || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.rating ? (
                            <span className="flex items-center gap-0.5 text-amber-600 font-medium text-xs">
                              <Star size={11} fill="currentColor" />
                              {lead.rating}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[lead.source] || "bg-gray-100 text-gray-600"}`}
                          >
                            {SOURCE_LABELS[lead.source] || lead.source}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleSaveOne(lead, absIdx)}
                            disabled={isSaved}
                            title={isSaved ? "Saved" : "Save lead"}
                            className={`p-1.5 rounded-md transition-colors
                            ${isSaved ? "text-teal-500 bg-teal-50" : "text-gray-400 hover:text-teal-600 hover:bg-teal-50"}`}
                          >
                            {isSaved ? <Check size={14} /> : <Save size={14} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Showing {(page - 1) * PAGE_SIZE + 1}–
                  {Math.min(page * PAGE_SIZE, filteredResults.length)} of{" "}
                  {filteredResults.length}
                </span>
                <div className="flex gap-1">
                  {Array.from(
                    { length: Math.min(totalPages, 10) },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-md text-xs font-medium transition-colors
                      ${p === page ? "bg-teal-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Radar size={40} className="mx-auto mb-4 text-gray-200" />
            <h3 className="font-semibold text-gray-700 mb-1">
              Start searching for leads
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">
              Enter a business type and location. OpenStreetMap is always free.
              Add a Claude AI key for trade and import/export searches.
            </p>
            <div className="flex justify-center gap-4 mt-5">
              {[
                { dot: "bg-cyan-500", label: "OpenStreetMap — always free" },
                { dot: "bg-green-500", label: "Google Places — needs key" },
                { dot: "bg-violet-500", label: "Claude AI — needs key" },
              ].map(({ dot, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-xs text-gray-400"
                >
                  <span className={`w-2 h-2 rounded-full ${dot}`} /> {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // SAVED LEADS TAB
  // ════════════════════════════════════════════════════════════
  function LeadsTab({ toast }: { toast: Function }) {
    const { leads, loading, fetchLeads, updateStage, deleteLead } = useLeads();
    const [search, setSearch] = useState("");
    const [fStage, setFStage] = useState("");
    const [fSource, setFSource] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
      fetchLeads();
    }, [fetchLeads]);

    const filtered = useMemo(
      () =>
        leads.filter((l) => {
          if (fStage && l.stage !== fStage) return false;
          if (fSource && l.source !== fSource) return false;
          if (search && !l.name.toLowerCase().includes(search.toLowerCase()))
            return false;
          return true;
        }),
      [leads, fStage, fSource, search],
    );

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={fStage}
              onChange={(e) => setFStage(e.target.value)}
              className="filter-sel"
            >
              <option value="">All stages</option>
              {(Object.keys(STAGE_LABELS) as LeadStage[]).map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={fSource}
              onChange={(e) => setFSource(e.target.value)}
              className="filter-sel"
            >
              <option value="">All sources</option>
              <option value="google">Google</option>
              <option value="osm">OSM</option>
              <option value="ai">AI</option>
            </select>
            <button
              onClick={() => exportCSV(filtered, "saved_leads")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <FileText size={12} /> CSV
            </button>
            <button
              onClick={() => exportExcel(filtered, "saved_leads")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <FileSpreadsheet size={12} /> Excel
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      "Company Name",
                      "Email",
                      "Phone",
                      "Website",
                      "Address",
                      "Country",
                      "Stage",
                      "Source",
                      "Saved By",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-10 text-center text-gray-400 text-sm"
                      >
                        No saved leads yet
                      </td>
                    </tr>
                  ) : (
                    filtered.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900 max-w-[160px] truncate">
                          {lead.name}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">
                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="hover:text-teal-600"
                            >
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {lead.phone || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-teal-600 flex items-center gap-1"
                            >
                              <ExternalLink size={11} />
                              {
                                lead.website
                                  .replace(/https?:\/\//, "")
                                  .split("/")[0]
                              }
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">
                          {lead.address || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {lead.country || (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={lead.stage || "new"}
                            onChange={(e) =>
                              updateStage(lead.id!, e.target.value as LeadStage)
                            }
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-400 ${STAGE_COLORS[(lead.stage as LeadStage) || "new"]}`}
                          >
                            {(
                              Object.entries(STAGE_LABELS) as [
                                LeadStage,
                                string,
                              ][]
                            ).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[lead.source] || "bg-gray-100 text-gray-600"}`}
                          >
                            {SOURCE_LABELS[lead.source] || lead.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {lead.saved_by || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeleteId(lead.id!)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Modal
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          title="Remove Lead"
          size="sm"
        >
          <p className="text-sm text-gray-600 mb-5">
            Remove this lead from your saved list?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteId(null)}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await deleteLead(deleteId!);
                setDeleteId(null);
                toast("Lead removed", "info");
              }}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // ANALYTICS TAB
  // ════════════════════════════════════════════════════════════
  function AnalyticsTab() {
    const { data, loading, fetchAnalytics } = useAnalytics();
    useEffect(() => {
      fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading || !data) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    const STAGE_BAR_COLORS: Record<string, string> = {
      new: "bg-gray-400",
      contacted: "bg-blue-400",
      qualified: "bg-amber-400",
      proposal: "bg-purple-400",
      closed: "bg-teal-500",
    };

    return (
      <div className="space-y-4">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              label: "Total Saved Leads",
              val: data.totalLeads,
              color: "text-teal-600",
            },
            {
              label: "Total Searches",
              val: data.totalSearches,
              color: "text-blue-600",
            },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-2">
                {label}
              </p>
              <p className={`text-3xl font-bold ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Pipeline */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Leads by Stage
            </h3>
            <div className="space-y-3">
              {(Object.entries(STAGE_LABELS) as [LeadStage, string][]).map(
                ([stage, label]) => {
                  const count = data.byStage[stage] || 0;
                  const pct = data.totalLeads
                    ? Math.round((count / data.totalLeads) * 100)
                    : 0;
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-20 flex-shrink-0">
                        {label}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${STAGE_BAR_COLORS[stage]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-6 text-right">
                        {count}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Recent searches */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Recent Searches
            </h3>
            {data.recentSearches.length === 0 ? (
              <p className="text-sm text-gray-400">No searches yet</p>
            ) : (
              <div className="space-y-2">
                {data.recentSearches.map((s: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {s.query}
                      </span>
                      <span className="text-gray-400 ml-2 text-xs">
                        in {s.location}
                      </span>
                    </div>
                    <span className="text-teal-600 font-semibold text-xs">
                      {s.result_count} results
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // SETTINGS TAB
  // ════════════════════════════════════════════════════════════
  // function SettingsTab({ toast }: { toast: Function }) {
  //   const { claudeKey, googleKey, saveClaudeKey, saveGoogleKey } = useApiKeys();
  //   const [claude, setClaude] = useState(claudeKey ? '(saved)' : '');
  //   const [google, setGoogle] = useState(googleKey ? '(saved)' : '');
  //   const [showClaude, setShowClaude] = useState(false);
  //   const [showGoogle, setShowGoogle] = useState(false);

  //   function handleSaveClaude() {
  //     if (!claude.trim() || claude === '(saved)') { toast('Enter a valid key', 'error'); return; }
  //     saveClaudeKey(claude.trim());
  //     setClaude('(saved)');
  //     toast('Claude AI key saved', 'success');
  //   }

  //   function handleSaveGoogle() {
  //     if (!google.trim() || google === '(saved)') { toast('Enter a valid key', 'error'); return; }
  //     saveGoogleKey(google.trim());
  //     setGoogle('(saved)');
  //     toast('Google Places key saved', 'success');
  //   }

  //   return (
  //     <div className="space-y-4">
  //       <div className="grid lg:grid-cols-2 gap-4">
  //         {/* Claude */}
  //         <div className="bg-white border border-gray-200 rounded-xl p-6">
  //           <div className="flex items-center gap-3 mb-4">
  //             <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
  //               <span className="text-violet-600 font-bold text-sm">AI</span>
  //             </div>
  //             <div>
  //               <p className="font-semibold text-gray-900 text-sm">Anthropic Claude AI</p>
  //               <p className="text-xs text-gray-500">Best for trade, import/export searches</p>
  //             </div>
  //             {claudeKey && <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Active</span>}
  //           </div>
  //           <div className="space-y-3">
  //             <div>
  //               <label className="block text-xs font-medium text-gray-600 mb-1.5">
  //                 API Key <a href="https://console.anthropic.com/account/keys" target="_blank" rel="noopener noreferrer" className="text-teal-600 ml-1">Get key ↗</a>
  //               </label>
  //               <div className="relative">
  //                 <input
  //                   type={showClaude ? 'text' : 'password'}
  //                   value={claude}
  //                   onChange={e => setClaude(e.target.value)}
  //                   onFocus={() => { if (claude === '(saved)') setClaude(''); }}
  //                   placeholder="sk-ant-api03-..."
  //                   className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
  //                 />
  //                 <button type="button" onClick={() => setShowClaude(s => !s)}
  //                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
  //                   <span className="text-xs">{showClaude ? 'Hide' : 'Show'}</span>
  //                 </button>
  //               </div>
  //             </div>
  //             <button onClick={handleSaveClaude} className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
  //               Save Key
  //             </button>
  //             <p className="text-xs text-gray-400">Key stored in browser localStorage. ~$0.003 per search.</p>
  //           </div>
  //         </div>

  //         {/* Google */}
  //         <div className="bg-white border border-gray-200 rounded-xl p-6">
  //           <div className="flex items-center gap-3 mb-4">
  //             <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
  //               <Globe size={16} className="text-green-600" />
  //             </div>
  //             <div>
  //               <p className="font-semibold text-gray-900 text-sm">Google Places API</p>
  //               <p className="text-xs text-gray-500">Real-time local business data</p>
  //             </div>
  //             {googleKey && <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Active</span>}
  //           </div>
  //           <div className="space-y-3">
  //             <div>
  //               <label className="block text-xs font-medium text-gray-600 mb-1.5">
  //                 API Key <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-teal-600 ml-1">Get key ↗</a>
  //               </label>
  //               <div className="relative">
  //                 <input
  //                   type={showGoogle ? 'text' : 'password'}
  //                   value={google}
  //                   onChange={e => setGoogle(e.target.value)}
  //                   onFocus={() => { if (google === '(saved)') setGoogle(''); }}
  //                   placeholder="AIza..."
  //                   className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
  //                 />
  //                 <button type="button" onClick={() => setShowGoogle(s => !s)}
  //                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
  //                   <span className="text-xs">{showGoogle ? 'Hide' : 'Show'}</span>
  //                 </button>
  //               </div>
  //             </div>
  //             <button onClick={handleSaveGoogle} className="w-full bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
  //               Save Key
  //             </button>
  //             <p className="text-xs text-gray-400">$200 free credit/month (~10k searches). Requires backend proxy for CORS.</p>
  //           </div>
  //         </div>

  //         {/* OSM */}
  //         <div className="bg-white border border-gray-200 rounded-xl p-6 lg:col-span-2">
  //           <div className="flex items-center gap-3">
  //             <div className="w-9 h-9 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
  //               <MapPin size={16} className="text-cyan-600" />
  //             </div>
  //             <div className="flex-1">
  //               <p className="font-semibold text-gray-900 text-sm">OpenStreetMap / Overpass</p>
  //               <p className="text-xs text-gray-500">Always active — completely free, no key needed. Best for physical locations (clinics, salons, restaurants).</p>
  //             </div>
  //             <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Always Active</span>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
}
