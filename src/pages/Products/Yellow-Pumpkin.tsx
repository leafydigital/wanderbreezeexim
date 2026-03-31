import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ContactModal from "../../components/ContactModal";

import pumpkinImage from '../../../dist/assets/Pumpkin.png';

const Pumpkin = () => {

  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title =
      "Yellow Pumpkin Exporter from India | Bulk Pumpkin Supplier | Wander Breeze Exim";
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
            Yellow Pumpkin Exporter from India
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Premium export quality yellow pumpkins sourced directly from farms in India.
            Carefully graded and packed to meet international export standards.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            <li>✔ Premium Export Grade (A Grade)</li>
            <li>✔ Uniform Size & Bright Color</li>
            <li>✔ Long Shelf Life (45–60 Days)</li>
            <li>✔ Bulk Export Supply Available</li>
            <li>✔ Direct Farm Sourcing</li>
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
            src={pumpkinImage}
            alt="Yellow Pumpkin Export from India"
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
            <p className="mt-2 text-gray-600">1 x 40ft Container</p>
          </div>

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Supply Capacity</h4>
            <p className="mt-2 text-gray-600">50+ Containers / Month</p>
          </div>

        </div>
      </section>

      {/* ================= PRODUCT OVERVIEW ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">

          <h2 className="text-3xl font-bold text-gray-900">
            Export Quality Yellow Pumpkin
          </h2>

          <p className="mt-6 text-gray-600 leading-relaxed">
            Our yellow pumpkins are known for their vibrant color, smooth texture,
            and natural sweetness. Harvested at optimal maturity, they are ideal
            for international markets including the Middle East, Europe, and Asia.
          </p>

        </div>
      </section>

      {/* ================= TECH SPECS ================= */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Technical Specifications – Export Grade Pumpkin
          </h2>

          <div className="mt-12 grid md:grid-cols-2 gap-6">

            {[
              ["Type", "Fresh Yellow Pumpkin"],
              ["Weight", "2kg – 8kg"],
              ["Color", "Bright Yellow / Orange"],
              ["Shape", "Round / Oval"],
              ["Shelf Life", "45 – 60 Days"],
              ["Packaging", "Net Bags / Carton Packaging"],
              ["Grade", "Premium Export Quality (A Grade)"],
              ["Container Capacity", "18 – 22 MT (40ft)"],
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

              <div>Loading Ports: Nhava Sheva / Tuticorin / Chennai / Cochin</div>
              <div>Container Type: 20’ / 40’ Container</div>
              <div>Capacity: 18 – 22 MT (40ft)</div>
              <div>Packaging: Loose / Net / Carton</div>
              <div>Private Label Packaging: Available</div>
              <div>Fumigation & Phytosanitary: Available</div>
              <div>Pre-cooling Before Shipment: Available</div>

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
            <li>✔ Direct Farm Sourcing</li>
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
          Looking for Bulk Pumpkin Supplier from India?
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
        product="Yellow Pumpkin"
      />

    </div>
  );
};

export default Pumpkin;