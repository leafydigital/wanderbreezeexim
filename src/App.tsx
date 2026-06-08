import React, { useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import DynamicProductPage from './DynamicProductPage';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import ScrollToTop from './components/ScrollToTop';

import Hero from './components/Hero';
import Products from './pages/Products';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import PaymentTerms from './pages/PaymentTerms';
import NotFound from './NotFound';
import SweetPotato from './pages/Products/Sweet-Potato';
import YellowPumpkin from './pages/Products/Yellow-Pumpkin';
import CocoPeats from './pages/Products/Coco-Peats';
import Coconut from './pages/Products/Coconuts';
import Onion from './pages/Products/Onion';
import Cardamom from './pages/Products/Cardamom';
import Banana from './pages/Products/Banana';
import BlackPepper from './pages/Products/Pepper';
import ThankYou from './pages/ThankYou';
import Reports from './components/Reports';
import Packing from './components/Packaging';
import About from './components/About';
import CoconutExportFromIndia from './pages/CoconutExportFromIndia';
import CardamomExportFromIndia from './pages/CardamomExportFromIndia';
import BlackPepperExportFromIndia from './pages/BlackPepperExportFromIndia';

// Lazy-load the CRM — only downloaded when user visits /crm
// This keeps the website bundle small
const CRMApp = lazy(() => import('./crm/CRMApp'));

function HomePage() {
  const sectionRefs = {
    home: useRef<HTMLDivElement>(null),
    about: useRef<HTMLDivElement>(null),
    products: useRef<HTMLDivElement>(null),
    certifications: useRef<HTMLDivElement>(null),
    reports: useRef<HTMLDivElement>(null),
    packing: useRef<HTMLDivElement>(null),
    paymentterms: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (section: string) => {
    const ref = sectionRefs[section as keyof typeof sectionRefs];
    if (ref?.current) ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div ref={sectionRefs.home}><Hero onNavigate={scrollToSection} /></div>
      <div ref={sectionRefs.about}><About /></div>
      <div ref={sectionRefs.products}><Products /></div>
      <div ref={sectionRefs.certifications}><Certifications /></div>
      <div ref={sectionRefs.reports}><Reports /></div>
      <div ref={sectionRefs.packing}><Packing /></div>
      <div ref={sectionRefs.paymentterms}><PaymentTerms /></div>
      <div ref={sectionRefs.contact}><Contact /></div>
    </>
  );
}

// Website layout wrapper — Header + Footer + WhatsApp
function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <WhatsAppFloat />
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>

        {/* ── CRM — no website header/footer, full takeover ── */}
        <Route
          path="/crm/*"
          element={
            <Suspense fallback={
              <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, border: '4px solid #14b8a6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ color: '#6b7280', fontSize: 14 }}>Loading CRM…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            }>
              <CRMApp />
            </Suspense>
          }
        />

        {/* ── Website routes — all have Header + Footer ── */}
        <Route path="/" element={<WebsiteLayout><HomePage /></WebsiteLayout>} />
        <Route path="/privacy-policy" element={<WebsiteLayout><PrivacyPolicy /></WebsiteLayout>} />
        <Route path="/terms-conditions" element={<WebsiteLayout><TermsAndConditions /></WebsiteLayout>} />
        <Route path="/products/coco-peats" element={<WebsiteLayout><CocoPeats /></WebsiteLayout>} />
        <Route path="/products/onion" element={<WebsiteLayout><Onion /></WebsiteLayout>} />
        <Route path="/products/coconuts" element={<WebsiteLayout><Coconut /></WebsiteLayout>} />
        <Route path="/products/pepper" element={<WebsiteLayout><BlackPepper /></WebsiteLayout>} />
        <Route path="/products/cardamom" element={<WebsiteLayout><Cardamom /></WebsiteLayout>} />
        <Route path="/products/banana" element={<WebsiteLayout><Banana /></WebsiteLayout>} />
        <Route path="/products/yellow-pumpkin" element={<WebsiteLayout><YellowPumpkin /></WebsiteLayout>} />
        <Route path="/products/sweet-potato" element={<WebsiteLayout><SweetPotato /></WebsiteLayout>} />
        <Route path="/coconut-export-from-india" element={<WebsiteLayout><CoconutExportFromIndia /></WebsiteLayout>} />
        <Route path="/cardamom-export-from-india" element={<WebsiteLayout><CardamomExportFromIndia /></WebsiteLayout>} />
        <Route path="/black-pepper-export-from-india" element={<WebsiteLayout><BlackPepperExportFromIndia /></WebsiteLayout>} />
        <Route path="/thank-you" element={<WebsiteLayout><ThankYou /></WebsiteLayout>} />
        <Route path="*" element={<WebsiteLayout><NotFound /></WebsiteLayout>} />
        <Route path="/products/:slug" element={<WebsiteLayout><DynamicProductPage /></WebsiteLayout>} />

      </Routes>
    </Router>
  );
}

export default App;
