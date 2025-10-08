import React from 'react';
import { Product } from '../types';
import { Plane, Ship, Clock, CreditCard, MapPin, Palette, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {

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

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Product Image */}
      <div className="relative overflow-hidden">
        <img
          src={product.image}
           alt={`Image of ${product.name}`}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
          Export Quality
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{product.name}</h3>
        {product.description && (
          <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
        )}

        {/* Specifications Grid */}
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="bg-blue-100 p-1 rounded">
              <span className="text-blue-700 font-mono text-xs">HSN</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">HSN Code:</span>
              <span className="ml-2 text-gray-600">{product.hsnCode}</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <MapPin size={16} className="text-emerald-600 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-700">Origin:</span>
              <span className="ml-2 text-gray-600">{product.placeOfOrigin}</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <Palette size={16} className="text-purple-600 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-700">Color:</span>
              <span className="ml-2 text-gray-600">{product.color}</span>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <Star size={16} className="text-yellow-600 mt-0.5" />
            <div>
              <span className="font-semibold text-gray-700">Grade:</span>
              <span className="ml-2 text-gray-600">{product.grade}</span>
            </div>
          </div>
        </div>

        {/* Transport Options */}
        <div className="mt-4 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center space-x-2">
            <span>Transport & Delivery</span>
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3 text-sm">
              <Plane size={16} className="text-blue-600" />
              <span className="font-medium">Air:</span>
              <span className="text-gray-600">{product.deliveryTime.air}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm">
              <Ship size={16} className="text-cyan-600" />
              <span className="font-medium">Sea:</span>
              <span className="text-gray-600">{product.deliveryTime.sea}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CreditCard size={16} className="text-green-600" />
            <span className="font-semibold text-gray-700">Payment Terms</span>
          </div>
          <p className="text-sm text-gray-600">{product.paymentTerms}</p>
        </div>

        {/* Contact for Price Button */}
        <button className="w-full mt-6 bg-gradient-to-r from-blue-700 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-blue-800 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
        onClick={() => scrollToSection('contact')}>
          Contact for Price Quote
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
