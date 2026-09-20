/**
 * WbeFreshApp.tsx
 * Mounted at /wbe-fresh/* — the common entry point for suppliers, WBE
 * staff, WBE-Fresh customers, and the public price list, sharing the CRM's
 * custom auth (same users/roles tables, same Supabase project).
 *
 * Flow:
 *  - Default (not logged in): public vegetable price list.
 *  - "Login" → the single common /login page (not an embedded form here).
 *  - After login:
 *      Supplier      → supplier price-entry dashboard + suggest-a-vegetable
 *      WBE Staff     → staff dashboard: view prices, create customers, create quotations
 *      WBE Customer  → customer portal: view final prices, place orders
 *      Admin         → chose "Domestic Dashboard" at login -> full admin
 *                       console here (customers, vegetables, quotations,
 *                       bills, users); chose "Export Dashboard" -> /crm.
 *                       Landing here with no choice made yet -> sent to
 *                       /choose-dashboard to pick.
 *      Staff         → plain export CRM staff, always manage from /crm
 *      any other role → sent back to the public price list, signed out
 */
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../crm/lib/auth';
import PublicPrices from './PublicPrices';
import SupplierDashboard from './SupplierDashboard';
import StaffDashboard from './StaffDashboard';
import CustomerPortal from './CustomerPortal';
import AdminFreshConsole from './AdminFreshConsole';

const WBE_FRESH_ROLES = ['Supplier', 'WBE Staff', 'WBE Customer'];

function WbeFreshInner() {
  const { user, role, loading, signOut } = useAuth();
  const dashboardMode = typeof window !== 'undefined' ? sessionStorage.getItem('wbe_dashboard_mode') : null;

  useEffect(() => {
    if (!user || !role) return;
    if (role.name === 'Staff') {
      // Plain export CRM staff manage WBE Fresh from inside the full CRM, not here.
      window.location.href = '/crm';
      return;
    }
    if (role.name === 'Admin' && dashboardMode !== 'domestic') {
      // No explicit choice yet (or they're set to Export) — ask/route them there.
      window.location.href = '/choose-dashboard';
    }
  }, [user, role, dashboardMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && role?.name === 'Admin' && dashboardMode === 'domestic') {
    return <AdminFreshConsole />;
  }

  if (user && role?.name === 'Supplier') {
    return <SupplierDashboard />;
  }

  if (user && role?.name === 'WBE Staff') {
    return <StaffDashboard />;
  }

  if (user && role?.name === 'WBE Customer') {
    return <CustomerPortal />;
  }

  if (user && role && (role.name === 'Staff' || role.name === 'Admin')) {
    // Redirecting via the effect above — show a brief transition screen.
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Redirecting…</p>
        </div>
      </div>
    );
  }

  if (user && role && !WBE_FRESH_ROLES.includes(role.name)) {
    // Logged in but this account has no role for WBE Fresh — bounce back out.
    signOut();
  }

  return <PublicPrices />;
}

export default function WbeFreshApp() {
  return (
    <AuthProvider>
      <WbeFreshInner />
    </AuthProvider>
  );
}
