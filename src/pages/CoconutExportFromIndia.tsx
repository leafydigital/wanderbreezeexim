import React, { useEffect } from "react";
import coconutImage from "../../dist/assets/Coconut.png";

const CoconutExportFromIndia = () => {

    useEffect(() => {
        document.title =
            "Bulk Coconut Export from India | Semi Husked & Fully Husked Supplier";
    }, []);

    const whatsappLink =
        "https://wa.me/917358060254?text=Hello%20I%20am%20interested%20in%20importing%20coconuts%20from%20India.%20Please%20share%20details.";

    return (
        <div className="bg-gray-50 relative">

            {/* ================= STICKY WHATSAPP ================= */}
            {/* <a
                href={whatsappLink}
                target="_blank"
                className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-lg z-50"
            >
                WhatsApp
            </a> */}

            {/* ================= HERO ================= */}
            <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">

                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                        Bulk Coconut Export from India
                    </h1>

                    <p className="mt-6 text-lg text-gray-600">
                        Semi Husked & Fully Husked Coconuts | Container Load Supply | Fast Dispatch & Reliable Export Support
                    </p>

                    <a
                        href={whatsappLink}
                        target="_blank"
                        className="mt-8 inline-block bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:opacity-90"
                    >
                        Get Latest Price
                    </a>
                </div>

                <div>
                    <img
                        src={coconutImage}
                        alt="Indian Coconut Export"
                        className="rounded-xl shadow-xl"
                    />
                </div>

            </section>

            {/* ================= QUICK INFO ================= */}
            <section className="py-16 px-6 bg-white">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-center">

                    {[
                        ["Origin", "Pollachi / South India"],
                        ["MOQ", "1 x 40ft Container"],
                        ["Supply", "High Volume Ready"],
                    ].map(([t, v]) => (
                        <div key={t} className="p-6 shadow rounded-xl hover:shadow-lg">
                            <h4 className="font-semibold text-blue-600">{t}</h4>
                            <p className="mt-2 text-gray-600">{v}</p>
                        </div>
                    ))}

                </div>
            </section>

            {/* ================= SPECIFICATIONS ================= */}
            <section className="py-20 px-6">
                <div className="max-w-6xl mx-auto">

                    <h2 className="text-3xl font-bold text-center">
                        Export Grade Specifications
                    </h2>

                    <div className="mt-12 grid md:grid-cols-2 gap-6">
                        {[
                            ["Harvest Age", "12–13 Months"],
                            ["Weight", "500g – 800g+"],
                            ["Type", "Semi Husked / Fully Husked"],
                            ["Shelf Life", "50–70 Days"],
                            ["HS Code", "08011910"],
                            ["Quality", "Hand Sorted Export Grade"],
                            ["Moisture", "Controlled"],
                            ["Inspection", "3-Level Quality Check"],
                        ].map(([k, v]) => (
                            <div key={k} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg">
                                <h4 className="font-semibold text-blue-600">{k}</h4>
                                <p className="mt-2 text-gray-600">{v}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ================= PACKAGING ================= */}
            <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <div className="max-w-6xl mx-auto">

                    <h2 className="text-3xl font-bold text-center">
                        Packaging & Container Details
                    </h2>

                    <div className="mt-10 grid md:grid-cols-2 gap-6 text-lg">
                        <p>PP / Mesh Bags</p>
                        <p>25kg per bag</p>
                        <p>25–30 nuts per bag</p>
                        <p>45,000 – 55,000 nuts/container</p>
                        <p>20ft: 13–15 MT</p>
                        <p>40ft: 27–28 MT</p>
                    </div>

                    <p className="mt-6 text-center text-yellow-200 font-semibold">
                        Designed for long-distance export with minimal spoilage
                    </p>

                </div>
            </section>

            {/* ================= SHIPPING ================= */}
            <section className="py-20 px-6 bg-white text-center">
                <h2 className="text-3xl font-bold">Shipping & Logistics</h2>

                <div className="mt-8 space-y-2 text-gray-700">
                    <p>Ports: Cochin / Tuticorin / Chennai</p>
                    <p>Transit Time: 5–10 Days</p>
                    <p>Shipment: Sea Freight (FCL)</p>
                </div>
            </section>

            {/* ================= PROCESS ================= */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">

                    <h2 className="text-3xl font-bold text-center">Order Process</h2>

                    <div className="mt-10 space-y-3 text-gray-700">
                        {[
                            "Confirm quantity & specifications",
                            "Proforma Invoice shared",
                            "70% advance payment",
                            "Procurement & packing",
                            "Container loading & dispatch",
                            "BL copy shared",
                            "30% balance payment",
                            "Documents released",
                        ].map((step, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg shadow">
                                {i + 1}. {step}
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ================= RESPONSIBILITY ================= */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">

                    <div>
                        <h3 className="text-xl font-bold mb-4">We Handle</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li>✔ Sourcing & Quality</li>
                            <li>✔ Packing</li>
                            <li>✔ Export Clearance</li>
                            <li>✔ Documentation</li>
                            <li>✔ Container Loading</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4">Buyer Handles</h3>
                        <ul className="space-y-2 text-gray-700">
                            <li>✔ Import Clearance</li>
                            <li>✔ Customs Duties</li>
                            <li>✔ Local Delivery</li>
                        </ul>
                    </div>

                </div>
            </section>

            {/* ================= TIMELINE ================= */}
            <section className="py-20 px-6 text-center bg-gradient-to-r from-blue-600 to-green-600 text-white">
                <h2 className="text-3xl font-bold">Delivery Timeline</h2>
                <p className="mt-6">
                    Order: 1 Day | Preparation: 3–5 Days | Transit: 5–10 Days
                </p>
            </section>

            {/* ================= FINAL CTA ================= */}
            <section className="py-20 px-6 text-center bg-gray-900 text-white">

                <h2 className="text-3xl font-bold">
                    Ready to Import Coconuts from India?
                </h2>

                <p className="mt-4 text-lg">
                    Get pricing, packing videos & shipment schedule instantly
                </p>

                <a
                    href={whatsappLink}
                    target="_blank"
                    className="mt-8 inline-block bg-green-500 px-8 py-3 rounded-lg font-semibold hover:bg-green-600"
                >
                    Chat on WhatsApp Now
                </a>

            </section>

        </div>
    );
};

export default CoconutExportFromIndia;