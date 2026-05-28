/**
 * CRMApp.tsx
 * Self-contained CRM entry point — mounted at /crm/* in the website router.
 * Has its own AuthProvider, Layout, and routing — completely isolated from
 * the website's Header/Footer.
 */
import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import Layout, { Page } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import ProformaInvoices from './pages/ProformaInvoices';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import PricingCalculator from './pages/PricingCalculator';
import Documents from './pages/Documents';
import Products from './pages/Products';
import Users from './pages/Users';
import Roles from './pages/Roles';
import LeadRadar from './pages/LeadRadar';
import './crm.css';
import InactivityWarning from './components/InactivityWarning';

function CRMInner() {
  const { user, loading, can } = useAuth();
  const [activePage, setActivePage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const firstAccessible = (
    ['dashboard','customers','suppliers','products','proforma','invoices',
     'expenses','pricing','documents','leadradar','users','roles'] as Page[]
  ).find(p => can(p));

  const effectivePage = can(activePage) ? activePage : (firstAccessible ?? 'dashboard');

  return (
    <Layout activePage={effectivePage} onNavigate={setActivePage}>
      <div className={effectivePage === 'dashboard'  ? '' : 'hidden'}><Dashboard onNavigate={(p) => setActivePage(p as Page)} /></div>
      <div className={effectivePage === 'customers'  ? '' : 'hidden'}><Customers /></div>
      <div className={effectivePage === 'suppliers'  ? '' : 'hidden'}><Suppliers /></div>
      <div className={effectivePage === 'proforma'   ? '' : 'hidden'}><ProformaInvoices /></div>
      <div className={effectivePage === 'invoices'   ? '' : 'hidden'}><Invoices /></div>
      <div className={effectivePage === 'expenses'   ? '' : 'hidden'}><Expenses /></div>
      <div className={effectivePage === 'pricing'    ? '' : 'hidden'}><PricingCalculator /></div>
      <div className={effectivePage === 'documents'  ? '' : 'hidden'}><Documents /></div>
      <div className={effectivePage === 'products'   ? '' : 'hidden'}><Products /></div>
      <div className={effectivePage === 'users'      ? '' : 'hidden'}><Users /></div>
      <div className={effectivePage === 'roles'      ? '' : 'hidden'}><Roles /></div>
      <div className={effectivePage === 'leadradar'  ? '' : 'hidden'}><LeadRadar /></div>
    </Layout>
  );
}

export default function CRMApp() {
  return (
    <AuthProvider>
      <CRMInner />
      <InactivityWarning />
    </AuthProvider>
  );
}
