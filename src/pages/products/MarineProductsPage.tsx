import React from 'react';

const MarineProductsPage = () => {
  const marineProducts = [
    { name: 'Fresh Shrimp', image: 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Tuna', image: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Crab', image: 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Lobster', image: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Marine Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {marineProducts.map((product) => (
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
    </div>
  );
};

export default MarineProductsPage;