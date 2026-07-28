import { useEffect, useRef, useState } from "react";
import {
  Calculator,
  Save,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import { supabase, PricingCalculation } from "../lib/supabase";
import Modal from "../components/Modal";
import { formatDate } from "../lib/utils";

const KG_PER_BAG = 13;

// ── Types ──────────────────────────────────────────────────

type Mode = "sea" | "air";
type LoadType = "port" | "warehouse";
type Bucket = "origin" | "freight" | "insurance";
type Currency = "INR" | "USD";
type ForexCurrency = "USD" | "AED";

interface ShipmentDetails {
  from_location: string;
  mode: Mode;
  type: LoadType;
  to_location: string;
  country: string;
  commodity: string;
  container_type: string;
  container_capacity: "" | "20" | "40";
}

interface ChargeLine {
  id: string;
  label: string;
  bucket: Bucket;
  currency: Currency;
  amount: string;
  gst_pct: string;
  note?: string | null;
}

interface Inputs {
  name: string;
  purchase_price: string;
  quantity_kg: string;
  margin_pct: string;
  usd_rate: string;
  aed_rate: string;
}

interface Results {
  productCost: number;
  originCost: number;
  fobTotal: number;
  profitAmount: number;
  fobWithProfit: number;
  fobPerKg: number;
  fobPerKgUsd: number;
  fobPerKgAed: number;
  fobPerBag: number;
  oceanFreight: number;
  marineInsurance: number;
  cifTotal: number;
  cifWithProfit: number;
  cifPerKg: number;
  cifPerKgUsd: number;
  cifPerKgAed: number;
  cifPerBag: number;
  isCif: boolean;
}

interface RateInfo {
  tt_buy?: number;
  tt_sell?: number;
  as_of?: string | null;
  source?: string;
  error?: string;
}

interface ExtractedQuote {
  forwarder_name: string;
  pol: string | null;
  pod: string | null;
  container_type: string | null;
  exchange_rate_mentioned: number | null;
  validity_date: string | null;
  charges: {
    label: string;
    bucket: Bucket;
    currency: Currency;
    amount: number;
    gst_pct: number;
    note?: string | null;
  }[];
}

const emptyShipment: ShipmentDetails = {
  from_location: "",
  mode: "sea",
  type: "port",
  to_location: "",
  country: "",
  commodity: "",
  container_type: "",
  container_capacity: "",
};

const emptyInputs: Inputs = {
  name: "",
  purchase_price: "",
  quantity_kg: "",
  margin_pct: "",
  usd_rate: "",
  aed_rate: "",
};

function n(s: string | number): number {
  return parseFloat(String(s)) || 0;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function lineTotalInr(line: ChargeLine, usdRate: number): number {
  const amt = n(line.amount);
  const gst = n(line.gst_pct);
  const base = line.currency === "USD" ? amt * (usdRate || 0) : amt;
  return base * (1 + gst / 100);
}

function compute(
  purchasePrice: number,
  qty: number,
  chargeLines: ChargeLine[],
  marginPct: number,
  usdRate: number,
  aedRate: number
): Results | null {
  if (purchasePrice <= 0 || qty <= 0) return null;

  let originInr = 0;
  let freightInr = 0;
  let insuranceInr = 0;
  for (const l of chargeLines) {
    const t = lineTotalInr(l, usdRate);
    if (l.bucket === "freight") freightInr += t;
    else if (l.bucket === "insurance") insuranceInr += t;
    else originInr += t;
  }

  const productCost = purchasePrice * qty;
  const fobTotal = productCost + originInr;
  const profitAmount = fobTotal * (marginPct / 100);
  const fobWithProfit = fobTotal + profitAmount;
  const fobPerKg = fobWithProfit / qty;
  const fobPerBag = fobPerKg * KG_PER_BAG;
  const fobPerKgUsd = usdRate ? fobPerKg / usdRate : 0;
  const fobPerKgAed = aedRate ? fobPerKg / aedRate : 0;

  const isCif = freightInr > 0 || insuranceInr > 0;
  const cifTotal = fobTotal + freightInr + insuranceInr;
  const cifWithProfit = cifTotal * (1 + marginPct / 100);
  const cifPerKg = cifWithProfit / qty;
  const cifPerBag = cifPerKg * KG_PER_BAG;
  const cifPerKgUsd = usdRate ? cifPerKg / usdRate : 0;
  const cifPerKgAed = aedRate ? cifPerKg / aedRate : 0;

  return {
    productCost,
    originCost: originInr,
    fobTotal,
    profitAmount,
    fobWithProfit,
    fobPerKg,
    fobPerKgUsd,
    fobPerKgAed,
    fobPerBag,
    oceanFreight: freightInr,
    marineInsurance: insuranceInr,
    cifTotal,
    cifWithProfit,
    cifPerKg,
    cifPerKgUsd,
    cifPerKgAed,
    cifPerBag,
    isCif,
  };
}

function fmt(val: number, dec = 2): string {
  return val.toLocaleString("en-IN", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function INR(val: number) {
  return "₹" + fmt(val);
}

// Best-effort check that a bank's published rate is today's rate.
// Handles "03-07-2026 09:21 AM" (HDFC) and "July 3,2026 09:21 AM" (Axis) styles.
function isLikelyToday(asOf?: string | null): boolean | null {
  if (!asOf) return null;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthName = monthNames[now.getMonth()];
  return (
    asOf.includes(`${dd}-${mm}-${yyyy}`) ||
    asOf.includes(`${monthName} ${now.getDate()},${yyyy}`) ||
    asOf.includes(`${monthName} ${now.getDate()}, ${yyyy}`)
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

// ── Small presentational helpers ──────────────────────────

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full border border-gray-200 rounded-lg py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
            prefix ? "pl-7" : "pl-3"
          } ${suffix ? "pr-8" : "pr-3"}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  green,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center text-sm ${bold ? "font-semibold" : ""}`}>
      <span className={green ? "text-green-600" : muted ? "text-gray-400" : "text-gray-600"}>{label}</span>
      <span className={green ? "text-green-600" : muted ? "text-gray-400" : "text-gray-900"}>{value}</span>
    </div>
  );
}

function PriceRow({
  label,
  inr,
  usd,
  aed,
  bold,
}: {
  label: string;
  inr: string;
  usd?: string;
  aed?: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center text-sm ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <div className="flex items-center gap-3 text-right">
        <span className="font-semibold">{inr}</span>
        {usd && <span className="text-gray-500">{usd}</span>}
        {aed && <span className="text-gray-500">{aed}</span>}
      </div>
    </div>
  );
}

function ChargeLineEditor({
  lines,
  onChange,
}: {
  lines: ChargeLine[];
  onChange: (lines: ChargeLine[]) => void;
}) {
  function update(id: string, patch: Partial<ChargeLine>) {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function remove(id: string) {
    onChange(lines.filter((l) => l.id !== id));
  }
  function add() {
    onChange([
      ...lines,
      { id: uid(), label: "", bucket: "origin", currency: "INR", amount: "", gst_pct: "18" },
    ]);
  }

  return (
    <div className="space-y-2">
      {lines.length > 0 && (
        <div className="hidden md:grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-400 uppercase px-1">
          <span className="col-span-4">Description</span>
          <span className="col-span-2">Bucket</span>
          <span className="col-span-2">Currency</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-1">GST %</span>
          <span className="col-span-1"></span>
        </div>
      )}
      {lines.map((l) => (
        <div key={l.id} className="grid grid-cols-12 gap-2 items-center">
          <input
            className="col-span-4 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={l.label}
            placeholder="e.g. Ocean Freight"
            onChange={(e) => update(l.id, { label: e.target.value })}
          />
          <select
            className="col-span-2 border border-gray-200 rounded-lg px-1 py-1.5 text-xs bg-white"
            value={l.bucket}
            onChange={(e) => update(l.id, { bucket: e.target.value as Bucket })}
          >
            <option value="origin">Origin</option>
            <option value="freight">Freight</option>
            <option value="insurance">Insurance</option>
          </select>
          <select
            className="col-span-2 border border-gray-200 rounded-lg px-1 py-1.5 text-xs bg-white"
            value={l.currency}
            onChange={(e) => update(l.id, { currency: e.target.value as Currency })}
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
          </select>
          <input
            type="number"
            className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
            value={l.amount}
            onChange={(e) => update(l.id, { amount: e.target.value })}
          />
          <input
            type="number"
            className="col-span-1 border border-gray-200 rounded-lg px-1 py-1.5 text-xs"
            value={l.gst_pct}
            onChange={(e) => update(l.id, { gst_pct: e.target.value })}
          />
          <button
            onClick={() => remove(l.id)}
            className="col-span-1 flex justify-center text-gray-300 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button onClick={add} className="text-xs font-medium text-teal-600 hover:text-teal-700">
        + Add charge line
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function PricingCalculator() {
  const [shipment, setShipment] = useState<ShipmentDetails>(emptyShipment);
  const [inp, setInp] = useState<Inputs>(emptyInputs);
  const [chargeLines, setChargeLines] = useState<ChargeLine[]>([]);
  const [results, setResults] = useState<Results | null>(null);

  // last-quote lookup
  const [lastQuote, setLastQuote] = useState<any | null>(null);
  const [checkingQuote, setCheckingQuote] = useState(false);

  // freight quote capture
  const [quoteMode, setQuoteMode] = useState<"paste" | "file">("paste");
  const [pasteText, setPasteText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedQuote | null>(null);
  const [extractedLines, setExtractedLines] = useState<ChargeLine[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // forex
  const [fetchingRate, setFetchingRate] = useState<Record<ForexCurrency, boolean>>({ USD: false, AED: false });
  const [rateResult, setRateResult] = useState<Record<string, { hdfc?: RateInfo; axis?: RateInfo }>>({});
  const [rateMeta, setRateMeta] = useState<Record<string, { bank: string; as_of?: string | null }>>({});

  const [savedCalcs, setSavedCalcs] = useState<PricingCalculation[]>([]);
  const [loadingCalcs, setLoadingCalcs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewCalc, setViewCalc] = useState<PricingCalculation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    fetchSaved();
  }, []);

  useEffect(() => {
    setResults(
      compute(n(inp.purchase_price), n(inp.quantity_kg), chargeLines, n(inp.margin_pct), n(inp.usd_rate), n(inp.aed_rate))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inp, chargeLines]);

  // ── Auto-check for the last matching quote on this lane ──
  useEffect(() => {
    const required = [shipment.mode, shipment.type, shipment.to_location, shipment.country, shipment.commodity];
    if (shipment.mode === "sea") required.push(shipment.container_type, shipment.container_capacity);
    if (required.some((v) => !v)) {
      setLastQuote(null);
      return;
    }
    const t = setTimeout(async () => {
      setCheckingQuote(true);
      let q = supabase
        .from("freight_quotes")
        .select("*")
        .eq("mode", shipment.mode)
        .eq("type", shipment.type)
        .ilike("to_location", shipment.to_location.trim())
        .ilike("country", shipment.country.trim())
        .ilike("commodity", shipment.commodity.trim());
      if (shipment.mode === "sea") {
        q = q.eq("container_type", shipment.container_type).eq("container_capacity", shipment.container_capacity);
      }
      const { data } = await q.order("quote_date", { ascending: false }).limit(1);
      setLastQuote(data?.[0] ?? null);
      setCheckingQuote(false);
    }, 600);
    return () => clearTimeout(t);
  }, [
    shipment.mode,
    shipment.type,
    shipment.to_location,
    shipment.country,
    shipment.commodity,
    shipment.container_type,
    shipment.container_capacity,
  ]);

  async function fetchSaved() {
    setLoadingCalcs(true);
    const { data } = await supabase.from("pricing_calculations").select("*").order("created_at", { ascending: false });
    setSavedCalcs((data as PricingCalculation[]) ?? []);
    setLoadingCalcs(false);
  }

  function set(key: keyof Inputs, val: string) {
    setInp((prev) => ({ ...prev, [key]: val }));
  }

  function setShip(key: keyof ShipmentDetails, val: string) {
    setShipment((prev) => ({ ...prev, [key]: val }));
  }

  function loadQuote(q: any) {
    const lines: ChargeLine[] = (q.charges ?? []).map((c: any) => ({
      id: uid(),
      label: c.label,
      bucket: c.bucket,
      currency: c.currency,
      amount: String(c.amount ?? 0),
      gst_pct: String(c.gst_pct ?? 0),
      note: c.note ?? null,
    }));
    setChargeLines(lines);
  }

  // ── Freight quote fetch/paste → extraction ────────────────

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  function handlePasteFile(e: React.ClipboardEvent) {
    const item = Array.from(e.clipboardData.items ?? []).find((i) => i.type.startsWith("image/"));
    if (item) {
      const f = item.getAsFile();
      if (f) setFile(f);
    }
  }

  async function handleFetchQuote() {
    setParsing(true);
    setParseError(null);
    setExtracted(null);
    try {
      const context = {
        mode: shipment.mode,
        type: shipment.type,
        from: shipment.from_location,
        to: shipment.to_location,
        country: shipment.country,
        commodity: shipment.commodity,
        container_type: shipment.container_type,
        container_capacity: shipment.container_capacity,
      };
      const payload: any = { context };
      if (quoteMode === "paste") {
        if (!pasteText.trim()) {
          setParseError("Paste the quote text first");
          setParsing(false);
          return;
        }
        payload.rawText = pasteText;
      } else {
        if (!file) {
          setParseError("Choose or drop a file first");
          setParsing(false);
          return;
        }
        payload.fileBase64 = await fileToBase64(file);
        payload.fileMediaType = file.type;
      }

      const { data, error } = await supabase.functions.invoke("parse-freight-quote", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error === "could_not_parse_json" ? "Could not read this quote clearly — try pasting as plain text instead" : data.error);

      const ext = data as ExtractedQuote;
      setExtracted(ext);
      setExtractedLines(
        (ext.charges ?? []).map((c) => ({
          id: uid(),
          label: c.label,
          bucket: c.bucket,
          currency: c.currency,
          amount: String(c.amount),
          gst_pct: String(c.gst_pct),
          note: c.note ?? null,
        }))
      );
    } catch (e: any) {
      setParseError(e?.message ?? "Could not extract this quote — check the text/file and try again");
    } finally {
      setParsing(false);
    }
  }

  async function acceptExtracted() {
    if (!extracted) return;
    setChargeLines((prev) => [...prev, ...extractedLines]);

    const required = [shipment.mode, shipment.type, shipment.to_location, shipment.country, shipment.commodity];
    if (!required.some((v) => !v)) {
      await supabase.from("freight_quotes").insert({
        mode: shipment.mode,
        type: shipment.type,
        from_location: shipment.from_location || extracted.pol || "",
        to_location: shipment.to_location,
        country: shipment.country,
        commodity: shipment.commodity,
        container_type: shipment.container_type || extracted.container_type || null,
        container_capacity: shipment.container_capacity || null,
        forwarder_name: extracted.forwarder_name || "Unknown",
        source_type: quoteMode,
        raw_input: quoteMode === "paste" ? pasteText : null,
        charges: extractedLines.map(({ id, ...rest }) => rest),
        exchange_rate_mentioned: extracted.exchange_rate_mentioned ?? null,
        validity_date: extracted.validity_date || null,
      });
    }

    setExtracted(null);
    setExtractedLines([]);
    setPasteText("");
    setFile(null);
  }

  // ── Forex rates ────────────────────────────────────────────

  async function fetchRate(currency: ForexCurrency) {
    setFetchingRate((s) => ({ ...s, [currency]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("fetch-forex-rates", { body: { currency } });
      if (error) throw error;
      setRateResult((s) => ({ ...s, [currency]: data }));
    } catch (_e) {
      setRateResult((s) => ({
        ...s,
        [currency]: { hdfc: { error: "Could not fetch — enter manually" }, axis: { error: "Could not fetch — enter manually" } },
      }));
    } finally {
      setFetchingRate((s) => ({ ...s, [currency]: false }));
    }
  }

  function useRate(currency: ForexCurrency, bank: "hdfc" | "axis") {
    const r = rateResult[currency]?.[bank];
    if (!r || r.error || !r.tt_buy) return;
    set(currency === "USD" ? "usd_rate" : "aed_rate", String(r.tt_buy));
    setRateMeta((s) => ({ ...s, [currency]: { bank, as_of: r.as_of } }));
  }

  // Warnings
  const warnNegQty = n(inp.quantity_kg) <= 0 && inp.quantity_kg !== "";

  async function handleSave() {
    if (!results) return;
    if (!inp.name.trim()) {
      alert("Please enter a calculation name");
      return;
    }
    setSaving(true);
    await supabase.from("pricing_calculations").insert({
      name: inp.name,
      purchasing_price_per_kg: n(inp.purchase_price),
      total_quantity_kg: n(inp.quantity_kg),
      profit_percentage: n(inp.margin_pct),
      usd_rate: n(inp.usd_rate),
      aed_rate: n(inp.aed_rate),
      origin_cost_mode: "charge_lines",
      local_transport: 0,
      cha_charges: 0,
      cfs_charges: 0,
      thc_charges: 0,
      documentation_charges: 0,
      misc_charges: 0,
      fumigation_charges: 0,
      total_origin_charges: results.originCost,
      ocean_freight: results.oceanFreight,
      marine_insurance: results.marineInsurance,
      insurance_auto_calc: false,
      thc_in_freight: false,
      product_cost: results.productCost,
      origin_cost_total: results.originCost,
      profit_amount_inr: results.profitAmount,
      fob_total_inr: results.fobTotal,
      fob_with_profit_inr: results.fobWithProfit,
      fob_per_kg_inr: results.fobPerKg,
      fob_per_kg_usd: results.fobPerKgUsd,
      fob_per_kg_aed: results.fobPerKgAed,
      fob_per_bag_inr: results.fobPerBag,
      cif_total_inr: results.cifTotal,
      cif_with_profit_inr: results.cifWithProfit,
      cif_per_kg_inr: results.isCif ? results.cifPerKg : 0,
      cif_per_kg_usd: results.isCif ? results.cifPerKgUsd : 0,
      cif_per_kg_aed: results.isCif ? results.cifPerKgAed : 0,
      cif_per_bag_inr: results.isCif ? results.cifPerBag : 0,
      // legacy
      local_transportation: 0,
      logistics_cost: results.oceanFreight,
      miscellaneous_expenses: 0,
      total_expense_inr: results.fobTotal,
      total_bill_inr: results.fobWithProfit,
      // audit trail — requires migration 002 (see deployment notes)
      shipment_details: shipment,
      charge_lines: chargeLines.map(({ id, ...rest }) => rest),
      usd_rate_source: rateMeta.USD?.bank ?? null,
      usd_rate_as_of: rateMeta.USD?.as_of ?? null,
      aed_rate_source: rateMeta.AED?.bank ?? null,
      aed_rate_as_of: rateMeta.AED?.as_of ?? null,
    });
    await fetchSaved();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from("pricing_calculations").delete().eq("id", id);
    setDeleteId(null);
    fetchSaved();
  }

  const usdR = n(inp.usd_rate);
  const aedR = n(inp.aed_rate);
  const showUsd = usdR > 0;
  const showAed = aedR > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* ── INPUTS ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Basic */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Basic</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Calculation Name</label>
                <input
                  value={inp.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Green Cardamom – Han – Hong Kong"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Purchase Price (per KG)" value={inp.purchase_price} onChange={(v) => set("purchase_price", v)} />
                <div>
                  <Field label="Total Quantity (KG)" value={inp.quantity_kg} onChange={(v) => set("quantity_kg", v)} prefix="" />
                  {warnNegQty && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle size={11} /> Quantity must be greater than 0
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Shipment Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="From (POL)" value={shipment.from_location} onChange={(v) => setShip("from_location", v)} placeholder="e.g. Cochin" />
              <SelectField label="Mode" value={shipment.mode} options={[["sea", "Sea"], ["air", "Air"]]} onChange={(v) => setShip("mode", v)} />
              <SelectField label="Type" value={shipment.type} options={[["port", "Port"], ["warehouse", "Warehouse"]]} onChange={(v) => setShip("type", v)} />
              <TextField label="To (POD)" value={shipment.to_location} onChange={(v) => setShip("to_location", v)} placeholder="e.g. Kwai Chung" />
              <TextField label="Country" value={shipment.country} onChange={(v) => setShip("country", v)} placeholder="e.g. Hong Kong" />
              <TextField label="Commodity" value={shipment.commodity} onChange={(v) => setShip("commodity", v)} placeholder="e.g. Green Cardamom" />
              {shipment.mode === "sea" && (
                <>
                  <TextField label="Container Type" value={shipment.container_type} onChange={(v) => setShip("container_type", v)} placeholder="40HQ / 40FT / 20FT" />
                  <SelectField
                    label="Container Capacity"
                    value={shipment.container_capacity}
                    options={[["", "Select"], ["20", "20 FT"], ["40", "40 FT"]]}
                    onChange={(v) => setShip("container_capacity", v)}
                  />
                </>
              )}
            </div>

            {checkingQuote && <p className="text-xs text-gray-400 mt-3">Checking past quotes for this lane…</p>}
            {lastQuote && (
              <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 flex-1">
                  Last quote for this lane: <strong>{lastQuote.forwarder_name}</strong>, dated{" "}
                  {formatDate(lastQuote.quote_date)}.{" "}
                  <button onClick={() => loadQuote(lastQuote)} className="underline font-medium">
                    Load this quote
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Freight Forwarder Quote capture */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Freight Forwarder Quote</h3>
            <p className="text-xs text-gray-400 mb-3">Paste the quote or drop the file — charges get extracted automatically</p>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setQuoteMode("paste")}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg border ${
                  quoteMode === "paste" ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600"
                }`}
              >
                Paste Price
              </button>
              <button
                onClick={() => setQuoteMode("file")}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg border ${
                  quoteMode === "file" ? "bg-teal-600 text-white border-teal-600" : "border-gray-200 text-gray-600"
                }`}
              >
                Upload File
              </button>
            </div>

            {quoteMode === "paste" ? (
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste the forwarder's quote email / WhatsApp text here…"
                className="w-full border border-gray-200 rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onPaste={handlePasteFile}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-xs text-gray-400 cursor-pointer hover:border-teal-300 transition-colors"
              >
                <UploadCloud size={22} className="mx-auto mb-2 text-gray-300" />
                {file ? (
                  <p className="text-gray-700 font-medium">{file.name}</p>
                ) : (
                  <p>Drag &amp; drop a PDF/image here, paste (Ctrl+V), or click to choose a file</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            {parseError && <p className="text-xs text-red-500 mt-2">{parseError}</p>}

            <button
              onClick={handleFetchQuote}
              disabled={parsing}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2 rounded-lg text-xs font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {parsing ? "Extracting…" : "Fetch Charges"}
            </button>

            {extracted && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Extracted from {extracted.forwarder_name || "quote"} — review before adding
                </p>
                <ChargeLineEditor lines={extractedLines} onChange={setExtractedLines} />
                <button
                  onClick={acceptExtracted}
                  className="mt-3 w-full bg-teal-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors"
                >
                  Add these charges to the calculation
                </button>
              </div>
            )}
          </div>

          {/* Charges */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Charges</h3>
            <p className="text-xs text-gray-400 mb-4">
              Origin charges build the FOB price. Freight &amp; Insurance charges are added on top for CIF.
            </p>
            <ChargeLineEditor lines={chargeLines} onChange={setChargeLines} />
          </div>

          {/* Margin & Bank Conversion */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Margin &amp; Bank Conversion Rate</h3>
            <div className="mb-4">
              <Field label="Margin %" value={inp.margin_pct} onChange={(v) => set("margin_pct", v)} prefix="" suffix="%" />
            </div>
            {(["USD", "AED"] as const).map((cur) => (
              <div key={cur} className="border border-gray-100 rounded-lg p-3 mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">1 {cur} = ₹</label>
                  <button
                    onClick={() => fetchRate(cur)}
                    disabled={fetchingRate[cur]}
                    className="flex items-center gap-1 text-xs text-teal-600 font-medium hover:text-teal-700 disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={fetchingRate[cur] ? "animate-spin" : ""} />
                    {fetchingRate[cur] ? "Fetching…" : "Fetch live rate"}
                  </button>
                </div>
                <input
                  type="number"
                  value={cur === "USD" ? inp.usd_rate : inp.aed_rate}
                  onChange={(e) => set(cur === "USD" ? "usd_rate" : "aed_rate", e.target.value)}
                  placeholder={cur === "USD" ? "e.g. 93.52" : "e.g. 25.12"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {rateResult[cur] && (
                  <div className="mt-2 space-y-1">
                    {(["hdfc", "axis"] as const).map((bank) => {
                      const r = rateResult[cur]?.[bank];
                      if (!r) return null;
                      if (r.error) {
                        return (
                          <p key={bank} className="text-[11px] text-gray-400">
                            {bank.toUpperCase()}: {r.error}
                          </p>
                        );
                      }
                      const fresh = isLikelyToday(r.as_of);
                      return (
                        <button
                          key={bank}
                          onClick={() => useRate(cur, bank)}
                          className="w-full flex items-center justify-between text-[11px] px-2 py-1 rounded hover:bg-gray-50 text-left"
                        >
                          <span className="text-gray-500">
                            {bank.toUpperCase()} TT Buy: <strong className="text-gray-800">₹{r.tt_buy}</strong>
                          </span>
                          <span className={fresh === false ? "text-amber-600" : "text-gray-400"}>
                            {r.as_of ?? "—"}
                            {fresh === false ? " (verify — may not be today's rate)" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── RESULTS ────────────────────────────────────────── */}
        <div className="space-y-4">
          {!results ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <Calculator size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">Enter purchase price and quantity</p>
              <p className="text-xs text-gray-300 mt-1">Results will appear here</p>
            </div>
          ) : (
            <>
              {/* Cost Breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Cost Breakdown</h3>
                <div className="space-y-2">
                  <Row label="Product Cost" value={INR(results.productCost)} />
                  <Row label="Total Origin Charges" value={INR(results.originCost)} />
                  <div className="border-t border-gray-100 pt-2">
                    <Row label="FOB Base" value={INR(results.fobTotal)} bold />
                  </div>
                  <Row label={`Margin (${inp.margin_pct || 0}%)`} value={INR(results.profitAmount)} green />
                  {results.isCif && (
                    <div className="border-t border-gray-100 pt-2">
                      <Row label="Freight Charges" value={INR(results.oceanFreight)} />
                      <Row label="Insurance Charges" value={INR(results.marineInsurance)} />
                    </div>
                  )}
                </div>
              </div>

              {/* FOB Result */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">FOB Pricing</p>
                    <p className="text-xs text-blue-400 mt-0.5">Free On Board — excludes freight &amp; insurance</p>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">FOB</span>
                </div>
                {(showUsd || showAed) && (
                  <div className="flex justify-end gap-3 text-xs text-gray-400 mb-1 pr-0.5">
                    <span className="w-20 text-right">INR</span>
                    {showUsd && <span className="w-20 text-right">USD</span>}
                    {showAed && <span className="w-20 text-right">AED</span>}
                  </div>
                )}
                <div className="space-y-2">
                  <PriceRow
                    label="Per KG"
                    inr={`₹${fmt(results.fobPerKg, 4)}`}
                    usd={showUsd ? `$ ${fmt(results.fobPerKgUsd, 4)}` : undefined}
                    aed={showAed ? `AED ${fmt(results.fobPerKgAed, 4)}` : undefined}
                  />
                  <PriceRow
                    label={`Per Bag (${KG_PER_BAG} KG)`}
                    inr={`₹${fmt(results.fobPerBag, 2)}`}
                    usd={showUsd ? `$ ${fmt(results.fobPerBag / usdR, 2)}` : undefined}
                    aed={showAed ? `AED ${fmt(results.fobPerBag / aedR, 2)}` : undefined}
                  />
                  <div className="border-t border-blue-200 pt-2">
                    <PriceRow
                      label="Total FOB Value"
                      inr={`₹${fmt(results.fobWithProfit, 0)}`}
                      usd={showUsd ? `$ ${fmt(results.fobWithProfit / usdR, 2)}` : undefined}
                      aed={showAed ? `AED ${fmt(results.fobWithProfit / aedR, 2)}` : undefined}
                      bold
                    />
                  </div>
                </div>
              </div>

              {/* CIF Result */}
              {results.isCif ? (
                <div className="bg-teal-50 rounded-xl border border-teal-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">CIF Pricing</p>
                      <p className="text-xs text-teal-400 mt-0.5">Cost, Insurance &amp; Freight — FOB + Freight + Insurance</p>
                    </div>
                    <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">CIF</span>
                  </div>
                  {(showUsd || showAed) && (
                    <div className="flex justify-end gap-3 text-xs text-gray-400 mb-1 pr-0.5">
                      <span className="w-20 text-right">INR</span>
                      {showUsd && <span className="w-20 text-right">USD</span>}
                      {showAed && <span className="w-20 text-right">AED</span>}
                    </div>
                  )}
                  <div className="space-y-2">
                    <PriceRow
                      label="Per KG"
                      inr={`₹${fmt(results.cifPerKg, 4)}`}
                      usd={showUsd ? `$ ${fmt(results.cifPerKgUsd, 4)}` : undefined}
                      aed={showAed ? `AED ${fmt(results.cifPerKgAed, 4)}` : undefined}
                    />
                    <PriceRow
                      label={`Per Bag (${KG_PER_BAG} KG)`}
                      inr={`₹${fmt(results.cifPerBag, 2)}`}
                      usd={showUsd ? `$ ${fmt(results.cifPerBag / usdR, 2)}` : undefined}
                      aed={showAed ? `AED ${fmt(results.cifPerBag / aedR, 2)}` : undefined}
                    />
                    <div className="border-t border-teal-200 pt-2">
                      <PriceRow
                        label="Total CIF Value"
                        inr={`₹${fmt(results.cifWithProfit, 0)}`}
                        usd={showUsd ? `$ ${fmt(results.cifWithProfit / usdR, 2)}` : undefined}
                        aed={showAed ? `AED ${fmt(results.cifWithProfit / aedR, 2)}` : undefined}
                        bold
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-center">
                  <p className="text-xs text-gray-400">Add a Freight or Insurance charge line to calculate CIF pricing</p>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !inp.name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Calculation"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── SAVED CALCULATIONS ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowSaved((s) => !s)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-semibold text-gray-900 text-sm">Saved Calculations ({savedCalcs.length})</h3>
          {showSaved ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {showSaved &&
          (loadingCalcs ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : savedCalcs.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No saved calculations yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Qty (KG)</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">FOB / KG</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">CIF / KG</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Saved</th>
                    <th className="px-5 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {savedCalcs.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{c.name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 text-right hidden md:table-cell">
                        {Number(c.total_quantity_kg).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-blue-600 text-right">
                        ₹{Number(c.fob_per_kg_inr).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-teal-600 text-right">
                        {Number(c.cif_per_kg_inr) > 0 ? (
                          `₹${Number(c.cif_per_kg_inr).toFixed(2)}`
                        ) : (
                          <span className="text-gray-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setViewCalc(c)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
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

      {/* View Modal */}
      {viewCalc && (
        <Modal open={!!viewCalc} onClose={() => setViewCalc(null)} title={viewCalc.name} size="xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Inputs</p>
                <Row label="Purchase Price / KG" value={`₹${viewCalc.purchasing_price_per_kg}`} />
                <Row label="Quantity" value={`${Number(viewCalc.total_quantity_kg).toLocaleString()} KG`} />
                <Row label="Total Origin Charges" value={`₹${Number(viewCalc.total_origin_charges ?? 0).toLocaleString()}`} />
                {Number(viewCalc.ocean_freight) > 0 && (
                  <Row label="Freight Charges" value={`₹${Number(viewCalc.ocean_freight).toLocaleString()}`} />
                )}
                {Number(viewCalc.marine_insurance) > 0 && (
                  <Row label="Insurance Charges" value={`₹${Number(viewCalc.marine_insurance).toLocaleString()}`} />
                )}
                <div className="border-t border-gray-200 pt-1.5">
                  <Row label="Margin %" value={`${viewCalc.profit_percentage}%`} />
                  <Row label="USD Rate" value={`₹${viewCalc.usd_rate}`} />
                  <Row label="AED Rate" value={`₹${viewCalc.aed_rate}`} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Cost Summary</p>
                <Row label="Product Cost" value={`₹${Number(viewCalc.product_cost).toLocaleString()}`} />
                <Row label="Origin Costs" value={`₹${Number(viewCalc.origin_cost_total).toLocaleString()}`} />
                <Row label="FOB Base" value={`₹${Number(viewCalc.fob_total_inr).toLocaleString()}`} bold />
                <Row label="Margin" value={`₹${Number(viewCalc.profit_amount_inr).toLocaleString()}`} green />
                <Row label="Total FOB" value={`₹${Number(viewCalc.fob_with_profit_inr).toLocaleString()}`} bold />
                {Number(viewCalc.cif_with_profit_inr) > 0 && (
                  <div className="border-t border-gray-200 pt-1.5">
                    <Row label="Total CIF" value={`₹${Number(viewCalc.cif_with_profit_inr).toLocaleString()}`} bold />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 space-y-1.5 text-sm">
                <p className="text-xs font-bold text-blue-700 uppercase mb-2">FOB</p>
                <Row label="Per KG (INR)" value={`₹${Number(viewCalc.fob_per_kg_inr).toFixed(4)}`} />
                <Row label="Per KG (USD)" value={`$ ${Number(viewCalc.fob_per_kg_usd).toFixed(4)}`} />
                <Row label="Per KG (AED)" value={`AED ${Number(viewCalc.fob_per_kg_aed).toFixed(4)}`} />
                <Row label="Per Bag (INR)" value={`₹${Number(viewCalc.fob_per_bag_inr).toFixed(2)}`} />
              </div>
              {Number(viewCalc.cif_per_kg_inr) > 0 && (
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-100 space-y-1.5 text-sm">
                  <p className="text-xs font-bold text-teal-700 uppercase mb-2">CIF</p>
                  <Row label="Per KG (INR)" value={`₹${Number(viewCalc.cif_per_kg_inr).toFixed(4)}`} />
                  <Row label="Per KG (USD)" value={`$ ${Number(viewCalc.cif_per_kg_usd).toFixed(4)}`} />
                  <Row label="Per KG (AED)" value={`AED ${Number(viewCalc.cif_per_kg_aed).toFixed(4)}`} />
                  <Row label="Per Bag (INR)" value={`₹${Number(viewCalc.cif_per_bag_inr).toFixed(2)}`} />
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Calculation" size="sm">
        <p className="text-sm text-gray-600 mb-5">Delete this saved calculation? This cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteId && handleDelete(deleteId)}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}