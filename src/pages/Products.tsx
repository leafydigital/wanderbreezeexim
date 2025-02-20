import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import Spicesimg from '../../dist/assets/img/spices.png';

import VegetablesImg from '../../dist/assets/img/vegetables.avif';

import MarineImg from '../../dist/assets/img/marine-products.avif';

const ProductCard = ({ title, image }: { title: string; image: string }) => {
  return (
    <div className="group relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
      <div className="aspect-w-16 aspect-h-9">
        <img
          src={image}
          alt={title}
          className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-blue-600/60" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
    </div>
  );
};

const ProductDetails = ({ category }: { category: string }) => {
  const products = {
    spices: [
      { name: 'Black Pepper', image: 'https://images.unsplash.com/photo-1599909631725-d6c3a8dc68c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Cardamom', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Turmeric', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Cinnamon', image: 'https://images.unsplash.com/photo-1599909631725-d6c3a8dc68c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ],
    vegetables: [
      { name: 'Tomatoes', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Onions', image: 'https://images.unsplash.com/photo-1618512496248-a01f27a5853b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Potatoes', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Carrots', image: 'https://images.unsplash.com/photo-1618512496248-a01f27a5853b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ],
    marine: [
      { name: 'Fresh Shrimp', image: 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Tuna', image: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Crab', image: 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
      { name: 'Lobster', image: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
    ]
  };

  const titles = {
    spices: 'Indian Spices',
    vegetables: 'Indian Vegetables',
    marine: 'Marine Products'
  };

  const selectedProducts = products[category as keyof typeof products] || [];
  const title = titles[category as keyof typeof titles] || '';

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {selectedProducts.map((product) => (
          <div key={product.name} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const products = [
    {
      title: 'Spices',
      image: Spicesimg,
      category: 'spices'
    },
    {
      title: 'Vegetables',
      image: VegetablesImg,
      category: 'vegetables'
    },
    {
      title: 'Marine Products',
      image: MarineImg,
      category: 'marine'
    }
  ];

  return (
    <div className="bg-gray-50 py-16 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {products.map((product) => (
            <div key={product.title} onClick={() => setSelectedCategory(product.category)}>
              <ProductCard {...product} />
            </div>
          ))}
        </div>

        {selectedCategory && (
          <ProductDetails category={selectedCategory} />
        )}

        <div className="bg-white rounded-lg shadow-lg p-8 text-center mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            We can consistently supply the required quantity of products on a weekly or monthly basis as per your needs.
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            To know about our pricing terms
          </p>
          <button
            onClick={() => {
              const contactSection = document.getElementById('contact');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="inline-flex items-center bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Contact Us
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Products;