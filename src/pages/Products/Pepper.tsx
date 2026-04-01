import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ContactModal from "../../components/ContactModal";
import pepperImage from "../../../dist/assets/Pepper.png";

const BlackPepper = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title =
      "Indian Black Pepper Exporter | Tellicherry & Malabar Wholesale Supplier";
  }, []);

  return (
    <div className="bg-gray-50">

      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">

        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Indian Black Pepper Exporter – Tellicherry & Malabar Bulk Supplier
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Wander Breeze Exim is a trusted Indian black pepper exporter supplying
            premium Tellicherry (TGEB), MG1, and 500–600 GL grades sourced from the
            Malabar coast. High piperine, strong aroma, and export-ready quality.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            <li>✔ Tellicherry TGEB & 500–600 GL Grades</li>
            <li>✔ Moisture Controlled (Max 11% – 12%)</li>
            <li>✔ High Piperine Content (4% – 7%)</li>
            <li>✔ ASTA Clean & EU MRL Compliant</li>
            <li>✔ HS Code: 090411</li>
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
            alt="Indian Black Pepper Exporter Bulk Supply"
            className="rounded-xl shadow-lg"
          />
        </div>

      </section>

      {/* ================= QUICK INFO ================= */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-center">

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Origin</h4>
            <p className="mt-2 text-gray-600">Malabar Coast (Kerala / Karnataka)</p>
          </div>

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Minimum Order</h4>
            <p className="mt-2 text-gray-600">500 KG – Bulk Orders</p>
          </div>

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Supply Capacity</h4>
            <p className="mt-2 text-gray-600">High Volume Export Supply</p>
          </div>

        </div>
      </section>

      {/* ================= PRODUCT OVERVIEW ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">

          <h2 className="text-3xl font-bold text-gray-900">
            Authentic Malabar Black Pepper – King of Spices
          </h2>

          <p className="mt-6 text-gray-600 leading-relaxed">
            Indian black pepper is globally recognized for its strong pungency,
            rich aroma, and high essential oil content. Our pepper is sourced
            directly from Kerala and Karnataka plantations.
          </p>

          <p className="mt-4 text-gray-600 leading-relaxed">
            Processed in ISO-certified facilities, our pepper retains its natural
            oils and flavor, making it ideal for food processing, pharmaceuticals,
            and premium spice retail brands.
          </p>

        </div>
      </section>

      {/* ================= TECH SPECS ================= */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Tellicherry (TGEB) & 500 GL Black Pepper Specifications
          </h2>

          <div className="mt-12 grid md:grid-cols-2 gap-6">

            {[
              ["Origin", "Malabar Coast (Kerala / Karnataka), India"],
              ["HS Code", "090411 / 090412"],
              ["Grades", "TGEB, TGSEB, MG1, 500–600 GL"],
              ["Density", "500 – 630 GL"],
              ["Moisture", "Max 11% – 12%"],
              ["Piperine", "4% – 7%"],
              ["Extraneous Matter", "< 0.5% (ASTA Clean)"],
              ["Sterilization", "Steam / ETO Treated"],
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
            B2B Logistics, Compliance & Bulk Packaging
          </h2>

          <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-10 shadow-lg">

            <div className="grid md:grid-cols-2 gap-6 text-lg">
              <div>Packaging: 25kg / 50kg PP or Jute Bags</div>
              <div>Vacuum LDPE Liners Available</div>
              <div>Ports: Cochin / Tuticorin</div>
              <div>MOQ: 500 KG+</div>
              <div>Spices Board of India Certified</div>
              <div>Phytosanitary & COA Provided</div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-yellow-200 font-semibold">
                ⚠️ Premium Tellicherry Grades Limited – Book Early
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= QUALITY ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Quality Control & Global Compliance
          </h2>

          <ul className="mt-10 space-y-4 text-gray-700">
            <li>✔ Steam Sterilized & Lab Tested</li>
            <li>✔ EU MRL & FDA Compliant</li>
            <li>✔ Spices Board of India Approved</li>
            <li>✔ Certificate of Analysis (COA) Provided</li>
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
              <h4 className="font-semibold">What is the HS code for black pepper?</h4>
              <p>090411 for whole pepper and 090412 for ground pepper.</p>
            </div>

            <div>
              <h4 className="font-semibold">What is TGEB grade?</h4>
              <p>Tellicherry Garbled Extra Bold – larger size, higher oil content.</p>
            </div>

            <div>
              <h4 className="font-semibold">What is GL in black pepper?</h4>
              <p>Grams per liter – indicates density and quality of pepper.</p>
            </div>

            <div>
              <h4 className="font-semibold">Is it EU compliant?</h4>
              <p>Yes, fully tested for pesticide residues and food safety standards.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-green-600 to-blue-600 text-white">

        <h2 className="text-3xl font-bold">
          Looking for Bulk Black Pepper Supplier from India?
        </h2>

        <p className="mt-4 text-lg">
          Get premium Tellicherry and Malabar pepper at competitive export pricing.
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
        product="Black Pepper"
      />

    </div>
  );
};

export default BlackPepper;