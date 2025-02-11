import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-white py-16 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">About Us</h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              At ABI EXIM, we take pride in being a trusted exporter of premium-quality spices, fresh vegetables, and marine products from India to global markets. With over five years of experience, we have built a strong reputation for delivering excellence, reliability, and customer satisfaction.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Choose ABI EXIM?</h3>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-xl font-semibold text-gray-900">Customized Packaging</h4>
                  <p className="text-gray-600">
                    We understand that every customer has unique requirements. That's why we offer tailored packaging solutions to meet your specific needs and ensure the freshness and quality of our products.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-xl font-semibold text-gray-900">Uncompromised Quality</h4>
                  <p className="text-gray-600">
                    Quality is our top priority. We source our products from the finest farms and fisheries, ensuring they meet international standards and regulations. Every shipment undergoes rigorous quality checks before export.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-xl font-semibold text-gray-900">On-Time Delivery</h4>
                  <p className="text-gray-600">
                    With a well-organized supply chain and efficient logistics, we ensure timely delivery of goods to your destination, maintaining the integrity of the products throughout the journey.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-xl font-semibold text-gray-900">Real-Time Updates</h4>
                  <p className="text-gray-600">
                    We keep our customers informed at every stage of the shipping process. From sourcing to packaging and dispatch, we provide daily updates until the goods reach the destination port, giving you complete transparency and peace of mind.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mt-8 mb-8">
              With a commitment to excellence and customer satisfaction, ABI EXIM continues to serve international markets with top-notch Indian spices, vegetables, and marine products. Partner with us for quality, reliability, and efficiency in global trade.
            </p>

            <div className="text-center">
              <button
                onClick={() => {
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get in Touch
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;