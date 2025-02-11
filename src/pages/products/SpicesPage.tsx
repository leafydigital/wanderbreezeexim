import React from 'react';

const SpicesPage = () => {
  const spices = [
    { name: 'Black Pepper', image: 'https://images.unsplash.com/photo-1599909631725-d6c3a8dc68c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Cardamom', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Turmeric', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' },
    { name: 'Cinnamon', image: 'https://images.unsplash.com/photo-1599909631725-d6c3a8dc68c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Indian Spices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {spices.map((spice) => (
            <div key={spice.name} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src={spice.image}
                alt={spice.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">{spice.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpicesPage;