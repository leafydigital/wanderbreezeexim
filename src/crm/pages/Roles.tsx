import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Shield, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Role } from '../lib/auth';
import Modal from '../components/Modal';

const ALL_MODULES: { key: string; label: string; description: string }[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'View summary stats and recent activity' },
  { key: 'customers', label: 'Customers', description: 'Manage customer records' },
  { key: 'suppliers', label: 'Suppliers', description: 'Manage supplier records' },
  { key: 'products', label: 'Products', description: 'Manage product catalogue' },
  { key: 'proforma', label: 'Proforma Invoices', description: 'Create and manage PIs' },
  { key: 'invoices', label: 'Invoices', description: 'Create and manage invoices' },
  { key: 'expenses', label: 'Expenses', description: 'Track and manage expenses' },
  { key: 'pricing', label: 'FOB / CIF Pricing', description: 'Use and save pricing calculations' },
  { key: 'documents', label: 'Documents', description: 'Upload and manage export documents' },
  { key: 'users', label: 'User Management', description: 'Manage system users (Admin only)' },
  { key: 'roles', label: 'Role Management', description: 'Manage roles and permissions (Admin only)' },
  { key: 'leadradar',  label: 'LeadRadar', description: 'Search and save company leads'},
];

const emptyPermissions = Object.fromEntries(ALL_MODULES.map(m => [m.key, false]));

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: { ...emptyPermissions } });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRoles();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchRoles(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  async function fetchRoles() {
    setLoading(true);
    const { data } = await supabase.from('roles').select('*').order('name');
    setRoles((data as Role[]) ?? []);
    setLoading(false);
  }

  function openEdit(r: Role) {
    setEditRole(r);
    const perms = { ...emptyPermissions };
    Object.keys(r.permissions).forEach(k => { perms[k] = !!r.permissions[k]; });
    setForm({ name: r.name, description: r.description, permissions: perms });
    setErrors({});
    setModalOpen(true);
  }

  function openAdd() {
    setEditRole(null);
    setForm({ name: '', description: '', permissions: { ...emptyPermissions } });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Role name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      permissions: form.permissions,
      updated_at: new Date().toISOString(),
    };
    if (editRole) {
      await supabase.from('roles').update(payload).eq('id', editRole.id);
    } else {
      await supabase.from('roles').insert(payload);
    }
    await fetchRoles();
    setModalOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await supabase.from('roles').delete().eq('id', id);
    setDeleteId(null);
    fetchRoles();
  }

  function togglePerm(key: string) {
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }));
  }

  function setAll(val: boolean) {
    const perms = Object.fromEntries(ALL_MODULES.map(m => [m.key, val]));
    setForm(f => ({ ...f, permissions: perms }));
  }

  const accessCount = (r: Role) => Object.values(r.permissions).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">{roles.length} roles configured</p>
        <button onClick={openAdd} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus size={16} /> Add Role
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    r.name === 'Admin' ? 'bg-teal-100' : r.name === 'Staff' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Shield size={17} className={r.name === 'Admin' ? 'text-teal-600' : r.name === 'Staff' ? 'text-blue-600' : 'text-gray-500'} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{r.name}</h3>
                    {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(r)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => setDeleteId(r.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Module Access — {accessCount(r)} / {ALL_MODULES.length}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ALL_MODULES.map(m => {
                    const allowed = r.permissions[m.key];
                    return (
                      <div key={m.key} className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${allowed ? 'bg-teal-50 text-teal-700' : 'bg-gray-50 text-gray-400'}`}>
                        {allowed ? <Check size={11} className="flex-shrink-0" /> : <X size={11} className="flex-shrink-0" />}
                        <span className="truncate">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editRole ? `Edit Role: ${editRole.name}` : 'Add Role'} size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role Name *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Manager"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Permissions grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Module Permissions</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setAll(true)} className="text-xs text-teal-600 font-medium hover:text-teal-700">Grant All</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={() => setAll(false)} className="text-xs text-gray-500 font-medium hover:text-gray-700">Revoke All</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_MODULES.map(m => (
                <label
                  key={m.key}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.permissions[m.key]
                      ? 'bg-teal-50 border-teal-200'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!form.permissions[m.key]}
                    onChange={() => togglePerm(m.key)}
                    className="mt-0.5 w-4 h-4 text-teal-600 border-gray-300 rounded"
                  />
                  <div>
                    <p className={`text-sm font-medium ${form.permissions[m.key] ? 'text-teal-800' : 'text-gray-700'}`}>{m.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
              {saving ? 'Saving...' : editRole ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Role" size="sm">
        <p className="text-sm text-gray-600 mb-5">Delete this role? Users assigned to this role will lose their permissions.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
