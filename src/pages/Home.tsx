import React from 'react';
import { ArrowRight } from 'lucide-react';

const Home = () => {
  return (
    <div>
      <div className="relative h-[600px]">
        <img
          src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80"
          alt="Export Business"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Global Excellence in Exports
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              Delivering Quality Indian Products to the World
            </p>
            <button
              onClick={() => {
                const contactSection = document.getElementById('contact');
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;