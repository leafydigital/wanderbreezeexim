import React from "react";
import { FileText, CheckCircle, CreditCard  } from "lucide-react";

const paymentData = [
  {
    title: "Payment Terms for New Buyers",
    items: [
      "70% Advance Payment at order confirmation",
      "30% Balance Payment against Bill of Lading (BL) copy"
    ]
  },
  {
    title: "Payment Terms for Returning Buyers",
    items: [
      "50% Advance Payment at order confirmation",
      "50% Balance Payment against Bill of Lading (BL) copy"
    ]
  },
  {
    title: "High Value Order Policy",
    description: "For orders above $50,000 USD:",
    items: [
      "Payment terms may be mutually discussed based on order size",
      "Flexible structures available for long-term partners"
    ]
  },
  {
    title: "Credit Facility",
    description:
      "Credit terms may be offered to trusted long-term buyers based on business relationship and transaction history. Approval is subject to internal evaluation."
  }
];

const PaymentTerms: React.FC = () => {
  return (
    <section id="paymentterms" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <CreditCard  className="text-blue-700" size={48} />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Payment Terms & <span className="text-blue-700">Trade Policy</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We follow transparent, secure, and flexible payment practices to build
            long-term partnerships with our international buyers.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">

          {paymentData.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="text-blue-700" size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {item.description}
                    </p>
                  )}

                  {item.items && (
                    <ul className="mt-3 space-y-2">
                      {item.items.map((point, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle size={16} className="text-green-600 mt-1" />
                          <span className="text-sm text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <span className="inline-block mt-3 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Flexible Terms
                  </span>
                </div>
              </div>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default PaymentTerms;