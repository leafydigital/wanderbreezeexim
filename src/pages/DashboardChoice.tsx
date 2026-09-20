/**
 * DashboardChoice.tsx
 * Shown once, right after an Admin logs in at /login, and also reachable
 * again from the CRM sidebar ("Switch to Domestic Dashboard") or the
 * WBE-Fresh admin console header ("Switch to Export Dashboard").
 *
 * Export Dashboard   -> /crm (unchanged, export-only — invoices, proforma,
 *                        international customers, LeadRadar, etc.)
 * Domestic Dashboard -> /wbe-fresh, rendered as a full admin console with
 *                        WBE-Fresh customers, vegetables/pricing, quotations,
 *                        bills, and user management.
 *
 * The choice is remembered in sessionStorage (`wbe_dashboard_mode`) so a
 * plain visit to /crm or /wbe-fresh later in the session routes to the same
 * place without asking again; either page also lets the admin switch.
 */
import { Globe2, Leaf } from 'lucide-react';
import { AuthProvider, useAuth } from '../crm/lib/auth';

function DashboardChoiceInner() {
  const { user, role, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || role?.name !== 'Admin') {
    window.location.href = '/login';
    return null;
  }

  function choose(mode: 'export' | 'domestic') {
    sessionStorage.setItem('wbe_dashboard_mode', mode);
    window.location.href = mode === 'export' ? '/crm' : '/wbe-fresh';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl">
        <div className="text-center mb-10">
          <img src="/wander_breeze_exim_logo_-_white.png" alt="Wander Breeze Exim" className="h-16 w-auto mx-auto mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="text-slate-400 text-sm mt-1">Which dashboard would you like to open?</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <button
            onClick={() => choose('export')}
            className="text-left bg-white rounded-2xl shadow-2xl p-7 hover:-translate-y-1 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
              <Globe2 size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Export Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              International customers, proforma invoices, export invoices, quotations, LeadRadar and Outreach Tracker — everything export-related.
            </p>
          </button>

          <button
            onClick={() => choose('domestic')}
            className="text-left bg-white rounded-2xl shadow-2xl p-7 hover:-translate-y-1 transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Leaf size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Domestic Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              WBE Fresh — vegetable pricing, domestic customers, quotations, bills, suppliers, staff and users.
            </p>
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-8">
          You can switch dashboards any time from the sidebar. {' '}
          <button onClick={signOut} className="underline hover:text-slate-300">Sign out</button>
        </p>
      </div>
    </div>
  );
}

export default function DashboardChoice() {
  return (
    <AuthProvider>
      <DashboardChoiceInner />
    </AuthProvider>
  );
}
