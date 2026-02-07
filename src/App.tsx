import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';

import Hero from './components/Hero';
import Products from './components/Products';
import Certifications from './components/Certifications';
import Contact from './components/Contact';

import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';
import PaymentTerms from './components/PaymentTerms';
import NotFound from './NotFound';

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
      {/* ✅ Header now global */}
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsAndConditions />} />
        <Route path="/payment-terms" element={<PaymentTerms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* ✅ Footer now global */}
      <Footer />
    </Router>
  );
}

export default App;
