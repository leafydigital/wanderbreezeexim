/**
 * AdminFreshConsole.tsx
 * The "Domestic Dashboard" — a full admin console for WBE Fresh, rendered
 * at /wbe-fresh when an Admin has chosen it (see DashboardChoice.tsx).
 *
 * Unlike StaffDashboard/CustomerPortal (restricted, role-specific views),
 * this gives the Admin everything: the analytics dashboard, vegetable
 * pricing/catalog management, WBE-Fresh customers, quotations, bills, and
 * user management — reusing the same page components the CRM uses, just
 * mounted here instead of inside /crm's Layout.
 */
import { useState } from 'react';
import { Leaf, LogOut, LayoutDashboard, ShoppingBasket, Users as UsersIcon, ClipboardList, Receipt, UserCog, Globe2 } from 'lucide-react';
import { useAuth } from '../crm/lib/auth';
import WbeFreshDashboard from '../crm/pages/WbeFreshDashboard';
import Vegetables from '../crm/pages/Vegetables';
import Buyers from '../crm/pages/Buyers';
import Invoices from '../crm/pages/Invoices';
import Users from '../crm/pages/Users';
import QuotationsList from './QuotationsList';
import QuotationModal from './QuotationModal';

type Tab = 'dashboard' | 'vegetables' | 'customers' | 'quotations' | 'bills' | 'users';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'customers',  label: 'Customers',  icon: UsersIcon },
  { id: 'vegetables', label: 'Vegetables', icon: ShoppingBasket },
  { id: 'quotations', label: 'Quotations', icon: ClipboardList },
  { id: 'bills',      label: 'Bills',      icon: Receipt },
  { id: 'users',      label: 'Users',      icon: UserCog },
];

export default function AdminFreshConsole() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function switchToExport() {
    sessionStorage.setItem('wbe_dashboard_mode', 'export');
    window.location.href = '/crm';
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-slate-900 text-white flex-shrink-0 min-h-screen sticky top-0">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight text-white">WBE Fresh</div>
            <div className="text-slate-400 text-xs">Domestic Dashboard</div>
          </div>
        </div>

        <nav className="p-3 space-y-0.5 flex-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-700 p-3 space-y-2">
          <button onClick={switchToExport} className="w-full flex items-center justify-center gap-2 text-xs font-medium text-teal-300 bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors">
            <Globe2 size={13} /> Switch to Export Dashboard
          </button>
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{(user?.name || 'A')[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">Admin</p>
            </div>
            <button onClick={signOut} className="text-slate-400 hover:text-red-400 flex-shrink-0" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Leaf size={16} className="text-amber-400" />
            <span className="font-semibold text-sm">WBE Fresh Admin</span>
          </div>
          <button onClick={signOut} className="text-slate-300"><LogOut size={16} /></button>
        </header>
        <div className="lg:hidden bg-white border-b border-gray-200 px-2 py-2 flex gap-1 overflow-x-auto sticky top-[49px] z-10">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {tab === 'dashboard' && <WbeFreshDashboard />}
          {tab === 'customers' && <Buyers />}
          {tab === 'vegetables' && <Vegetables />}
          {tab === 'quotations' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setQuoteOpen(true)}
                  className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  <ClipboardList size={15} /> New Quotation
                </button>
              </div>
              <QuotationsList viewer="staff" refreshKey={refreshKey} />
            </div>
          )}
          {tab === 'bills' && <Invoices scope="domestic" />}
          {tab === 'users' && <Users table="wbefresh_users" />}
        </main>
      </div>

      <QuotationModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        mode="staff"
        onCreated={() => { setRefreshKey(k => k + 1); setQuoteOpen(false); }}
      />
    </div>
  );
}
