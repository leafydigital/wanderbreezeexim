import React from 'react';
import { certifications } from '../data/certifications';
import { Shield, Award, CheckCircle, FileText } from 'lucide-react';

const Certifications: React.FC = () => {
  return (
    <section id="certifications" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="text-blue-700" size={48} />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Our <span className="text-blue-700">Certifications</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We maintain the highest standards of quality and compliance. 
            Our certifications ensure that every product meets international export requirements.
          </p>
        </div>

        {/* Certifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                  <Award className="text-blue-700" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{cert.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-600">Number:</span>
                      <span className="text-sm font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        {cert.number}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <CheckCircle size={16} className="text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">{cert.authority}</p>
                        <p className="text-sm text-gray-600 mt-1">{cert.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quality Assurance Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-blue-700 text-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Quality Assurance Guarantee</h3>
            <p className="text-lg mb-6 max-w-3xl mx-auto">
              Every product undergoes rigorous quality checks and testing before export. 
              Our certified processes ensure consistency, safety, and compliance with international standards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-sm opacity-90">Quality Tested</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">6+</div>
                <div className="text-sm opacity-90">Certifications</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">25+</div>
                <div className="text-sm opacity-90">Countries Served</div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Statement */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 p-6 rounded-lg max-w-4xl mx-auto">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Regulatory Compliance</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Wander Breeze Exim is fully compliant with all Indian export regulations and international import requirements. 
              We maintain active registrations with FSSAI, APEDA, Indian Spices Board, and other relevant authorities. 
              All products are processed in certified facilities following HACCP and ISO standards to ensure food safety and quality.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Certifications;