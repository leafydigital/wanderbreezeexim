import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ContactModal from "../../components/ContactModal";

import cocoPeatsImage from '../../../dist/assets/coco-peats.png';

const CocoPeats = () => {

    const location = useLocation();
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        document.title =
            "Coco Peat Exporter from India | Bulk Coco Peat Supplier | Wander Breeze Exim";
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
                        Coco Peat Exporter from India
                    </h1>

                    <p className="mt-6 text-lg text-gray-600">
                        Premium export quality coco peat blocks ideal for hydroponics,
                        greenhouse farming, and horticulture applications.
                    </p>

                    <ul className="mt-8 space-y-3 text-gray-700">
                        <li>✔ 100% Natural & Biodegradable</li>
                        <li>✔ Low EC Available</li>
                        <li>✔ High Water Retention</li>
                        <li>✔ Export Quality Packaging</li>
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
                        src={cocoPeatsImage}
                        alt="Coco Peat Export from India"
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
                        <p className="mt-2 text-gray-600">High Volume Supply Available</p>
                    </div>

                </div>
            </section>

            {/* ================= PRODUCT OVERVIEW ================= */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-5xl mx-auto text-center">

                    <h2 className="text-3xl font-bold text-gray-900">
                        Export Quality Coco Peat
                    </h2>

                    <p className="mt-6 text-gray-600 leading-relaxed">
                        Coco peat is extracted from coconut husk and processed under strict quality
                        control standards. It is widely used in hydroponic systems, greenhouse farming,
                        and horticulture due to its excellent moisture retention and root support properties.
                    </p>

                </div>
            </section>

            {/* ================= TECH SPECS ================= */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">

                    <h2 className="text-3xl font-bold text-center text-gray-900">
                        Technical Specifications – Export Grade Coco Peat
                    </h2>

                    <div className="mt-12 grid md:grid-cols-2 gap-6">

                        {[
                            ["pH Level", "5.5 – 6.8"],
                            ["EC Level", "< 0.5 mS/cm"],
                            ["Moisture", "< 15%"],
                            ["Expansion", "70–75 Litres (5kg block)"],
                            ["Compression Ratio", "5:1"],
                            ["Fiber Content", "2–5%"],
                            ["Sand Content", "< 2%"],
                            ["Grade", "Premium Export Quality"],
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
                            ["5kg Compressed Block", "Expansion: 70–75 Litres"],
                            ["650g / 1kg Bricks", "Retail-friendly packaging"],
                            ["Grow Bags", "Suitable for greenhouse farming"],
                        ].map(([title, desc]) => (
                            <div
                                key={title}
                                className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition"
                            >
                                <h4 className="font-semibold text-blue-600">
                                    {title}
                                </h4>
                                <p className="mt-2 text-gray-600">{desc}</p>
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
                            <div>Container Type: 40’ High Cube</div>
                            <div>Capacity: 4,400 – 4,600 Blocks</div>
                            <div>Weight: 22 – 24 MT</div>
                            <div>Palletized / Non-palletized Available</div>
                            <div>Private Label Packaging Available</div>

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
                        <li>✔ Direct Processing & Quality Control</li>
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
                    Looking for Bulk Coco Peat Supplier from India?
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
                product="Coco Peat"
            />

        </div>
    );
};

export default CocoPeats;