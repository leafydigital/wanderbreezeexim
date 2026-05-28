import { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, Shield, UserCheck, UserX, KeyRound, Phone, Mail, StickyNote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AppUser, Role, useAuth } from '../lib/auth';
import Modal from '../components/Modal';
import { formatDate } from '../lib/utils';

const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callManageUser(action: string, body: Record<string, unknown>) {
  const res = await fetch(`${EDGE_BASE}?action=${action}`, {
    method: action === 'create' ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function callDelete(body: Record<string, unknown>) {
  const res = await fetch(`${EDGE_BASE}?action=delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

const emptyCreate = { name: '', username: '', password: '', email: '', phone: '', role_id: '', notes: '' };
const emptyEdit = { name: '', username: '', email: '', phone: '', role_id: '', is_active: true, notes: '' };
const emptyPass = { password: '', confirm: '' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const [passUser, setPassUser] = useState<AppUser | null>(null);
  const [passForm, setPassForm] = useState(emptyPass);
  const [passError, setPassError] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  async function fetchData() {
    setLoading(true);
    const [usersRes, rolesRes] = await Promise.all([
      supabase
        .from('users')
        .select('id, name, username, email, phone, role_id, is_active, avatar_url, last_login_at, created_at, updated_at, deleted_at, notes, roles(id, name, description, permissions)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('roles').select('*').order('name'),
    ]);
    setUsers((usersRes.data as AppUser[]) ?? []);
    setRoles((rolesRes.data as Role[]) ?? []);
    setLoading(false);
  }

  function openEdit(u: AppUser) {
    setEditUser(u);
    setEditForm({
      name: u.name,
      username: u.username,
      email: u.email ?? '',
      phone: u.phone ?? '',
      role_id: u.role_id ?? '',
      is_active: u.is_active,
      notes: (u as any).notes ?? '',
    });
    setEditError('');
  }

  async function handleCreate() {
    setCreateError('');
    if (!createForm.name.trim() || !createForm.username.trim() || !createForm.password.trim()) {
      setCreateError('Name, username, and password are required');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(createForm.username)) {
      setCreateError('Username can only contain letters, numbers, and underscores');
      return;
    }
    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters');
      return;
    }
    setCreating(true);
    const result = await callManageUser('create', {
      ...createForm,
      role_id: createForm.role_id || null,
      created_by: currentUser?.id ?? null,
    });
    if (result.error) { setCreateError(result.error); setCreating(false); return; }
    await fetchData();
    setCreateOpen(false);
    setCreateForm(emptyCreate);
    setCreating(false);
  }

  async function handleUpdate() {
    if (!editUser) return;
    setEditError('');
    if (!editForm.name.trim() || !editForm.username.trim()) {
      setEditError('Name and username are required');
      return;
    }
    setSaving(true);
    const result = await callManageUser('update', {
      id: editUser.id,
      ...editForm,
      role_id: editForm.role_id || null,
      updated_by: currentUser?.id ?? null,
    });
    if (result.error) { setEditError(result.error); setSaving(false); return; }
    await fetchData();
    setEditUser(null);
    setSaving(false);
  }

  async function handleResetPassword() {
    if (!passUser) return;
    setPassError('');
    if (!passForm.password.trim()) { setPassError('Password is required'); return; }
    if (passForm.password.length < 6) { setPassError('Password must be at least 6 characters'); return; }
    if (passForm.password !== passForm.confirm) { setPassError('Passwords do not match'); return; }
    setSavingPass(true);
    const result = await callManageUser('reset-password', {
      id: passUser.id,
      password: passForm.password,
      updated_by: currentUser?.id ?? null,
    });
    if (result.error) { setPassError(result.error); setSavingPass(false); return; }
    setPassUser(null);
    setPassForm(emptyPass);
    setSavingPass(false);
  }

  async function handleToggleActive(u: AppUser) {
    await callManageUser('update', {
      id: u.id,
      is_active: !u.is_active,
      updated_by: currentUser?.id ?? null,
    });
    fetchData();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await callDelete({ id: deleteId, deleted_by: currentUser?.id ?? null });
    setDeleteId(null);
    setDeleting(false);
    fetchData();
  }

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.roles as any)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setCreateOpen(true); setCreateError(''); setCreateForm(emptyCreate); }}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, username, email, or role..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Shield size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Username</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
                  <th className="px-5 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-700 text-xs font-bold">{(u.name || 'U')[0].toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.name || 'Unnamed'}</p>
                          {(u as any).notes && (
                            <p className="text-xs text-gray-400 truncate max-w-[180px]">{(u as any).notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{u.username}</code>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {u.email && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Mail size={11} className="text-gray-400" />
                            {u.email}
                          </div>
                        )}
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone size={11} className="text-gray-400" />
                            {u.phone}
                          </div>
                        )}
                        {!u.email && !u.phone && <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {(u.roles as any)?.name ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          (u.roles as any).name === 'Admin' ? 'bg-teal-100 text-teal-700' :
                          (u.roles as any).name === 'Staff' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <Shield size={10} />
                          {(u.roles as any).name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">No role</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.is_active ? <UserCheck size={11} /> : <UserX size={11} />}
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-gray-400">
                      {u.last_login_at ? formatDate(u.last_login_at) : <span className="text-gray-300">Never</span>}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-gray-400">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { setPassUser(u); setPassForm(emptyPass); setPassError(''); }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Reset password">
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-md transition-colors ${u.is_active ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
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

      {/* Create User Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Smith" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username *</label>
              <input
                value={createForm.username}
                onChange={e => setCreateForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder="e.g. john_smith"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <p className="text-xs text-gray-400 mt-0.5">Letters, numbers, underscores</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 99999 00000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select value={createForm.role_id} onChange={e => setCreateForm(f => ({ ...f, role_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select role...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><StickyNote size={12} /> Notes</span>
              </label>
              <textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional admin notes..." rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
          </div>
          {createError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{createError}</div>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setCreateOpen(false)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username *</label>
              <input
                value={editForm.username}
                onChange={e => setEditForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select value={editForm.role_id} onChange={e => setEditForm(f => ({ ...f, role_id: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">No role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <input type="checkbox" id="edit_is_active" checked={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 text-teal-600 border-gray-300 rounded" />
              <label htmlFor="edit_is_active" className="text-sm text-gray-700">Active account</label>
            </div>
          </div>
          {editError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{editError}</div>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setEditUser(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={!!passUser} onClose={() => setPassUser(null)} title={`Reset Password — ${passUser?.username}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password *</label>
            <input type="password" value={passForm.password} onChange={e => setPassForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input type="password" value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Re-enter password" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          {passError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{passError}</div>}
          <div className="flex gap-3 pt-1">
            <button onClick={() => setPassUser(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleResetPassword} disabled={savingPass} className="flex-1 bg-amber-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-60">
              {savingPass ? 'Saving...' : 'Reset Password'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove User" size="sm">
        <p className="text-sm text-gray-600 mb-5">This will soft-delete the user. They will no longer be able to log in, but their data is preserved.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60">
            {deleting ? 'Removing...' : 'Remove User'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
