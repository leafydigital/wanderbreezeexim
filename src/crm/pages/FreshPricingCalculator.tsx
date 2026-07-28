import { useEffect, useRef, useState } from "react";
import {
  Leaf,
  Save,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";
import { formatDate, today } from "../lib/utils";

// ── Types ──────────────────────────────────────────────────

interface Inputs {
  name: string;
  purchase_price_per_kg: string;
  pack_size_grams: string;
  packaging_cost: string;
  sticker_cost: string;
  manpower_cost: string;
  misc_cost: string;
  margin_pct: string;
}

interface Results {
  rawCostPerUnit: number;
  costPerUnit: number;
  sellingPricePerUnit: number;
  profitPerUnit: number;
  pricePerKg: number;
}

interface FreshCalc {
  id: string;
  name: string;
  purchase_price_per_kg: number;
  pack_size_grams: number;
  packaging_cost: number;
  sticker_cost: number;
  manpower_cost: number;
  misc_cost: number;
  margin_pct: number;
  cost_per_unit: number;
  selling_price_per_unit: number;
  profit_per_unit: number;
  price_per_kg: number;
  created_at: string;
}

interface FreshQuotation {
  id: string;
  quote_number: string;
  calculation_id: string | null;
  product_name: string;
  pack_size_grams: number;
  price_per_unit: number;
  price_per_kg: number;
  quantity_units: number;
  total_amount: number;
  customer_name: string;
  customer_company: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  payment_terms: string;
  valid_until: string | null;
  notes: string;
  created_at: string;
}

interface CompanyProfile {
  company_name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
}

const emptyInputs: Inputs = {
  name: "",
  purchase_price_per_kg: "",
  pack_size_grams: "100",
  packaging_cost: "",
  sticker_cost: "",
  manpower_cost: "",
  misc_cost: "",
  margin_pct: "",
};

const emptyQuoteForm = {
  customer_name: "",
  customer_company: "",
  customer_phone: "",
  customer_email: "",
  customer_address: "",
  quantity_units: "",
  payment_terms: "",
  valid_until: "",
  notes: "",
};

function n(s: string | number): number {
  return parseFloat(String(s)) || 0;
}

function compute(inp: Inputs): Results | null {
  const price = n(inp.purchase_price_per_kg);
  const grams = n(inp.pack_size_grams);
  if (price <= 0 || grams <= 0) return null;

  const rawCostPerUnit = (price / 1000) * grams;
  const costPerUnit = rawCostPerUnit + n(inp.packaging_cost) + n(inp.sticker_cost) + n(inp.manpower_cost) + n(inp.misc_cost);
  const margin = n(inp.margin_pct);
  const sellingPricePerUnit = costPerUnit * (1 + margin / 100);
  const profitPerUnit = sellingPricePerUnit - costPerUnit;
  const pricePerKg = (sellingPricePerUnit / grams) * 1000;

  return { rawCostPerUnit, costPerUnit, sellingPricePerUnit, profitPerUnit, pricePerKg };
}

function fmt(val: number, dec = 2): string {
  return val.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function INR(val: number) {
  return "₹" + fmt(val);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Small presentational helpers ──────────────────────────

function Field({
  label,
  value,
  onChange,
  prefix = "₹",
  suffix,
  placeholder = "0",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{prefix}</span>
        )}
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-gray-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            prefix ? "pl-7" : "pl-3"
          } ${suffix ? "pr-8" : "pr-3"}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

function Row({ label, value, bold, green }: { label: string; value: string; bold?: boolean; green?: boolean }) {
  return (
    <div className={`flex justify-between items-center text-sm ${bold ? "font-semibold" : ""}`}>
      <span className={green ? "text-green-600" : "text-gray-600"}>{label}</span>
      <span className={green ? "text-green-600" : "text-gray-900"}>{value}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function FreshPricingCalculator() {
  const [inp, setInp] = useState<Inputs>(emptyInputs);
  const [results, setResults] = useState<Results | null>(null);

  const [savedCalcs, setSavedCalcs] = useState<FreshCalc[]>([]);
  const [loadingCalcs, setLoadingCalcs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteSource, setQuoteSource] = useState<{ name: string; grams: number; pricePerUnit: number; pricePerKg: number; calcId: string | null } | null>(null);
  const [quoteForm, setQuoteForm] = useState(emptyQuoteForm);
  const [savingQuote, setSavingQuote] = useState(false);

  const [savedQuotes, setSavedQuotes] = useState<FreshQuotation[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [showQuotes, setShowQuotes] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<FreshQuotation | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSaved();
    fetchQuotes();
    fetchCompany();
  }, []);

  useEffect(() => {
    setResults(compute(inp));
  }, [inp]);

  async function fetchCompany() {
    const { data } = await supabase.from("company_settings").select("*").limit(1).maybeSingle();
    setCompany((data as CompanyProfile) ?? null);
  }

  async function fetchSaved() {
    setLoadingCalcs(true);
    const { data } = await supabase.from("fresh_pricing_calculations").select("*").order("created_at", { ascending: false });
    setSavedCalcs((data as FreshCalc[]) ?? []);
    setLoadingCalcs(false);
  }

  async function fetchQuotes() {
    setLoadingQuotes(true);
    const { data } = await supabase.from("fresh_quotations").select("*").order("created_at", { ascending: false });
    setSavedQuotes((data as FreshQuotation[]) ?? []);
    setLoadingQuotes(false);
  }

  function set(key: keyof Inputs, val: string) {
    setInp((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!results) return;
    if (!inp.name.trim()) {
      alert("Please enter a product name");
      return;
    }
    setSaving(true);
    await supabase.from("fresh_pricing_calculations").insert({
      name: inp.name,
      purchase_price_per_kg: n(inp.purchase_price_per_kg),
      pack_size_grams: n(inp.pack_size_grams),
      packaging_cost: n(inp.packaging_cost),
      sticker_cost: n(inp.sticker_cost),
      manpower_cost: n(inp.manpower_cost),
      misc_cost: n(inp.misc_cost),
      margin_pct: n(inp.margin_pct),
      cost_per_unit: results.costPerUnit,
      selling_price_per_unit: results.sellingPricePerUnit,
      profit_per_unit: results.profitPerUnit,
      price_per_kg: results.pricePerKg,
    });
    await fetchSaved();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("fresh_pricing_calculations").delete().eq("id", id);
    setDeleteId(null);
    fetchSaved();
  }

  function loadCalc(c: FreshCalc) {
    setInp({
      name: c.name,
      purchase_price_per_kg: String(c.purchase_price_per_kg),
      pack_size_grams: String(c.pack_size_grams),
      packaging_cost: String(c.packaging_cost),
      sticker_cost: String(c.sticker_cost),
      manpower_cost: String(c.manpower_cost),
      misc_cost: String(c.misc_cost),
      margin_pct: String(c.margin_pct),
    });
  }

  // ── Quotation ──────────────────────────────────────────────

  function openQuote(source: { name: string; grams: number; pricePerUnit: number; pricePerKg: number; calcId: string | null }) {
    setQuoteSource(source);
    setQuoteForm({ ...emptyQuoteForm, valid_until: addDays(today(), 7) });
    setQuoteOpen(true);
  }

  function openQuoteFromCurrent() {
    if (!results || !inp.name.trim()) return;
    openQuote({ name: inp.name, grams: n(inp.pack_size_grams), pricePerUnit: results.sellingPricePerUnit, pricePerKg: results.pricePerKg, calcId: null });
  }

  function openQuoteFromSaved(c: FreshCalc) {
    openQuote({ name: c.name, grams: c.pack_size_grams, pricePerUnit: c.selling_price_per_unit, pricePerKg: c.price_per_kg, calcId: c.id });
  }

  const quoteQty = n(quoteForm.quantity_units);
  const quoteTotal = quoteSource ? quoteQty * quoteSource.pricePerUnit : 0;

  async function generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count } = await supabase.from("fresh_quotations").select("id", { count: "exact", head: true });
    return `WBEF-Q-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
  }

  async function handleGenerateQuote() {
    if (!quoteSource) return;
    if (!quoteForm.customer_name.trim()) {
      alert("Please enter the customer's name");
      return;
    }
    setSavingQuote(true);
    const quote_number = await generateQuoteNumber();
    const { data } = await supabase
      .from("fresh_quotations")
      .insert({
        quote_number,
        calculation_id: quoteSource.calcId,
        product_name: quoteSource.name,
        pack_size_grams: quoteSource.grams,
        price_per_unit: quoteSource.pricePerUnit,
        price_per_kg: quoteSource.pricePerKg,
        quantity_units: quoteQty,
        total_amount: quoteTotal,
        customer_name: quoteForm.customer_name,
        customer_company: quoteForm.customer_company,
        customer_phone: quoteForm.customer_phone,
        customer_email: quoteForm.customer_email,
        customer_address: quoteForm.customer_address,
        payment_terms: quoteForm.payment_terms,
        valid_until: quoteForm.valid_until || null,
        notes: quoteForm.notes,
      })
      .select("*")
      .single();

    setSavingQuote(false);
    setQuoteOpen(false);
    await fetchQuotes();
    if (data) setPreviewQuote(data as FreshQuotation);
  }

  function handlePrint() {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open("", "", "width=900,height=700");
    if (!w) return;
    w.document.write(`<html><head><title>Quotation</title><style>
      body{font-family:Arial,sans-serif;color:#1a1a1a;margin:0;padding:20px}
      table{width:100%;border-collapse:collapse}
      th,td{padding:8px 12px;text-align:left}
      th{background:#f0fdf4}td{border-bottom:1px solid #e2e8f0}
    </style></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ── INPUTS ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">Domestic</span>
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">WBE Fresh Produce Pricing</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  value={inp.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Green Cardamom 6-7mm, 100g pouch"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Purchase Price (per KG)" value={inp.purchase_price_per_kg} onChange={(v) => set("purchase_price_per_kg", v)} />
                <Field label="Pack Size (grams)" value={inp.pack_size_grams} onChange={(v) => set("pack_size_grams", v)} prefix="" suffix="g" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Packing &amp; Handling Costs (per unit)</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Packaging / Pouch Cost" value={inp.packaging_cost} onChange={(v) => set("packaging_cost", v)} />
              <Field label="Sticker / Label Cost" value={inp.sticker_cost} onChange={(v) => set("sticker_cost", v)} />
              <Field label="Manpower / Packing Labour" value={inp.manpower_cost} onChange={(v) => set("manpower_cost", v)} />
              <Field label="Misc / Other" value={inp.misc_cost} onChange={(v) => set("misc_cost", v)} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Margin</h3>
            <Field label="Margin %" value={inp.margin_pct} onChange={(v) => set("margin_pct", v)} prefix="" suffix="%" />
          </div>
        </div>

        {/* ── RESULTS ────────────────────────────────────────── */}
        <div className="space-y-4">
          {!results ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <Leaf size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">Enter purchase price and pack size</p>
              <p className="text-xs text-gray-300 mt-1">Results will appear here</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Cost Breakdown (per unit)</h3>
                <div className="space-y-2">
                  <Row label="Raw Material" value={INR(results.rawCostPerUnit)} />
                  <Row label="Packaging" value={INR(n(inp.packaging_cost))} />
                  <Row label="Sticker / Label" value={INR(n(inp.sticker_cost))} />
                  <Row label="Manpower" value={INR(n(inp.manpower_cost))} />
                  <Row label="Misc" value={INR(n(inp.misc_cost))} />
                  <div className="border-t border-gray-100 pt-2">
                    <Row label="Total Cost per Unit" value={INR(results.costPerUnit)} bold />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl border border-green-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Selling Price</p>
                    <p className="text-xs text-green-500 mt-0.5">Cost + Margin — domestic wholesale/retail</p>
                  </div>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{inp.pack_size_grams}g</span>
                </div>
                <div className="space-y-2">
                  <Row label={`Per Unit (${inp.pack_size_grams}g)`} value={INR(results.sellingPricePerUnit)} bold />
                  <Row label="Per KG equivalent" value={INR(results.pricePerKg)} />
                  <div className="border-t border-green-200 pt-2">
                    <Row label={`Profit per Unit (${inp.margin_pct || 0}%)`} value={INR(results.profitPerUnit)} green />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !inp.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <Save size={15} />
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={openQuoteFromCurrent}
                  disabled={!inp.name.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <FileText size={15} />
                  Generate Quotation
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SAVED CALCULATIONS ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setShowSaved((s) => !s)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h3 className="font-semibold text-gray-900 text-sm">Saved Calculations ({savedCalcs.length})</h3>
          {showSaved ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showSaved &&
          (loadingCalcs ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : savedCalcs.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No saved calculations yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Pack Size</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price / Unit</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Price / KG</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Saved</th>
                    <th className="px-5 py-3 w-28"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {savedCalcs.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 text-right hidden md:table-cell">{c.pack_size_grams}g</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-green-600 text-right">₹{Number(c.selling_price_per_unit).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700 text-right">₹{Number(c.price_per_kg).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => loadCalc(c)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors" title="Load into form">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openQuoteFromSaved(c)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Generate quotation">
                            <FileText size={14} />
                          </button>
                          <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      {/* ── SAVED QUOTATIONS ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => setShowQuotes((s) => !s)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <h3 className="font-semibold text-gray-900 text-sm">Quotations Sent ({savedQuotes.length})</h3>
          {showQuotes ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showQuotes &&
          (loadingQuotes ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : savedQuotes.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No quotations generated yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Quote #</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Product</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Sent</th>
                    <th className="px-5 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {savedQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-semibold text-green-600">{q.quote_number}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-800 hidden md:table-cell">{q.customer_name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden lg:table-cell">{q.product_name}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 text-right">{INR(q.total_amount)}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell">{formatDate(q.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setPreviewQuote(q)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      {/* ── Quotation form modal ──────────────────────────── */}
      <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)} title="Generate Quotation" size="lg">
        {quoteSource && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{quoteSource.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {quoteSource.grams}g pack · ₹{fmt(quoteSource.pricePerUnit)} / unit · ₹{fmt(quoteSource.pricePerKg)} / kg
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  value={quoteForm.customer_name}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, customer_name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Company (optional)</label>
                <input
                  value={quoteForm.customer_company}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, customer_company: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  value={quoteForm.customer_phone}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  value={quoteForm.customer_email}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, customer_email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <input
                value={quoteForm.customer_address}
                onChange={(e) => setQuoteForm((f) => ({ ...f, customer_address: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity (units)</label>
                <input
                  type="number"
                  value={quoteForm.quantity_units}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, quantity_units: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Terms</label>
                <input
                  value={quoteForm.payment_terms}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, payment_terms: e.target.value }))}
                  placeholder="e.g. 50% advance"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={quoteForm.valid_until}
                  onChange={(e) => setQuoteForm((f) => ({ ...f, valid_until: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="text-lg font-bold text-gray-900">{INR(quoteTotal)}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setQuoteOpen(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleGenerateQuote}
                disabled={savingQuote}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {savingQuote ? "Generating..." : "Generate & Preview"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Quotation preview / print ──────────────────────── */}
      {previewQuote && (
        <Modal open={!!previewQuote} onClose={() => setPreviewQuote(null)} title="Quotation Preview" size="2xl">
          <div className="mb-4 flex justify-end gap-2">
            <button onClick={() => setPreviewQuote(null)} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              <X size={15} /> Close
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              <Download size={15} /> Print / Download PDF
            </button>
          </div>
          <div ref={printRef}>
            <QuotationDocument quote={previewQuote} company={company} />
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Calculation" size="sm">
        <p className="text-sm text-gray-600 mb-5">Delete this saved calculation? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ── Print document ─────────────────────────────────────────

function QuotationDocument({ quote, company }: { quote: FreshQuotation; company: CompanyProfile | null }) {
  const companyName = company?.company_name || "WBE Fresh Produce";
  const addressParts = [company?.address, company?.city, company?.state, company?.pincode].filter(Boolean);

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: 13, color: "#1a1a1a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#15803d" }}>{companyName}</div>
          {addressParts.length > 0 && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{addressParts.join(", ")}</div>}
          {(company?.phone || company?.email) && (
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {company?.phone} {company?.phone && company?.email ? " · " : ""} {company?.email}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>QUOTATION</div>
          <div style={{ color: "#15803d", fontWeight: 600, marginTop: 4 }}>{quote.quote_number}</div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Date: {formatDate(quote.created_at)}</div>
          {quote.valid_until && <div style={{ color: "#64748b", fontSize: 12 }}>Valid Until: {formatDate(quote.valid_until)}</div>}
        </div>
      </div>

      <div style={{ background: "#f0fdf4", padding: "12px 16px", borderRadius: 8, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: 6 }}>Quoted To</div>
        <div style={{ fontWeight: 600 }}>{quote.customer_name}</div>
        {quote.customer_company && <div>{quote.customer_company}</div>}
        {quote.customer_address && <div style={{ color: "#475569", fontSize: 12 }}>{quote.customer_address}</div>}
        {quote.customer_phone && <div style={{ color: "#475569", fontSize: 12 }}>{quote.customer_phone}</div>}
        {quote.customer_email && <div style={{ color: "#475569", fontSize: 12 }}>{quote.customer_email}</div>}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ background: "#f0fdf4" }}>
            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Product</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Pack Size</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Rate / Unit</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Qty</th>
            <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "8px 12px", fontWeight: 600 }}>{quote.product_name}</td>
            <td style={{ padding: "8px 12px", textAlign: "right" }}>{quote.pack_size_grams}g</td>
            <td style={{ padding: "8px 12px", textAlign: "right" }}>{INR(quote.price_per_unit)}</td>
            <td style={{ padding: "8px 12px", textAlign: "right" }}>{quote.quantity_units}</td>
            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600 }}>{INR(quote.total_amount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
            <td colSpan={4} style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700 }}>
              TOTAL
            </td>
            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontSize: 15 }}>{INR(quote.total_amount)}</td>
          </tr>
        </tfoot>
      </table>

      {quote.payment_terms && (
        <div style={{ fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: "#64748b" }}>Payment Terms: </span>
          {quote.payment_terms}
        </div>
      )}

      {quote.notes && (
        <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: 6, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{quote.notes}</div>
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: "center", color: "#94a3b8", fontSize: 11, borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
        {companyName} · Computer Generated Quotation · Prices subject to change without prior notice
      </div>
    </div>
  );
}