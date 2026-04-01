import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ContactModal from "../../components/ContactModal";
import coconutImage from "../../../dist/assets/Coconut.png";

const Coconut = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title =
      "Indian Coconut Exporter | Semi Husked & Fully Husked Coconut Supplier";
  }, []);

  return (
    <div className="bg-gray-50">

      {/* ================= HERO ================= */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">

        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Indian Coconut Exporter – Bulk Semi Husked & Fully Husked Supplier
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Wander Breeze Exim is a trusted Indian coconut exporter supplying premium
            semi-husked and fully husked coconuts sourced from Pollachi and South India.
            Export-ready coconuts with high water content, strong shell, and long shelf life.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            <li>✔ Matured Coconuts (12–13 Months Harvest)</li>
            <li>✔ Weight Range: 600g – 800g+</li>
            <li>✔ Shelf Life: 50–70 Days</li>
            <li>✔ HS Code: 08011910</li>
            <li>✔ Export Standard Packaging (25kg Bags)</li>
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
            src={coconutImage}
            alt="Indian Coconut Exporter - Semi Husked Coconut Bulk Supply"
            className="rounded-xl shadow-lg"
          />
        </div>

      </section>

      {/* ================= QUICK INFO ================= */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-center">

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Origin</h4>
            <p className="mt-2 text-gray-600">Pollachi / Tamil Nadu / Kerala</p>
          </div>

          <div className="p-6 shadow rounded-xl">
            <h4 className="font-semibold text-blue-600">Minimum Order</h4>
            <p className="mt-2 text-gray-600">1 x 40ft Container</p>
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
            Fresh Indian Coconuts for Global Export Market
          </h2>

          <p className="mt-6 text-gray-600 leading-relaxed">
            Our coconuts are sourced from premium coconut belts like Pollachi,
            Tamil Nadu, and Kerala. Known for their sweetness, thick kernel,
            and high oil content, these coconuts are ideal for export markets
            including GCC, Europe, and Southeast Asia.
          </p>

          <p className="mt-4 text-gray-600 leading-relaxed">
            Each coconut undergoes a strict 3-stage quality check process to ensure
            zero spoilage during international shipping.
          </p>

        </div>
      </section>

      {/* ================= TECH SPECS ================= */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Technical Specifications – Export Grade Coconut
          </h2>

          <div className="mt-12 grid md:grid-cols-2 gap-6">

            {[
              ["Origin", "Pollachi / Tamil Nadu / Kerala, India"],
              ["HS Code", "08011910"],
              ["Nut Weight", "500g – 800g+"],
              ["Circumference", "12 – 14 Inches"],
              ["Type", "Semi Husked / Fully Husked"],
              ["Shelf Life", "50 – 70 Days"],
              ["Packaging", "25kg PP Bags (25–30 Nuts)"],
              ["Loadability (20ft)", "13 – 15 MT"],
              ["Loadability (40ft)", "27 – 28 MT"],
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
            Export Packaging & Container Loading Details
          </h2>

          <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-10 shadow-lg">

            <div className="grid md:grid-cols-2 gap-6 text-lg">
              <div>Loading Ports: Cochin / Tuticorin / Chennai</div>
              <div>Container Type: 20ft / 40ft High Cube</div>
              <div>Capacity: 45,000 – 55,000 Nuts</div>
              <div>Weight: 13MT / 27MT</div>
              <div>Packing: PP Bags / Mesh Bags</div>
              <div>Phytosanitary Certification Provided</div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-yellow-200 font-semibold">
                ⚠️ Limited Weekly Export Slots – Contact Early to Reserve Shipment
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= QUALITY ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">

          <h2 className="text-3xl font-bold text-center text-gray-900">
            Quality Assurance & Export Logistics
          </h2>

          <ul className="mt-10 space-y-4 text-gray-700">
            <li>✔ Fungal prevention through proper husk trimming</li>
            <li>✔ Climate-controlled shipping (10°C–12°C)</li>
            <li>✔ Moisture protection for long transit</li>
            <li>✔ Export documents: Phytosanitary, COO, Fumigation</li>
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
              <h4 className="font-semibold">What is the HS Code for coconut export?</h4>
              <p>HS Code is 08011910 for fresh coconuts from India.</p>
            </div>

            <div>
              <h4 className="font-semibold">How many coconuts fit in a container?</h4>
              <p>A 40ft container can load around 45,000 to 55,000 coconuts.</p>
            </div>

            <div>
              <h4 className="font-semibold">What is the shelf life?</h4>
              <p>50–70 days under proper storage conditions.</p>
            </div>

            <div>
              <h4 className="font-semibold">Why Pollachi coconuts?</h4>
              <p>High oil content, better taste, and strong durability.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-green-600 to-blue-600 text-white">

        <h2 className="text-3xl font-bold">
          Looking for Bulk Coconut Supplier from India?
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

      {/* ================= MODAL ================= */}
      <ContactModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product="Coconut"
      />

    </div>
  );
};

export default Coconut;