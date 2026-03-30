import React from 'react';
import { FileText, CheckCircle, Shield } from 'lucide-react';

const reports = [
  {
    id: 1,
    name: 'Phytosanitary Certificate',
    description: 'Ensures products are pest-free and comply with international plant health regulations.',
    type: 'Common Export Document'
  },
  {
    id: 2,
    name: 'Certificate of Origin',
    description: 'Validates the country of origin for smooth customs clearance.',
    type: 'Common Export Document'
  },
  {
    id: 3,
    name: 'Fumigation Certificate',
    description: 'Confirms treatment to eliminate pests during shipment.',
    type: 'Common Export Document'
  },
  {
    id: 4,
    name: 'Lab Test Report',
    description: 'Ensures quality, purity, and compliance with buyer specifications.',
    type: 'Quality Test'
  },
  {
    id: 5,
    name: 'Pesticide Residue Analysis',
    description: 'Checks chemical residue levels as per international safety standards.',
    type: 'Quality Test'
  },
  {
    id: 6,
    name: 'Microbiological Test Report',
    description: 'Ensures food safety by testing bacteria and contamination levels.',
    type: 'Quality Test'
  }
];

const productReports = [
  {
    product: 'Spices (Cardamom, Pepper, etc.)',
    items: [
      'Moisture Content Report',
      'Volatile Oil Content Test',
      'ASTA Color Value (for spices)',
      'Pesticide Residue Analysis'
    ]
  },
  {
    product: 'Fresh Vegetables (Onion, Sweet Potato)',
    items: [
      'Size & Grading Report',
      'Phytosanitary Certificate',
      'Residue Analysis',
      'Quality Inspection Report'
    ]
  },
  {
    product: 'Coconut & Agro Products',
    items: [
      'Moisture & Oil Content',
      'Fumigation Certificate',
      'Quality Grading Report'
    ]
  }
];

const Reports: React.FC = () => {
  return (
    <section id="reports" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Shield className="text-blue-700" size={48} />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Export Documentation & <span className="text-blue-700">Quality Assurance</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            All export shipments are supported with required documentation and test reports as per importing country regulations.
          </p>
        </div>

        {/* Common Reports */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Common Export Documents & Reports
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FileText className="text-blue-700" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">{report.name}</h4>
                    <p className="text-sm text-gray-600 mt-2">{report.description}</p>
                    <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Available on Request
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Based Reports */}
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Product-Specific Reports
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productReports.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
              >
                <h4 className="text-lg font-semibold text-blue-700 mb-4">
                  {item.product}
                </h4>

                <ul className="space-y-2">
                  {item.items.map((report, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm text-gray-700">{report}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Banner */}
        <div className="mt-16 bg-gradient-to-r from-blue-700 to-emerald-600 text-white p-8 rounded-xl text-center">
          <h3 className="text-2xl font-bold mb-4">Trusted Export Process</h3>
          <p className="text-lg max-w-2xl mx-auto">
            ✔ All required documents provided before shipment  
            ✔ Third-party testing available on request  
            ✔ Ensuring smooth customs clearance worldwide
          </p>
        </div>

      </div>
    </section>
  );
};

export default Reports;