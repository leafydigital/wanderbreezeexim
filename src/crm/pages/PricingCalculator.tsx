import { useEffect, useState } from "react";
import {
  Calculator,
  Save,
  Eye,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { supabase, PricingCalculation } from "../lib/supabase";
import Modal from "../components/Modal";
import { formatDate } from "../lib/utils";

const KG_PER_BAG = 13;

interface Inputs {
  name: string;
  purchase_price: string;
  quantity_kg: string;
  local_transport: string;
  customs_clearance: string;
  misc_charges: string;
  ocean_freight: string;
  marine_insurance: string;
  profit_pct: string;
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

const empty: Inputs = {
  name: "",
  purchase_price: "",
  quantity_kg: "",
  local_transport: "",
  customs_clearance: "",
  misc_charges: "",
  ocean_freight: "",
  marine_insurance: "",
  profit_pct: "",
  usd_rate: "",
  aed_rate: "",
};

function n(s: string): number {
  return parseFloat(s) || 0;
}

function compute(inp: Inputs): Results | null {
  const purchasePrice = n(inp.purchase_price);
  const qty = n(inp.quantity_kg);
  if (purchasePrice <= 0 || qty <= 0) return null;

  const usdRate = n(inp.usd_rate) || 1;
  const aedRate = n(inp.aed_rate) || 1;
  const profitPct = n(inp.profit_pct);

  const productCost = purchasePrice * qty;
  const originCost =
    n(inp.local_transport) + n(inp.customs_clearance) + n(inp.misc_charges);
  const fobTotal = productCost + originCost;
  const profitAmount = fobTotal * (profitPct / 100);
  const fobWithProfit = fobTotal + profitAmount;
  const fobPerKg = fobWithProfit / qty;
  const fobPerBag = fobPerKg * KG_PER_BAG;
  const fobPerKgUsd = fobPerKg / usdRate;
  const fobPerKgAed = fobPerKg / aedRate;

  const oceanFreight = n(inp.ocean_freight);
  const marineInsurance = n(inp.marine_insurance);
  const isCif = oceanFreight > 0 || marineInsurance > 0;

  const cifTotal = fobTotal + oceanFreight + marineInsurance;
  const cifWithProfit = cifTotal * (1 + profitPct / 100);
  const cifPerKg = cifWithProfit / qty;
  const cifPerBag = cifPerKg * KG_PER_BAG;
  const cifPerKgUsd = cifPerKg / usdRate;
  const cifPerKgAed = cifPerKg / aedRate;

  return {
    productCost,
    originCost,
    fobTotal,
    profitAmount,
    fobWithProfit,
    fobPerKg,
    fobPerKgUsd,
    fobPerKgAed,
    fobPerBag,
    oceanFreight,
    marineInsurance,
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

function Field({
  label,
  value,
  onChange,
  prefix = "₹",
  suffix,
  placeholder = "0",
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
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
    <div
      className={`flex justify-between items-center text-sm ${
        bold ? "font-semibold" : ""
      }`}
    >
      <span
        className={
          green ? "text-green-600" : muted ? "text-gray-400" : "text-gray-600"
        }
      >
        {label}
      </span>
      <span
        className={
          green ? "text-green-600" : muted ? "text-gray-400" : "text-gray-900"
        }
      >
        {value}
      </span>
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
    <div
      className={`flex justify-between items-center text-sm ${
        bold ? "font-semibold" : ""
      }`}
    >
      <span>{label}</span>
      <div className="flex items-center gap-3 text-right">
        <span className="font-semibold">{inr}</span>
        {usd && <span className="text-gray-500">{usd}</span>}
        {aed && <span className="text-gray-500">{aed}</span>}
      </div>
    </div>
  );
}

export default function PricingCalculator() {
  const [inp, setInp] = useState<Inputs>(empty);
  const [results, setResults] = useState<Results | null>(null);
  const [savedCalcs, setSavedCalcs] = useState<PricingCalculation[]>([]);
  const [loadingCalcs, setLoadingCalcs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewCalc, setViewCalc] = useState<PricingCalculation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    fetchSaved();
  }, []);

  async function fetchSaved() {
    setLoadingCalcs(true);
    const { data } = await supabase
      .from("pricing_calculations")
      .select("*")
      .order("created_at", { ascending: false });
    setSavedCalcs((data as PricingCalculation[]) ?? []);
    setLoadingCalcs(false);
  }

  function set(key: keyof Inputs, val: string) {
    const updated = { ...inp, [key]: val };
    setInp(updated);
    setResults(compute(updated));
  }

  // Warnings
  const freightEntered = n(inp.ocean_freight) > 0;
  const insuranceEntered = n(inp.marine_insurance) > 0;
  const warnNoInsurance = freightEntered && !insuranceEntered;
  const warnNoFreight = insuranceEntered && !freightEntered;
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
      profit_percentage: n(inp.profit_pct),
      usd_rate: n(inp.usd_rate),
      aed_rate: n(inp.aed_rate),
      origin_cost_mode: "detailed",
      local_transport: n(inp.local_transport),
      cha_charges: n(inp.customs_clearance),
      cfs_charges: 0,
      thc_charges: 0,
      documentation_charges: 0,
      misc_charges: n(inp.misc_charges),
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
      local_transportation: n(inp.local_transport),
      logistics_cost: n(inp.ocean_freight),
      miscellaneous_expenses: n(inp.misc_charges),
      total_expense_inr: results.fobTotal,
      total_bill_inr: results.fobWithProfit,
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Basic
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Calculation Name
                </label>
                <input
                  value={inp.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Coconut – Dubai May 2026"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Purchase Price (per KG)"
                  value={inp.purchase_price}
                  onChange={(v) => set("purchase_price", v)}
                />
                <div>
                  <Field
                    label="Total Quantity (KG)"
                    value={inp.quantity_kg}
                    onChange={(v) => set("quantity_kg", v)}
                    prefix=""
                  />
                  {warnNegQty && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle size={11} /> Quantity must be greater than
                      0
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Origin / FOB Costs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                FOB
              </span>
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Origin Costs
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              All charges incurred at origin, up to the port of loading
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Local Transportation (INR)"
                value={inp.local_transport}
                onChange={(v) => set("local_transport", v)}
              />
              <div>
                <Field
                  label="Customs & Clearance Charges (INR)"
                  value={inp.customs_clearance}
                  onChange={(v) => set("customs_clearance", v)}
                  prefix=""
                />
               
              </div>
              {/* <Field
                label="Local Transportation (INR)"
                value={inp.local_transport}
                onChange={(v) => set("local_transport", v)}
              />
              <Field
                label="Customs & Clearance Charges (INR)"
                value={inp.customs_clearance}
                onChange={(v) => set("customs_clearance", v)}
                hint="Includes CHA, CFS, THC, documentation, BL, port handling, stuffing, etc."
              /> */}
              <Field
                label="Miscellaneous Charges (INR)"
                value={inp.misc_charges}
                onChange={(v) => set("misc_charges", v)}
                hint="Certification, fumigation, or any other extra charges"
              />
            </div>
          </div>

          {/* CIF Costs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                CIF
              </span>
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                CIF Additional Costs
              </h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Leave both empty for FOB-only calculation
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Ocean Freight (INR)"
                value={inp.ocean_freight}
                onChange={(v) => set("ocean_freight", v)}
              />
              <Field
                label="Marine Insurance (INR)"
                value={inp.marine_insurance}
                onChange={(v) => set("marine_insurance", v)}
              />
            </div>
            {warnNoInsurance && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                <AlertTriangle
                  size={14}
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-700">
                  Freight is entered but Marine Insurance is 0. Consider adding
                  insurance for a complete CIF price.
                </p>
              </div>
            )}
            {warnNoFreight && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                <AlertTriangle
                  size={14}
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-700">
                  Insurance is entered but Ocean Freight is 0. CIF typically
                  requires both.
                </p>
              </div>
            )}
          </div>

          {/* Business */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Business & Currency
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Field
                label="Profit %"
                value={inp.profit_pct}
                onChange={(v) => set("profit_pct", v)}
                prefix=""
                suffix="%"
                placeholder="0"
              />
              <Field
                label="1 USD = ₹"
                value={inp.usd_rate}
                onChange={(v) => set("usd_rate", v)}
                prefix=""
                placeholder="e.g. 83.50"
              />
              <Field
                label="1 AED = ₹"
                value={inp.aed_rate}
                onChange={(v) => set("aed_rate", v)}
                prefix=""
                placeholder="e.g. 22.70"
              />
            </div>
          </div>
        </div>

        {/* ── RESULTS ────────────────────────────────────────── */}
        <div className="space-y-4">
          {!results ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <Calculator size={40} className="text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-400">
                Enter purchase price and quantity
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Results will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Cost Breakdown */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Cost Breakdown
                </h3>
                <div className="space-y-2">
                  <Row label="Product Cost" value={INR(results.productCost)} />
                  <Row
                    label="Total Origin Costs"
                    value={INR(results.originCost)}
                  />
                  <div className="border-t border-gray-100 pt-2">
                    <Row label="FOB Base" value={INR(results.fobTotal)} bold />
                  </div>
                  <Row
                    label={`Profit (${inp.profit_pct || 0}%)`}
                    value={INR(results.profitAmount)}
                    green
                  />
                  {results.isCif && (
                    <>
                      <div className="border-t border-gray-100 pt-2">
                        <Row
                          label="Ocean Freight"
                          value={INR(results.oceanFreight)}
                        />
                        <Row
                          label="Marine Insurance"
                          value={INR(results.marineInsurance)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* FOB Result */}
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      FOB Pricing
                    </p>
                    <p className="text-xs text-blue-400 mt-0.5">
                      Free On Board — excludes freight &amp; insurance
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                    FOB
                  </span>
                </div>

                {/* Currency header */}
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
                    usd={
                      showUsd ? `$ ${fmt(results.fobPerKgUsd, 4)}` : undefined
                    }
                    aed={
                      showAed ? `AED ${fmt(results.fobPerKgAed, 4)}` : undefined
                    }
                  />
                  <PriceRow
                    label={`Per Bag (${KG_PER_BAG} KG)`}
                    inr={`₹${fmt(results.fobPerBag, 2)}`}
                    usd={
                      showUsd
                        ? `$ ${fmt(results.fobPerBag / usdR, 2)}`
                        : undefined
                    }
                    aed={
                      showAed
                        ? `AED ${fmt(results.fobPerBag / aedR, 2)}`
                        : undefined
                    }
                  />
                  <div className="border-t border-blue-200 pt-2">
                    <PriceRow
                      label="Total FOB Value"
                      inr={`₹${fmt(results.fobWithProfit, 0)}`}
                      usd={
                        showUsd
                          ? `$ ${fmt(results.fobWithProfit / usdR, 2)}`
                          : undefined
                      }
                      aed={
                        showAed
                          ? `AED ${fmt(results.fobWithProfit / aedR, 2)}`
                          : undefined
                      }
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
                      <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                        CIF Pricing
                      </p>
                      <p className="text-xs text-teal-400 mt-0.5">
                        Cost, Insurance &amp; Freight — FOB + Ocean + Insurance
                      </p>
                    </div>
                    <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full">
                      CIF
                    </span>
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
                      usd={
                        showUsd ? `$ ${fmt(results.cifPerKgUsd, 4)}` : undefined
                      }
                      aed={
                        showAed
                          ? `AED ${fmt(results.cifPerKgAed, 4)}`
                          : undefined
                      }
                    />
                    <PriceRow
                      label={`Per Bag (${KG_PER_BAG} KG)`}
                      inr={`₹${fmt(results.cifPerBag, 2)}`}
                      usd={
                        showUsd
                          ? `$ ${fmt(results.cifPerBag / usdR, 2)}`
                          : undefined
                      }
                      aed={
                        showAed
                          ? `AED ${fmt(results.cifPerBag / aedR, 2)}`
                          : undefined
                      }
                    />
                    <div className="border-t border-teal-200 pt-2">
                      <PriceRow
                        label="Total CIF Value"
                        inr={`₹${fmt(results.cifWithProfit, 0)}`}
                        usd={
                          showUsd
                            ? `$ ${fmt(results.cifWithProfit / usdR, 2)}`
                            : undefined
                        }
                        aed={
                          showAed
                            ? `AED ${fmt(results.cifWithProfit / aedR, 2)}`
                            : undefined
                        }
                        bold
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-center">
                  <p className="text-xs text-gray-400">
                    Enter Ocean Freight or Marine Insurance to calculate CIF
                    pricing
                  </p>
                </div>
              )}

              {/* Save */}
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
          <h3 className="font-semibold text-gray-900 text-sm">
            Saved Calculations ({savedCalcs.length})
          </h3>
          {showSaved ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>
        {showSaved &&
          (loadingCalcs ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : savedCalcs.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No saved calculations yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                      Qty (KG)
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                      FOB / KG
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                      CIF / KG
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                      Saved
                    </th>
                    <th className="px-5 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {savedCalcs.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                        {c.name}
                      </td>
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
                      <td className="px-5 py-3.5 text-xs text-gray-400 hidden lg:table-cell">
                        {formatDate(c.created_at)}
                      </td>
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
        <Modal
          open={!!viewCalc}
          onClose={() => setViewCalc(null)}
          title={viewCalc.name}
          size="xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Inputs
                </p>
                <Row
                  label="Purchase Price / KG"
                  value={`₹${viewCalc.purchasing_price_per_kg}`}
                />
                <Row
                  label="Quantity"
                  value={`${Number(
                    viewCalc.total_quantity_kg
                  ).toLocaleString()} KG`}
                />
                <Row
                  label="Local Transport"
                  value={`₹${Number(
                    viewCalc.local_transport ?? 0
                  ).toLocaleString()}`}
                />
                <Row
                  label="Customs & Clearance"
                  value={`₹${Number(
                    viewCalc.cha_charges ?? 0
                  ).toLocaleString()}`}
                />
                <Row
                  label="Miscellaneous"
                  value={`₹${Number(
                    viewCalc.misc_charges ?? 0
                  ).toLocaleString()}`}
                />
                {Number(viewCalc.ocean_freight) > 0 && (
                  <Row
                    label="Ocean Freight"
                    value={`₹${Number(
                      viewCalc.ocean_freight
                    ).toLocaleString()}`}
                  />
                )}
                {Number(viewCalc.marine_insurance) > 0 && (
                  <Row
                    label="Marine Insurance"
                    value={`₹${Number(
                      viewCalc.marine_insurance
                    ).toLocaleString()}`}
                  />
                )}
                <div className="border-t border-gray-200 pt-1.5">
                  <Row
                    label="Profit %"
                    value={`${viewCalc.profit_percentage}%`}
                  />
                  <Row label="USD Rate" value={`₹${viewCalc.usd_rate}`} />
                  <Row label="AED Rate" value={`₹${viewCalc.aed_rate}`} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Cost Summary
                </p>
                <Row
                  label="Product Cost"
                  value={`₹${Number(viewCalc.product_cost).toLocaleString()}`}
                />
                <Row
                  label="Origin Costs"
                  value={`₹${Number(
                    viewCalc.origin_cost_total
                  ).toLocaleString()}`}
                />
                <Row
                  label="FOB Base"
                  value={`₹${Number(viewCalc.fob_total_inr).toLocaleString()}`}
                  bold
                />
                <Row
                  label="Profit"
                  value={`₹${Number(
                    viewCalc.profit_amount_inr
                  ).toLocaleString()}`}
                  green
                />
                <Row
                  label="Total FOB"
                  value={`₹${Number(
                    viewCalc.fob_with_profit_inr
                  ).toLocaleString()}`}
                  bold
                />
                {Number(viewCalc.cif_with_profit_inr) > 0 && (
                  <div className="border-t border-gray-200 pt-1.5">
                    <Row
                      label="Total CIF"
                      value={`₹${Number(
                        viewCalc.cif_with_profit_inr
                      ).toLocaleString()}`}
                      bold
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 space-y-1.5 text-sm">
                <p className="text-xs font-bold text-blue-700 uppercase mb-2">
                  FOB
                </p>
                <Row
                  label="Per KG (INR)"
                  value={`₹${Number(viewCalc.fob_per_kg_inr).toFixed(4)}`}
                />
                <Row
                  label="Per KG (USD)"
                  value={`$ ${Number(viewCalc.fob_per_kg_usd).toFixed(4)}`}
                />
                <Row
                  label="Per KG (AED)"
                  value={`AED ${Number(viewCalc.fob_per_kg_aed).toFixed(4)}`}
                />
                <Row
                  label="Per Bag (INR)"
                  value={`₹${Number(viewCalc.fob_per_bag_inr).toFixed(2)}`}
                />
              </div>
              {Number(viewCalc.cif_per_kg_inr) > 0 && (
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-100 space-y-1.5 text-sm">
                  <p className="text-xs font-bold text-teal-700 uppercase mb-2">
                    CIF
                  </p>
                  <Row
                    label="Per KG (INR)"
                    value={`₹${Number(viewCalc.cif_per_kg_inr).toFixed(4)}`}
                  />
                  <Row
                    label="Per KG (USD)"
                    value={`$ ${Number(viewCalc.cif_per_kg_usd).toFixed(4)}`}
                  />
                  <Row
                    label="Per KG (AED)"
                    value={`AED ${Number(viewCalc.cif_per_kg_aed).toFixed(4)}`}
                  />
                  <Row
                    label="Per Bag (INR)"
                    value={`₹${Number(viewCalc.cif_per_bag_inr).toFixed(2)}`}
                  />
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Calculation"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-5">
          Delete this saved calculation? This cannot be undone.
        </p>
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
