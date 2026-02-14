import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Coconut = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title =
      "Semi Husked Coconut Exporter from India | Wander Breeze Exim";
  }, []);

  // Handle scroll or page navigation
  const handleNavigation = (section: string) => {
    setIsMenuOpen(false);

    if (section === "paymentterms") {
      navigate("/payment-terms");
      return;
    }

    if (location.pathname === "/") {
      const element = document.getElementById(section);
      if (element) {
        const navbarHeight = 80;
        const targetPosition = element.offsetTop - navbarHeight;
        window.scrollTo({ top: targetPosition, behavior: "smooth" });
      }
    } else {
      navigate("/");
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          const navbarHeight = 80;
          const targetPosition = element.offsetTop - navbarHeight;
          window.scrollTo({ top: targetPosition, behavior: "smooth" });
        }
      }, 300);
    }
  };

  return (
    <div className="bg-gray-50">

      {/* ================= HERO SECTION ================= */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Semi Husked Coconut – Export Grade
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Premium quality semi-husked coconuts sourced directly from
            Pollachi farms, ideal for international export markets.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            <li>✔ Fully Matured Nuts</li>
            <li>✔ Long Shelf Life (45–60 Days)</li>
            <li>✔ Uniform Size Grading</li>
            <li>✔ Export Standard Packaging</li>
            <li>✔ Bulk Container Supply Available</li>
          </ul>

          <div className="mt-10 flex gap-4">
            <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition" 
             onClick={() => handleNavigation("contact")}>
              Request Container Pricing
            </button>

            {/* <button className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition">
              Download Product Specification
            </button> */}
          </div>
        </div>

        <div>
          <img
            src="/dist/assets/coconut.png"
            alt="Semi Husked Coconut Export"
            className="rounded-xl shadow-lg"
          />
        </div>
      </section>

      {/* ================= OVERVIEW ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Product Overview
          </h2>

          <p className="mt-6 text-gray-600 leading-relaxed">
            Our semi-husked coconuts are carefully selected from premium
            farms in Pollachi, India. Each nut is fully matured and processed
            under strict quality inspection to ensure long shelf life and
            consistent export-grade quality suitable for global markets.
          </p>
        </div>
      </section>

      {/* ================= TECHNICAL SPECIFICATIONS ================= */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Technical Specifications
          </h2>

          <div className="mt-12 grid md:grid-cols-2 gap-6">
            {[
              ["Type", "Semi Husked Coconut"],
              ["Origin", "Pollachi, India"],
              ["Weight Range", "500g – 800g (Customizable)"],
              ["Shelf Life", "45 – 60 Days"],
              ["Maturity", "Fully Matured"],
              ["Packaging", "13kg / 12.5kg Bags"],
              ["Container Capacity", "25,000 – 26,000 Nuts (40’HC)"],
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

      {/* ================= PACKAGING & LOADING ================= */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Export Packaging & Container Loading
          </h2>

          <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-10 shadow-lg">
            <div className="grid md:grid-cols-2 gap-6 text-lg">
              <div>Loading Port: Cochin / Tuticorin / Chennai</div>
              <div>Container Type: 40’ High Cube</div>
              <div>Approx 24 – 26 MT per container</div>
              <div>25,000 – 26,000 nuts per container</div>
              <div>Packed in Gunny / PP Bags</div>
              <div>Custom Branding Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <h2 className="text-3xl font-bold">
          Looking for Reliable Coconut Exporter from India?
        </h2>

        <p className="mt-4 text-lg">
          Contact Wander Breeze Exim for competitive pricing and
          consistent bulk supply.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <button
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            onClick={() => handleNavigation("contact")}
          >
            Request Price
          </button>
        </div>
      </section>

    </div>
  );
};

export default Coconut;
