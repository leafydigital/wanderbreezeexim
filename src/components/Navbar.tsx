import React, { useState, useEffect } from 'react';
import { Ship } from 'lucide-react';

const Navbar = () => {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'products', 'contact'];
      const scrollPosition = window.scrollY + 100; // Offset for better trigger point

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 64; // Height of the navbar
      const targetPosition = element.offsetTop - navbarHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  };

  const isActive = (section: string) => {
    return activeSection === section ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600';
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a onClick={() => scrollToSection('home')} className="flex items-center">
            <img className="wid-100" style={{ width: "100px" }} src="../../dist/assets/img/logo-black.png" />             
            </a>
          </div>
          <div className="flex items-center">
            <div className="hidden md:flex space-x-8">
              <button
                onClick={() => scrollToSection('home')}
                className={`${isActive('home')} transition-colors duration-200 font-medium`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className={`${isActive('about')} transition-colors duration-200 font-medium`}
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection('products')}
                className={`${isActive('products')} transition-colors duration-200 font-medium`}
              >
                Products
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`${isActive('contact')} transition-colors duration-200 font-medium`}
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;