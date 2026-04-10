import React, { useEffect } from "react";
import pepperImage from "../../dist/assets/Pepper.png";

const BlackPepperExportFromIndia = () => {

    useEffect(() => {
        document.title =
            "Bulk Black Pepper Export from Kerala | Tellicherry & 500 GL Supplier";
    }, []);

    const whatsappLink =
        "https://wa.me/917358060254?text=Hello%20I%20am%20interested%20in%20importing%20black%20pepper%20from%20India.%20Please%20share%20price%20and%20details.";

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
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                        Bulk Black Pepper Export from Kerala (India)
                    </h1>

                    <p className="mt-6 text-lg text-gray-600">
                        Tellicherry (TGEB), MG1 & 500–600 GL | High Piperine | Ready Stock
                    </p>

                    <p className="mt-4 text-green-600 font-semibold">
                        ✔ MOQ 500 KG | ✔ Fast Dispatch | ✔ Export Documentation Included
                    </p>

                    <a
                        href={whatsappLink}
                        target="_blank"
                        className="mt-8 inline-block bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-lg"
                    >
                        Get Price & Stock Now
                    </a>
                </div>

                <div>
                    <img
                        src={pepperImage}
                        alt="Kerala Black Pepper Export"
                        className="rounded-xl shadow-xl"
                    />
                </div>

            </section>

            {/* ================= TARGET BUYERS ================= */}
            <section className="py-16 px-6 bg-white text-center">
                <h2 className="text-2xl font-bold">
                    Who This Supply Is For
                </h2>

                <div className="mt-8 grid md:grid-cols-3 gap-6 text-gray-700">
                    <p>✔ Importers & Distributors</p>
                    <p>✔ Spice Wholesalers</p>
                    <p>✔ Food Processing Companies</p>
                </div>
            </section>

            {/* ================= QUICK INFO ================= */}
            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-center">

                    {[
                        ["Origin", "Kerala (Malabar Region – Premium Spice Belt)"],
                        ["MOQ", "500 KG+"],
                        ["Supply", "Bulk Export Ready"],
                    ].map(([t, v]) => (
                        <div key={t} className="p-6 shadow rounded-xl bg-white">
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
                        Export Specifications
                    </h2>

                    <p className="text-center text-gray-600 mt-4">
                        Quick overview for buyers
                    </p>

                    <div className="mt-12 grid md:grid-cols-2 gap-6">
                        {[
                            ["Grades", "TGEB / TGSEB / MG1 / 500–600 GL"],
                            ["Density", "500 – 630 GL"],
                            ["Moisture", "Max 11% – 12%"],
                            ["Piperine", "4% – 7%"],
                            ["Extraneous Matter", "< 0.5%"],
                            ["HS Code", "090411"],
                            ["Processing", "Machine Cleaned & Sterilized"],
                            ["Quality", "ASTA Clean / EU Compliant"],
                        ].map(([k, v]) => (
                            <div key={k} className="bg-white p-6 rounded-xl shadow">
                                <h4 className="font-semibold text-blue-600">{k}</h4>
                                <p className="mt-2 text-gray-600">{v}</p>
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ================= WHY US ================= */}
            <section className="py-20 px-6 bg-white text-center">
                <h2 className="text-3xl font-bold">Why Buyers Choose Us</h2>

                <div className="mt-10 grid md:grid-cols-2 gap-6 text-gray-700">
                    <p>✔ Direct sourcing from Kerala plantations</p>
                    <p>✔ Consistent export quality batches</p>
                    <p>✔ High piperine content</p>
                    <p>✔ Fast dispatch</p>
                    <p>✔ Full export documentation</p>
                    <p>✔ Competitive pricing</p>
                </div>
            </section>

            {/* ================= PACKAGING ================= */}
            <section className="py-20 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white text-center">
                <h2 className="text-3xl font-bold">Packaging & Shipping</h2>

                <div className="mt-8 space-y-2 text-lg">
                    <p>25kg / 50kg PP or Jute Bags</p>
                    <p>Vacuum Liners Available</p>
                    <p>Ports: Cochin / Tuticorin</p>
                    <p>FOB / CIF / CFR Available</p>
                </div>

                <p className="mt-6 text-yellow-200 font-semibold">
                    Premium Grades Limited – Book Early
                </p>
            </section>

            {/* ================= QUICK CTA ================= */}
            <section className="py-16 text-center bg-gray-900 text-white">
                <h2 className="text-2xl font-bold">
                    Need Price & Availability Now?
                </h2>

                <p className="mt-4">
                    Message us on WhatsApp for instant response
                </p>

                <a
                    href={whatsappLink}
                    target="_blank"
                    className="mt-6 inline-block bg-green-500 px-8 py-3 rounded-lg font-semibold"
                >
                    Chat on WhatsApp
                </a>
            </section>

            {/* ================= PROCESS ================= */}

            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">

                    <h2 className="text-3xl font-bold text-center">Order Process</h2>

                    <div className="mt-10 space-y-3 text-gray-700">
                        {[
                            "Confirm grade & quantity",
                            "Proforma Invoice shared",
                            "Advance payment",
                            "Processing & packing",
                            "Shipment dispatch",
                            "BL copy shared",
                            "Balance payment",
                            "Documents released",
                        ].map((step, i) => (
                            <div key={i} className="bg-white p-4 rounded-lg shadow">
                                {i + 1}. {step}
                            </div>
                        ))}
                    </div>

                </div>
            </section>

            {/* ================= FINAL CTA ================= */}
            <section className="py-20 text-center bg-gradient-to-r from-blue-600 to-green-600 text-white">

                <h2 className="text-3xl font-bold">
                    Ready to Import Black Pepper from India?
                </h2>

                <p className="mt-4">
                    Get price, lab reports & shipment schedule instantly
                </p>

                <a
                    href={whatsappLink}
                    target="_blank"
                    className="mt-8 inline-block bg-white text-green-700 px-8 py-3 rounded-lg font-semibold"
                >
                    Chat on WhatsApp Now
                </a>

            </section>

        </div>
    );
};

export default BlackPepperExportFromIndia;