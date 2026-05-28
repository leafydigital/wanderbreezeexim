import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  CreditCard as Edit2,
  Trash2,
  Package,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { supabase, Supplier } from "../lib/supabase";
import Modal from "../components/Modal";
import { formatCurrency } from "../lib/utils";

interface Product {
  id: string;
  name: string;
  hs_code: string;
  description: string;
  category: string;
  unit: string;
  purchase_price_per_kg: number;
  supplier_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  suppliers?: Supplier;
}

const CATEGORIES = [
  "General",
  "Grains & Cereals",
  "Spices",
  "Pulses & Legumes",
  "Fruits & Vegetables",
  "Oils & Fats",
  "Sugar & Sweeteners",
  "Textiles",
  "Chemicals",
  "Other",
];
const UNITS = ["KG", "MT", "PCS", "BAG", "CTN", "LTR", "TON"];

const emptyForm = {
  name: "",
  hs_code: "",
  description: "",
  category: "General",
  unit: "KG",
  purchase_price_per_kg: "",
  supplier_id: "",
  is_active: true,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterActive, setFilterActive] = useState<
    "all" | "active" | "inactive"
  >("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  async function fetchData() {
    setLoading(true);
    const [prodRes, suppRes] = await Promise.all([
      supabase
        .from("products")
        .select("*, suppliers(id, supplier_name, company_name)")
        .order("name"),
      supabase
        .from("suppliers")
        .select("id, supplier_name, company_name")
        .order("supplier_name"),
    ]);
    setProducts((prodRes.data as Product[]) ?? []);
    setSuppliers((suppRes.data as Supplier[]) ?? []);
    setLoading(false);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Product name required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    // // ADD THIS DEBUG CHECK
    // const {
    //   data: { session },
    // } = await supabase.auth.getSession();
    // console.log("Current session:", session);
    // console.log("User:", session?.user);

    // if (!session) {
    //   console.error("NO SESSION - user is not logged in!");
    //   return;
    // }
    setSaving(true);
    const payload = {
      name: form.name,
      hs_code: form.hs_code,
      description: form.description,
      category: form.category,
      unit: form.unit,
      purchase_price_per_kg: parseFloat(form.purchase_price_per_kg) || 0,
      supplier_id: form.supplier_id || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };
    if (editId) {
      await supabase.from("products").update(payload).eq("id", editId);
    } else {
      await supabase.from("products").insert(payload);
    }
    await fetchData();
    setModalOpen(false);
    setSaving(false);
    resetForm();
  }

  async function handleDelete(id: string) {
    await supabase.from("products").delete().eq("id", id);
    setDeleteId(null);
    fetchData();
  }

  async function toggleActive(p: Product) {
    await supabase
      .from("products")
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    fetchData();
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      hs_code: p.hs_code,
      description: p.description,
      category: p.category,
      unit: p.unit,
      purchase_price_per_kg: String(p.purchase_price_per_kg),
      supplier_id: p.supplier_id ?? "",
      is_active: p.is_active,
    });
    setEditId(p.id);
    setErrors({});
    setModalOpen(true);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditId(null);
    setErrors({});
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.hs_code.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.suppliers as any)?.supplier_name
        ?.toLowerCase()
        .includes(search.toLowerCase());
    const matchCat = filterCat === "all" || p.category === filterCat;
    const matchActive =
      filterActive === "all" ||
      (filterActive === "active" ? p.is_active : !p.is_active);
    return matchSearch && matchCat && matchActive;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">
          {products.filter((p) => p.is_active).length} active products
        </p>
        <button
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, HS code, supplier..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as any)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">
              Add your first product to the catalogue
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Product
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    HS Code
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Supplier
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">
                    Price/KG
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-5 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      !p.is_active ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={15} className="text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-400">{p.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-sm text-gray-600">
                      {p.hs_code || "—"}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      {(p.suppliers as any)?.supplier_name ? (
                        <div>
                          <p className="text-sm text-gray-800">
                            {(p.suppliers as any).supplier_name}
                          </p>
                          {(p.suppliers as any).company_name && (
                            <p className="text-xs text-gray-400">
                              {(p.suppliers as any).company_name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                      {p.purchase_price_per_kg > 0 ? (
                        <span className="text-sm font-semibold text-gray-800">
                          {formatCurrency(p.purchase_price_per_kg)}/kg
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleActive(p)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          p.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {p.is_active ? (
                          <ToggleRight size={13} />
                        ) : (
                          <ToggleLeft size={13} />
                        )}
                        {p.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editId ? "Edit Product" : "Add Product"}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Basmati Rice"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.name ? "border-red-400" : "border-gray-200"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                HS Code
              </label>
              <input
                value={form.hs_code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hs_code: e.target.value }))
                }
                placeholder="e.g. 1006.20"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Unit
              </label>
              <select
                value={form.unit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, unit: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Purchase Price per KG (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={form.purchase_price_per_kg}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      purchase_price_per_kg: e.target.value,
                    }))
                  }
                  className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mapped Supplier
              </label>
              <select
                value={form.supplier_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supplier_id: e.target.value }))
                }
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">No supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplier_name}
                    {s.company_name ? ` (${s.company_name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active_prod"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="w-4 h-4 text-teal-600 border-gray-300 rounded"
            />
            <label htmlFor="is_active_prod" className="text-sm text-gray-700">
              Active (visible in PI/Invoice product selection)
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : editId ? "Update Product" : "Add Product"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Product"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-5">
          Delete this product from the catalogue?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteId && handleDelete(deleteId)}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
