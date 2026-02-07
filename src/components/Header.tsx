import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import logoBlack from '../../dist/assets/img/wander-breeze-website-logo-black.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onNavigate?: (section: string) => void;
  noMenu?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, noMenu = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const location = useLocation();
  const navigate = useNavigate();

  // Scroll spy only on homepage
  useEffect(() => {
    if (noMenu) return;
    if (location.pathname !== '/') return;

    const handleScroll = () => {
      const sections = ['home', 'products', 'certifications', 'contact'];
      const scrollPosition = window.scrollY + 100;

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
  }, [noMenu, location.pathname]);

  // Handle scroll or page navigation
  const handleNavigation = (section: string) => {
    setIsMenuOpen(false);

    // If Payment Terms → go to new page
    if (section === 'paymentterms') {
      navigate('/payment-terms');
      return;
    }

    // If already on homepage → scroll
    if (location.pathname === '/') {
      const element = document.getElementById(section);
      if (element) {
        const navbarHeight = 80;
        const targetPosition = element.offsetTop - navbarHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    } 
    // If on another page → first go to homepage, then scroll
    else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          const navbarHeight = 80;
          const targetPosition = element.offsetTop - navbarHeight;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      }, 300);
    }
  };

  const menuItems = [
    { label: 'Home', section: 'home' },
    { label: 'Products', section: 'products' },
    { label: 'Certifications', section: 'certifications' },
    { label: 'Payment Terms', section: 'paymentterms' }, // 👈 new page
    { label: 'Contact', section: 'contact' },
  ];

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src={logoBlack} alt="Wander Breeze" style={{ width: '150px' }} />
        </Link>

        {!noMenu && (
          <>
            {/* Desktop Menu */}
            <nav className="hidden md:flex space-x-8">
              {menuItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => handleNavigation(item.section)}
                  className={`text-gray-700 hover:text-blue-700 font-medium transition-colors duration-200 relative group ${
                    activeSection === item.section ? 'text-blue-700' : ''
                  }`}
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

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className="absolute top-full left-0 w-full bg-white border-t border-gray-200 shadow-md md:hidden py-4">
                <nav className="flex flex-col space-y-4 px-4">
                  {menuItems.map((item) => (
                    <button
                      key={item.section}
                      onClick={() => handleNavigation(item.section)}
                      className="text-left py-2 text-gray-700 hover:text-blue-700 font-medium transition-colors duration-200"
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
