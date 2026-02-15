import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

import Hero from './components/Hero';
import Products from './pages/Products';
import Certifications from './components/Certifications';
import Contact from './components/Contact';

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import PaymentTerms from './pages/PaymentTerms';
import NotFound from './NotFound';
import CocoPeats from './pages/Products/Coco-Peats';
import Coconut from './pages/Products/Coconuts';
import ScrollToTop from './components/ScrollToTop';
import Onion from './pages/Products/Onion';
import Cardamom from './pages/Products/Cardamom';
import Banana from './pages/Products/Banana';
import BlackPepper from './pages/Products/Pepper';
import WhatsAppFloat from './components/WhatsAppFloat';
import ThankYou from './pages/ThankYou';

function HomePage() {
  const sectionRefs = {
    home: useRef<HTMLDivElement>(null),
    products: useRef<HTMLDivElement>(null),
    certifications: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null),
  };

  const scrollToSection = (section: string) => {
    const ref = sectionRefs[section as keyof typeof sectionRefs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <div ref={sectionRefs.home}>
        <Hero onNavigate={scrollToSection} />
      </div>
      <div ref={sectionRefs.products}>
        <Products />
      </div>
      <div ref={sectionRefs.certifications}>
        <Certifications />
      </div>
      <div ref={sectionRefs.contact}>
        <Contact />
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      {/* ✅ Header now global */}
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsAndConditions />} />
        <Route path="/payment-terms" element={<PaymentTerms />} />
        <Route path="/products/coco-peats" element={<CocoPeats />} />
        <Route path="/products/onion" element={<Onion />} />
        <Route path="/products/coconuts" element={<Coconut />} />
        <Route path="/products/pepper" element={<BlackPepper />} />
        <Route path="/products/cardamom" element={<Cardamom />} />
        <Route path="/products/banana" element={<Banana />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* ✅ Footer now global */}
      <Footer />

      <WhatsAppFloat />

    </Router>
  );
}

export default App;
