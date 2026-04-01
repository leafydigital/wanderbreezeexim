import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ContactModal from "../../components/ContactModal";
import cardamomImage from "../../../dist/assets/Cardamom.png";

const Cardamom = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title =
      "Indian Green Cardamom Exporter | Bulk Wholesale Supplier";
  }, []);

  return (
    <div className="bg-gray-50">

      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">

        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Indian Green Cardamom Exporter – Bulk Wholesale Supplier
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Wander Breeze Exim is a leading exporter of premium Indian green cardamom
            sourced from Idukki plantations in Kerala. We supply 8mm bold, high-aroma,
            export-quality cardamom for global spice markets.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            <li>✔ 8mm Bold & Premium Grades Available</li>
            <li>✔ Moisture Controlled (10% – 12%)</li>
            <li>✔ Deep Natural Green Color</li>
            <li>✔ HS Code: 090831</li>
            <li>✔ Bulk Export & Private Label Supply</li>
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
            src={cardamomImage}
            alt="Indian Green Cardamom Exporter Bulk Supply"
            className="rounded-xl shadow-lg"
          />
        </div>

      </section>

      {/* ================= QUICK INFO ================= */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-center">

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Origin</h4>
            <p className="mt-2 text-gray-600">Idukki, Kerala (Western Ghats)</p>
          </div>

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Minimum Order</h4>
            <p className="mt-2 text-gray-600">500 KG (Sea Freight)</p>
          </div>

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Supply Capacity</h4>
            <p className="mt-2 text-gray-600">Large Volume Export Supply</p>
          </div>

        </div>
      </section>

      {/* ================= PRODUCT OVERVIEW ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">

          <h2 className="text-3xl font-bold text-gray-900">
            Premium Indian Green Cardamom – Queen of Spices
          </h2>

          <p className="mt-6 text-gray-600 leading-relaxed">
            Sourced from high-altitude plantations in the Western Ghats,
            Indian green cardamom is globally known for its strong aroma,
            rich flavor, and essential oil content.
          </p>

          <p className="mt-4 text-gray-600 leading-relaxed">
            Our export-grade cardamom is processed in controlled environments
            to preserve natural color, aroma compounds, and freshness,
            making it ideal for retail, spice blending, and food processing industries.
          </p>

        </div>
      </section>

      {/* ================= TECH SPECS ================= */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Specifications & Export Quality Standards
          </h2>

          <div className="mt-12 grid md:grid-cols-2 gap-6">

            {[
              ["Origin", "Western Ghats (Kerala), India"],
              ["HS Code", "090831 / 090832"],
              ["Grades", "8mm Bold, 7.5mm Premium, 7mm Standard"],
              ["Color", "Deep Green to Pale Green"],
              ["Moisture", "10% – 12% Max"],
              ["Admixture", "< 1%"],
              ["Shelf Life", "24 Months"],
              ["Processing", "Machine Cleaned & Graded"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <h4 className="font-semibold text-blue-600">{label}</h4>
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
            Global Shipping & Packaging for Bulk Cardamom
          </h2>

          <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-10 shadow-lg">

            <div className="grid md:grid-cols-2 gap-6 text-lg">
              <div>Packaging: 5kg / 10kg Vacuum Packs</div>
              <div>Master Packing: Export Cartons / Jute Bags</div>
              <div>MOQ: 500 KG (Sea) / Air Shipment Available</div>
              <div>Incoterms: FOB / CIF / CFR</div>
              <div>Private Labeling Available</div>
              <div>Moisture & UV Protection Packaging</div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-yellow-200 font-semibold">
                ⚠️ Premium Grades Limited – Contact Early for Availability
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= QUALITY ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Quality Assurance & Export Documentation
          </h2>

          <ul className="mt-10 space-y-4 text-gray-700">
            <li>✔ Phytosanitary Certification</li>
            <li>✔ Certificate of Origin</li>
            <li>✔ Lab Testing for Pesticide Residues</li>
            <li>✔ EU & FDA Compliance</li>
          </ul>

        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Frequently Asked Questions
          </h2>

          <div className="mt-10 space-y-6 text-gray-700">

            <div>
              <h4 className="font-semibold">What is the HS code?</h4>
              <p>090831 for whole cardamom and 090832 for ground cardamom.</p>
            </div>

            <div>
              <h4 className="font-semibold">What is 8mm bold cardamom?</h4>
              <p>Pods above 8mm size with higher oil content and strong aroma.</p>
            </div>

            <div>
              <h4 className="font-semibold">How is color preserved?</h4>
              <p>Using controlled drying and vacuum packaging.</p>
            </div>

            <div>
              <h4 className="font-semibold">Can lab testing be provided?</h4>
              <p>Yes, full pesticide and quality testing reports available.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-green-600 to-blue-600 text-white">

        <h2 className="text-3xl font-bold">
          Looking for Bulk Cardamom Supplier from India?
        </h2>

        <p className="mt-4 text-lg">
          Get the latest export pricing and secure premium quality supply.
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

      {/* ================= MODAL ================= */}
      <ContactModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product="Green Cardamom"
      />

    </div>
  );
};

export default Cardamom;