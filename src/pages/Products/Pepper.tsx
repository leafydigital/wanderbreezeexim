import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ContactModal from "../../components/ContactModal";

import pepperImage from '../../../dist/assets/Pepper.png';

const BlackPepper = () => {

  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title =
      "Black Pepper Exporter from India | Bulk Pepper Supplier | Wander Breeze Exim";
  }, []);

  const handleNavigation = (section: string) => {
    if (section === "contact") {
      navigate("/#contact");
    }
  };

  return (
    <div className="bg-gray-50">

      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">

        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Black Pepper Exporter from India
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Premium export quality black pepper sourced from top farms in India,
            known for its strong aroma, high piperine content, and superior quality.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            <li>✔ High Piperine Content</li>
            <li>✔ Machine Cleaned & Graded</li>
            <li>✔ Bold & Uniform Size</li>
            <li>✔ Low Moisture Content</li>
            <li>✔ Bulk & Private Label Supply</li>
          </ul>

          <div className="mt-10 flex gap-4">
            <button
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition"
              onClick={() => setShowModal(true)}
            >
              Request Latest Price
            </button>
          </div>
        </div>

        <div>
          <img
            src={pepperImage}
            alt="Black Pepper Export from India"
            className="rounded-xl shadow-lg"
          />
        </div>

      </section>

      {/* ================= QUICK INFO ================= */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-center">

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Origin</h4>
            <p className="mt-2 text-gray-600">India</p>
          </div>

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Minimum Order</h4>
            <p className="mt-2 text-gray-600">100 Kg / Bulk Orders</p>
          </div>

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Supply Capacity</h4>
            <p className="mt-2 text-gray-600">High Volume Supply Available</p>
          </div>

        </div>
      </section>

      {/* ================= PRODUCT OVERVIEW ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">

          <h2 className="text-3xl font-bold text-gray-900">
            Export Quality Black Pepper
          </h2>

          <p className="mt-6 text-gray-600 leading-relaxed">
            Indian black pepper is globally renowned for its pungency,
            strong aroma, and high piperine content. Our pepper is carefully
            cleaned, graded, and packed to meet international export standards.
          </p>

        </div>
      </section>

      {/* ================= TECH SPECS ================= */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Technical Specifications – Export Grade Black Pepper
          </h2>

          <div className="mt-12 grid md:grid-cols-2 gap-6">

            {[
              ["Type", "Whole Black Pepper"],
              ["Moisture", "< 12%"],
              ["Piperine Content", "5% – 7%"],
              ["Density", "550 – 580 GL"],
              ["Admixture", "< 1%"],
              ["Packaging", "25kg / 50kg Bags"],
              ["Grade", "Premium Export Quality"],
              ["Shelf Life", "12 – 18 Months"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <h4 className="font-semibold text-blue-600">
                  {label}
                </h4>
                <p className="mt-2 text-gray-600">{value}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ================= PACKAGING ================= */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Export Packaging & Container Loading Details
          </h2>

          <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-10 shadow-lg">

            <div className="grid md:grid-cols-2 gap-6 text-lg">

              <div>Loading Ports: Cochin / Tuticorin</div>
              <div>Container Type: 20’ / 40’ Container</div>
              <div>Capacity: 14 – 18 MT per container</div>
              <div>Packaging: 25kg / 50kg Bags</div>
              <div>Private Label Packaging Available</div>
              <div>Fumigation Available</div>

            </div>

            <div className="mt-8 text-center">
              <p className="text-yellow-200 font-semibold">
                ⚠️ Limited Weekly Export Slots – Contact Early to Reserve Shipment
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="py-20 px-6 bg-white">

        <div className="max-w-5xl mx-auto text-center">

          <h2 className="text-3xl font-bold text-gray-900">
            Why Choose Wander Breeze Exim?
          </h2>

          <ul className="mt-8 space-y-3 text-gray-700">
            <li>✔ Direct Sourcing from Farms</li>
            <li>✔ Competitive Export Pricing</li>
            <li>✔ Reliable Supply Chain</li>
            <li>✔ Export Documentation Support</li>
            <li>✔ Fast Buyer Response</li>
          </ul>

        </div>

      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-green-600 to-blue-600 text-white">

        <h2 className="text-3xl font-bold">
          Looking for Bulk Black Pepper Supplier from India?
        </h2>

        <p className="mt-4 text-lg">
          Get the latest export pricing and secure your shipment today.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <button
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            onClick={() => setShowModal(true)}
          >
            Request Price Now
          </button>
        </div>

      </section>

      {/* ✅ MODAL */}
      <ContactModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product="Black Pepper"
      />

    </div>
  );
};

export default BlackPepper;