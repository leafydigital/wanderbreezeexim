import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Cardamom = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title =
      "Green Cardamom Exporter from India | Wander Breeze Exim";
  }, []);

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
            Green Cardamom – Premium Export Grade
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            High-quality Indian green cardamom sourced from premium plantations,
            carefully graded and packed for international spice markets.
          </p>

          <ul className="mt-8 space-y-3 text-gray-700">
            <li>✔ Bold & Uniform Pods</li>
            <li>✔ Strong Aroma & Natural Flavor</li>
            <li>✔ Machine Cleaned & Graded</li>
            <li>✔ Low Moisture Content</li>
            <li>✔ Bulk & Private Label Supply Available</li>
          </ul>

          <div className="mt-10 flex gap-4">
            <button className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition"
              onClick={() => handleNavigation("contact")}>
              Request Container Pricing
            </button>
          </div>
        </div>

        <div>
          <img
            src="/dist/assets/cardamom.png"
            alt="Green Cardamom Export"
            className="rounded-xl shadow-lg"
          />
        </div>
      </section>

      {/* ================= PRODUCT OVERVIEW ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Product Overview
          </h2>

          <p className="mt-6 text-gray-600 leading-relaxed">
            Indian Green Cardamom is one of the most premium spices in the
            global market. Known as the "Queen of Spices", it is valued for
            its intense aroma, rich flavor and medicinal properties. Our
            cardamom is carefully sorted, graded and packed to maintain
            freshness and export-grade quality.
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
              ["Origin", "India"],
              ["Type", "Whole Green Cardamom"],
              ["Moisture", "< 10%"],
              ["Size Grades", "6mm / 7mm / 8mm"],
              ["Color", "Natural Green"],
              ["Admixture", "< 1%"],
              ["Packaging", "5kg / 25kg Export Bags"],
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
              <div>Loading Port: Cochin / Tuticorin</div>
              <div>Container Type: 20’ / 40’ Container</div>
              <div>Approx 8 – 12 MT per container</div>
              <div>Vacuum Packing Available</div>
              <div>Private Label Packaging Available</div>
              <div>Fumigation Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= QUALITY ASSURANCE ================= */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Quality Assurance
          </h2>

          <p className="mt-6 text-gray-600">
            Each batch undergoes strict quality inspection including moisture
            testing, size grading, cleaning and packing to ensure compliance
            with international food safety and export standards.
          </p>
        </div>
      </section>

      {/* ================= FINAL CTA ================= */}
      <section className="py-20 px-6 text-center bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <h2 className="text-3xl font-bold">
          Looking for Reliable Cardamom Exporter from India?
        </h2>

        <p className="mt-4 text-lg">
          Partner with Wander Breeze Exim for premium quality and
          competitive export pricing.
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

export default Cardamom;
