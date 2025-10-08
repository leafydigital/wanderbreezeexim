import React from 'react';
import { Mail, Phone, MapPin, Globe, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-blue-400 mb-6">
              WanderBreeze<span className="text-emerald-400">Exim</span>
            </h3>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Your trusted partner for premium Indian exports. We specialize in authentic spices, 
              quality dry fish, and exquisite handcrafted items with worldwide delivery.
            </p>
            <div className="flex space-x-4">
              <Facebook className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors duration-200" size={24} />
              <Twitter className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors duration-200" size={24} />
              <Linkedin className="text-gray-400 hover:text-blue-400 cursor-pointer transition-colors duration-200" size={24} />
              <Instagram className="text-gray-400 hover:text-emerald-400 cursor-pointer transition-colors duration-200" <a href="https://www.instagram.com/wanderbreezeexim/" target="_blank" rel="noopener noreferrer"> size={24} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#home" className="text-gray-300 hover:text-white transition-colors duration-200">Home</a></li>
              <li><a href="#products" className="text-gray-300 hover:text-white transition-colors duration-200">Products</a></li>
              <li><a href="#certifications" className="text-gray-300 hover:text-white transition-colors duration-200">Certifications</a></li>
              <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors duration-200">Contact</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Terms of Service</a></li>
            </ul>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Product Categories</h4>
            <ul className="space-y-3">
              <li><a href="#products" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200">Spices & Powders</a></li>
              <li><a href="#products" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200">Dry Fish</a></li>
              <li><a href="#products" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200">Handcrafted Items</a></li>
              <li><a href="#products" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200">Custom Products</a></li>
              <li><a href="#products" className="text-gray-300 hover:text-emerald-400 transition-colors duration-200">Bulk Orders</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="text-blue-400 mt-1" size={20} />
                <div>
                  <p className="text-gray-300"><a href="mailto:wanderbreezeexim@gmail.com"> wanderbreezeexim@gmail.com</a></p>
                  <p className="text-gray-400 text-sm">24/7 Email Support</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Phone className="text-emerald-400 mt-1" size={20} />
                <div>
                  <p className="text-gray-300"><a href="https://wa.me/917358060254" target="_blank" rel="noopener noreferrer"> +91 73580 60254 </a></p>
                  <p className="text-gray-400 text-sm">WhatsApp Available</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <MapPin className="text-orange-400 mt-1" size={20} />
                <div>
                  <p className="text-gray-300">Wander Breeze Exim, Mannammoola</p>
                  <p className="text-gray-300">Thiruvananthapuram, Kerala, India</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Globe className="text-purple-400 mt-1" size={20} />
                <div>
                  <p className="text-gray-300">Serving 25+ Countries</p>
                  <p className="text-gray-400 text-sm">Worldwide Shipping</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} WanderBreezeExim. All rights reserved. | GST: 32AAECW0943R1ZY
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>FSSAI Certified</span>
              <span>•</span>
              <span>APEDA Registered</span>
              <span>•</span>
              <span>ISO 22000:2018</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
