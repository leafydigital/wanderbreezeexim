/**
 * UnifiedLogin.tsx
 * The one and only login screen — mounted at /login. Replaces the old
 * embedded /crm login form and the /wbe-fresh "Staff / Supplier Login"
 * screen; both now send people here instead.
 *
 * After signing in, redirects by role:
 *   Admin, Staff                       -> /crm
 *   Supplier, WBE Staff, WBE Customer  -> /wbe-fresh
 *   anything else / no role            -> signed back out, error shown
 */
import { useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { AuthProvider, useAuth } from '../crm/lib/auth';

const STORAGE_KEY = 'wbe_session';

const CRM_ROLES = ['Admin', 'Staff'];
const WBE_FRESH_ROLES = ['Supplier', 'WBE Staff', 'WBE Customer'];

function UnifiedLoginInner() {
  const { signIn, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setLoading(true);
    const err = await signIn(username, password);
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    // signIn() writes the signed-in user to sessionStorage synchronously
    // before returning — read it straight back out to decide where to send them.
    let roleName = '';
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      roleName = stored ? (JSON.parse(stored)?.roles?.name ?? '') : '';
    } catch {
      roleName = '';
    }

    if (roleName === 'Admin') {
      // Admin has two homes (export-only CRM vs the full WBE-Fresh domestic
      // console) — ask which one they want rather than guessing.
      sessionStorage.removeItem('wbe_dashboard_mode');
      window.location.href = '/choose-dashboard';
      return;
    }
    if (CRM_ROLES.includes(roleName)) {
      window.location.href = '/crm';
      return;
    }
    if (WBE_FRESH_ROLES.includes(roleName)) {
      window.location.href = '/wbe-fresh';
      return;
    }

    // No role, or a role with no home in either app — don't leave them
    // signed in with nowhere to go.
    setError('This account is not set up for any dashboard. Contact your admin.');
    signOut();
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/wander_breeze_exim_logo_-_white.png"
              alt="Wander Breeze Exim"
              className="h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Wander Breeze Exim</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Sign in to your account</h2>
            <p className="text-xs text-gray-500 mt-0.5">You'll be taken to the right dashboard for your role automatically.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-teal-700 active:bg-teal-800 disabled:opacity-60 transition-colors mt-2 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} Wander Breeze Exim. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function UnifiedLogin() {
  return (
    <AuthProvider>
      <UnifiedLoginInner />
    </AuthProvider>
  );
}
