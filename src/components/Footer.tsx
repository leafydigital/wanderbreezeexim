import React from 'react';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Wander Breeze EXIM</h3>
            <p className="text-gray-400">
              Your trusted partner in global trade, specializing in high-quality Indian exports.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                <span><a href="mailto:wanderbreezeexim@gmail.com"> wanderbreezeexim@gmail.com</a></span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                <span><a href="https://wa.me/917871126830" target="_blank" rel="noopener noreferrer"> +91 7871126830</a></span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <span>Tenkasi, Tamilnadu - India</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition-colors">
                <a href="https://www.facebook.com/profile.php?id=61573088471121" target='_blank'>
                  <Facebook className="h-6 w-6" ></Facebook></a>
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <a href="https://www.instagram.com/wanderbreezeexim" target='_blank'>
                  <Instagram className="h-6 w-6" />
                </a>
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <a href="https://wa.me/917871126830" target='_blank'>
                  <Phone className="h-6 w-6" />
                </a>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-400">© 2024 Wander Breeze EXIM. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;