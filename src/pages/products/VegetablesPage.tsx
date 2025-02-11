import React from 'react';

const VegetablesPage = () => {
  const vegetables = [
    { name: 'Tomatoes', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Onions', image: 'https://images.unsplash.com/photo-1618512496248-a01f27a5853b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Potatoes', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Carrots', image: 'https://images.unsplash.com/photo-1618512496248-a01f27a5853b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Indian Vegetables</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {vegetables.map((vegetable) => (
            <div key={vegetable.name} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src={vegetable.image}
                alt={vegetable.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">{vegetable.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VegetablesPage;