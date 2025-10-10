import React from 'react';
import { ArrowRight, Globe, Award, Truck } from 'lucide-react';

interface HeroProps {
  onNavigate: (section: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="bg-gradient-to-br from-blue-50 to-emerald-50 py-20" id='home'>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Premium Indian <span className="text-blue-700">Exports</span>
            <br />
            <span className="text-emerald-600">Worldwide</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Your trusted partner for authentic Indian spices, premium dry fish, and exquisite handcrafted items. 
            Quality assured, globally delivered.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => onNavigate('products')}
              className="bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors duration-200 flex items-center justify-center space-x-2 group"
            >
              <span>Explore Products</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            
            <button
              onClick={() => onNavigate('contact')}
              className="border-2 border-blue-700 text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 hover:text-white transition-colors duration-200"
            >
              Get Quote
            </button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
              <Globe className="text-blue-700 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Global Reach</h3>
              <p className="text-gray-600 text-center">Serving importers across 25+ countries with reliable delivery</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
              <Award className="text-emerald-600 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Certified Quality</h3>
              <p className="text-gray-600 text-center">FSSAI, APEDA, and Spices Board certified products</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
              <Truck className="text-orange-600 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-center">Air shipment in 7 days, Sea freight in 15 days</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;