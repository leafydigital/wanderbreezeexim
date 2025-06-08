import React, { useState } from 'react';
import { products } from '../data/products';
import ProductCard from './ProductCard';
import { Package, Fish, Palette } from 'lucide-react';

const Products: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'spices' | 'dry-fish' | 'handcrafted'>('all');

  const categories = [
    { id: 'all', label: 'All Products', icon: Package, count: products.length },
    { id: 'spices', label: 'Spices', icon: Package, count: products.filter(p => p.category === 'spices').length },
    { id: 'dry-fish', label: 'Dry Fish', icon: Fish, count: products.filter(p => p.category === 'dry-fish').length },
    { id: 'Earthenware', label: 'Earthenware', icon: Palette, count: products.filter(p => p.category === 'Earthenware').length }
  ];

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(product => product.category === activeCategory);

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
    <section id="products" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Our Premium <span className="text-blue-700">Export Products</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our carefully curated selection of authentic Indian products,
            each meeting international quality standards and export requirements.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${activeCategory === category.id
                    ? 'bg-blue-700 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 shadow-md'
                  }`}
              >
                <IconComponent size={20} />
                <span>{category.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${activeCategory === category.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600'
                  }`}>
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Need Custom Products or Bulk Orders?
            </h3>
            <p className="text-gray-600 mb-6">
              We specialize in custom product sourcing and large volume exports.
              Contact us with your specific requirements.
            </p>
            <button className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all duration-200"
              onClick={() => scrollToSection('contact')}>
              Request Custom Quote
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;