import React, { useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Products from './components/Products';
import Certifications from './components/Certifications';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  const sectionRefs = {
    home: useRef<HTMLDivElement>(null),
    products: useRef<HTMLDivElement>(null),
    certifications: useRef<HTMLDivElement>(null),
    contact: useRef<HTMLDivElement>(null)
  };

  const scrollToSection = (section: string) => {
    const ref = sectionRefs[section as keyof typeof sectionRefs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={scrollToSection} />
      
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
      
      <Footer />
    </div>
  );
}

export default App;