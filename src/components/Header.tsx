import React, { useEffect, useState } from 'react';
import { Menu, X, Mail, Phone, Globe } from 'lucide-react';

import logoBlack from '../../dist/assets/img/wander-breeze-website-logo-black.png';

interface HeaderProps {
  onNavigate: (section: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'products', 'certifications', 'contact'];
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

  const menuItems = [
    { label: 'Home', section: 'home' },
    { label: 'Products', section: 'products' },
    { label: 'Certifications', section: 'certifications' },
    { label: 'Contact', section: 'contact' }
  ];

  

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        {/* <div className="hidden md:flex justify-between items-center py-2 border-b border-gray-200 text-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-600">
              <Mail size={16} />
              <span>export@wanderbreezeexim.com</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Phone size={16} />
              <span>+91 9876543210</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Globe size={16} />
            <span>Trusted Global Exporter</span>
          </div>
        </div> */}

        {/* Main Navigation */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <a onClick={() => scrollToSection('home')} className="flex items-center">
              <img className="wid-100" style={{ width: "150px" }} src={logoBlack} />
            </a>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.section}
                onClick={() => onNavigate(item.section)}
                className="text-gray-700 hover:text-blue-700 font-medium transition-colors duration-200 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-700 transition-all duration-200 group-hover:w-full"></span>
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              {menuItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => {
                    onNavigate(item.section);
                    setIsMenuOpen(false);
                  }}
                  className="text-left py-2 text-gray-700 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
