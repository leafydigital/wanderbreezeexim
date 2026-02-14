import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Banana = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState("home");

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        document.title =
            "G9 Banana Exporter from India | Wander Breeze Exim";
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
                        G9 Banana (Cavendish) – Premium Export Grade
                    </h1>

                    <p className="mt-6 text-lg text-gray-600">
                        High-quality G9 Cavendish bananas sourced from certified farms,
                        carefully graded and packed for international export markets.
                    </p>

                    <ul className="mt-8 space-y-3 text-gray-700">
                        <li>✔ Uniform Size & Color</li>
                        <li>✔ Long Shelf Life</li>
                        <li>✔ Export Grade Sorting</li>
                        <li>✔ Controlled Ripening Stage</li>
                        <li>✔ Bulk Container Supply Available</li>
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
                        src="/dist/assets/Banana.png"
                        alt="G9 Banana Export"
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
                        G9 Banana (Cavendish) is one of the most demanded banana varieties
                        in international markets. Known for its uniform size, attractive
                        yellow color, and longer shelf life, our bananas are harvested at
                        optimal maturity and packed under strict export standards.
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
                            ["Variety", "G9 (Cavendish)"],
                            ["Length", "20cm Minimum (5–7 Hands)"],
                            ["Weight per Carton", "13kg / 13.5kg"],
                            ["Color", "Green (Export Stage)"],
                            ["Shelf Life", "20 – 25 Days"],
                            ["Packaging", "Corrugated Export Cartons"],
                            ["Container Capacity", "1,500 – 1,600 Cartons (40’HC)"],
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
                            <div>Loading Port: Tuticorin / Chennai</div>
                            <div>Container Type: 40’ Reefer Container</div>
                            <div>Temperature: 13–14°C</div>
                            <div>Approx 20 – 22 MT per container</div>
                            <div>1,500 – 1,600 Cartons per container</div>
                            <div>Ethylene Treatment (If Required)</div>
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
                        Every shipment undergoes strict quality inspection including size
                        grading, blemish checking, and maturity testing to meet
                        international export standards. We ensure consistent supply and
                        competitive pricing.
                    </p>
                </div>
            </section>

            {/* ================= FINAL CTA ================= */}
            <section className="py-20 px-6 text-center bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <h2 className="text-3xl font-bold">
                    Looking for Reliable G9 Banana Exporter from India?
                </h2>

                <p className="mt-4 text-lg">
                    Partner with Wander Breeze Exim for consistent quality and
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

export default Banana;
