import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const CocoPeats = () => {

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        document.title =
            "Coco Peat Exporter from India | Wander Breeze Exim";
    }, []);

    // Handle scroll or page navigation
    const handleNavigation = (section: string) => {
        setIsMenuOpen(false);

        // If Payment Terms → go to new page
        if (section === 'paymentterms') {
            navigate('/payment-terms');
            return;
        }

        // If already on homepage → scroll
        if (location.pathname === '/') {
            const element = document.getElementById(section);
            if (element) {
                const navbarHeight = 80;
                const targetPosition = element.offsetTop - navbarHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        }
        // If on another page → first go to homepage, then scroll
        else {
            navigate('/');
            setTimeout(() => {
                const element = document.getElementById(section);
                if (element) {
                    const navbarHeight = 80;
                    const targetPosition = element.offsetTop - navbarHeight;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
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
                        Coco Peat (Coir Pith)
                    </h1>

                    <p className="mt-6 text-lg text-gray-600">
                        Premium export-grade compressed coco peat blocks ideal for
                        hydroponics, greenhouse farming and horticulture applications.
                    </p>

                    <ul className="mt-8 space-y-3 text-gray-700">
                        <li>✔ 100% Natural & Biodegradable</li>
                        <li>✔ Low EC Available</li>
                        <li>✔ High Water Retention</li>
                        <li>✔ Export Quality Packaging</li>
                        <li>✔ Custom Branding Available</li>
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
                        src="/dist/assets/coco-peats.png"
                        alt="Coco Peat Export"
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
                        Coco Peat (Coir Pith) is extracted from coconut husk and processed
                        under strict quality control standards. It is washed, dried and
                        compressed to meet international export requirements. Widely used
                        in hydroponic systems and greenhouse cultivation, coco peat ensures
                        optimal root growth and moisture retention.
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
                            ["pH Level", "5.5 – 6.8"],
                            ["EC Level", "< 0.5 mS/cm (Low EC Available)"],
                            ["Moisture", "< 15%"],
                            ["Expansion", "70–75 Litres per 5kg block"],
                            ["Compression Ratio", "5:1"],
                            ["Fiber Content", "2–5%"],
                            ["Sand Content", "< 2%"],
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

                    <p className="text-center mt-6 text-sm text-gray-500">
                        Custom specifications available as per buyer requirement.
                    </p>
                </div>
            </section>

            {/* ================= VARIANTS ================= */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900">
                        Available Variants
                    </h2>

                    <div className="mt-12 grid md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "5kg Compressed Block",
                                desc: "Expansion: 70–75 Litres. Ideal for bulk export shipments.",
                            },
                            {
                                title: "650g / 1kg Bricks",
                                desc: "Retail-friendly packaging for garden centers.",
                            },
                            {
                                title: "Grow Bags",
                                desc: "Suitable for tomato, cucumber and strawberry farming.",
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition"
                            >
                                <h4 className="font-semibold text-blue-600">
                                    {item.title}
                                </h4>
                                <p className="mt-2 text-gray-600">{item.desc}</p>
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
                            <div>4,400 – 4,600 blocks per container</div>
                            <div>Net Weight: 22–24 MT</div>
                            <div>Palletized / Non-palletized available</div>
                            <div>Private labeling available</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= CERTIFICATIONS ================= */}
            {/* <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Documentation & Certifications
          </h2>

          <ul className="mt-8 space-y-3 text-gray-600">
            <li>Phytosanitary Certificate</li>
            <li>Certificate of Origin</li>
            <li>Fumigation Certificate</li>
            <li>Lab Test Report</li>
            <li>MSDS (If Required)</li>
          </ul>
        </div>
      </section> */}

            {/* ================= FINAL CTA ================= */}
            <section className="py-20 px-6 text-center bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <h2 className="text-3xl font-bold">
                    Looking for Reliable Coco Peat Supplier from India?
                </h2>

                <p className="mt-4 text-lg">
                    Contact Wander Breeze Exim for competitive pricing and consistent supply.
                </p>

                <div className="mt-8 flex justify-center gap-4">
                    <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                        onClick={() => handleNavigation("contact")}>
                        Request Price
                    </button>
                </div>
            </section>

        </div>
    );
};

export default CocoPeats;
