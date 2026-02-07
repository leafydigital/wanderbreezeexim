import React from "react";

const PaymentTerms: React.FC = () => {
  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-6">

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800">
            Payment Terms & Trade Policy
          </h1>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            At Wander Breeze Exim, we follow transparent and secure payment
            practices to build strong long-term relationships with our
            international buyers.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* New Buyers */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-blue-700">
              Payment Terms for New Buyers
            </h2>
            <ul className="list-disc ml-5 text-gray-700 space-y-2">
              <li>75% Advance Payment at order confirmation</li>
              <li>25% Balance Payment against Bill of Lading (BL) copy</li>
            </ul>
          </div>

          {/* Returning Buyers */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-blue-700">
              Payment Terms for Returning Buyers
            </h2>
            <ul className="list-disc ml-5 text-gray-700 space-y-2">
              <li>50% Advance Payment at order confirmation</li>
              <li>50% Balance Payment against Bill of Lading (BL) copy</li>
            </ul>
          </div>

          {/* High Value Orders */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-blue-700">
              High Value Order Policy
            </h2>
            <p className="text-gray-700 mb-2">
              For orders above <strong>₹50 Lakhs INR</strong>:
            </p>
            <ul className="list-disc ml-5 text-gray-700 space-y-2">
              <li>75% Advance Payment is mandatory</li>
              <li>25% Balance Payment against BL copy</li>
            </ul>
          </div>

          {/* Credit Facility */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-3 text-blue-700">
              Credit Facility
            </h2>
            <p className="text-gray-700">
              Trusted long-term buyers may be eligible for a 100% credit
              payment option after relationship evaluation. Eligibility will
              be communicated by our team.
            </p>
          </div>

          {/* Shipping */}
          <div className="bg-white p-6 rounded-xl shadow-md md:col-span-2">
            <h2 className="text-xl font-semibold mb-3 text-blue-700">
              Shipping & Transport Policy
            </h2>
            <ul className="list-disc ml-5 text-gray-700 space-y-2">
              <li>Preferred mode of shipment: Sea Freight</li>
              <li>
                If Air Freight is requested, additional transport charges will
                be added to the product invoice
              </li>
              <li>
                Packing and export documentation charges are included as per
                quotation
              </li>
            </ul>
          </div>

        </div>

        {/* Closing Note */}
        <div className="text-center mt-10">
          <p className="text-gray-700">
            For any clarification regarding payment or shipping terms, feel
            free to contact our team. We are happy to assist you.
          </p>
        </div>

      </div>
    </section>
  );
};

export default PaymentTerms;
