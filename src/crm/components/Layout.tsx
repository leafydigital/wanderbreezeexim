import { useState } from 'react';
import {
  LayoutDashboard, Users, Truck, FileText, Receipt,
  DollarSign, Calculator, FolderOpen, Menu, X,
  ChevronRight, Package, Shield, UserCog, LogOut, ChevronDown,
  type LucideIcon,
  Radar, Network, AlertTriangle, Search,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useGuardedSignOut } from './InactivityWarning';

export type Page =
  | 'dashboard'
  | 'customers'
  | 'suppliers'
  | 'proforma'
  | 'invoices'
  | 'expenses'
  | 'pricing'
  | 'documents'
  | 'products'
  | 'users'
  | 'roles'
  | 'leadradar'
  | 'outreachtracker';

interface LayoutProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: Page;
  label: string;
  icon: LucideIcon;
  module: string;
  adminOnly?: boolean;
  group?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  { id: 'customers', label: 'Customers', icon: Users, module: 'customers' },
  { id: 'suppliers', label: 'Suppliers', icon: Truck, module: 'suppliers' },
  { id: 'products', label: 'Products', icon: Package, module: 'products' },
  { id: 'proforma', label: 'Proforma Invoices', icon: FileText, module: 'proforma' },
  { id: 'invoices', label: 'Invoices', icon: Receipt, module: 'invoices' },
  { id: 'expenses', label: 'Expenses', icon: DollarSign, module: 'expenses' },
  { id: 'pricing', label: 'FOB / CIF Pricing', icon: Calculator, module: 'pricing' },
  { id: 'documents', label: 'Documents', icon: FolderOpen, module: 'documents' },
  { id: 'users', label: 'User Management', icon: UserCog, module: 'users' },
  { id: 'roles', label: 'Role Management', icon: Shield, module: 'roles' },
  { id: 'leadradar',        label: 'LeadRadar',        icon: Radar,   module: 'leadradar'        },
  { id: 'outreachtracker', label: 'Outreach Tracker', icon: Network, module: 'outreachtracker'  },
];

export default function Layout({ activePage, onNavigate, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, role, can } = useAuth();
  const { guardedSignOut, showModal, setShowModal } = useGuardedSignOut();
  const { signOut } = useAuth();

  const activeItem = navItems.find(n => n.id === activePage);
  const visibleItems = navItems.filter(n => can(n.module));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 transform transition-transform duration-300 flex flex-col
        lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3 flex-shrink-0">
          <img
            src="/wander_breeze_exim_logo_-_white.png"
            alt="Wander Breeze Exim"
            className="h-9 w-auto flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight text-white">Wander Breeze Exim</div>
            {/* <div className="text-teal-400 text-xs font-medium">Exim</div> */}
          </div>
          <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-0.5 mt-2 flex-1 overflow-y-auto">
          {/* Main modules */}
          <div className="mb-3">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Main</p>
            {visibleItems.filter(n => !['users', 'roles'].includes(n.id)).map(({ id, label, icon: Icon }) => {
              const active = activePage === id;
              return (
                <button
                  key={id}
                  onClick={() => { onNavigate(id); setSidebarOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                    ${active ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span>{label}</span>
                  {active && <ChevronRight size={13} className="ml-auto" />}
                </button>
              );
            })}
          </div>

          {/* Admin modules */}
          {visibleItems.some(n => ['users', 'roles'].includes(n.id)) && (
            <div>
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Administration</p>
              {visibleItems.filter(n => ['users', 'roles'].includes(n.id)).map(({ id, label, icon: Icon }) => {
                const active = activePage === id;
                return (
                  <button
                    key={id}
                    onClick={() => { onNavigate(id); setSidebarOpen(false); }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                      ${active ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    <Icon size={16} className="flex-shrink-0" />
                    <span>{label}</span>
                    {active && <ChevronRight size={13} className="ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-700 p-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{(user?.name || 'U')[0].toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{role?.name ?? 'No role'}</p>
            </div>
            <button onClick={guardedSignOut} className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{activeItem?.label ?? ''}</h1>

          {/* User menu (mobile/desktop top bar) */}
          <div className="ml-auto relative">
            <button
              onClick={() => setUserMenuOpen(s => !s)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <div className="w-7 h-7 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{(user?.name || 'U')[0].toUpperCase()}</span>
              </div>
              <span className="hidden sm:block font-medium">{user?.name || 'User'}</span>
              <ChevronDown size={14} className="hidden sm:block" />
            </button>
            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500">{role?.name ?? 'No role'}</p>
                  </div>
                  <button
                    onClick={() => { guardedSignOut(); setUserMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* ── Sign-out guard modal — shown when search is running ── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px 28px',
            maxWidth: 420, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)', textAlign: 'center',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', background: '#FEF3C7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <AlertTriangle size={28} color="#D97706" />
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 700, color: '#111', marginBottom: 10 }}>
              Sign out while search is running?
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 8, lineHeight: 1.65 }}>
              A <strong>lead search is currently in progress</strong>. Signing out now will cancel it and you'll lose the results found so far.
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 28 }}>
              Export or save your results first, or wait for the search to finish.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 8,
                  border: '1px solid #E5E7EB', background: '#fff',
                  color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <Search size={14} /> Keep Searching
              </button>
              <button
                onClick={() => { setShowModal(false); signOut(); }}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 8, border: 'none',
                  background: '#DC2626', color: '#fff', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <LogOut size={14} /> Sign Out Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
