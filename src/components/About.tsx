import React from "react";
import { Globe, Award, Shield } from "lucide-react";

const About: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">

        {/* HEADER */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            About <span className="text-blue-700">Wander Breeze Exim</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Trusted bulk spices exporter from India delivering premium quality
            cardamom, black pepper, and coconuts to global buyers.
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* LEFT TEXT */}
          <div className="space-y-6">

            <p className="text-gray-600 leading-relaxed">
              Wander Breeze Exim is a reliable <strong>bulk spices exporter from India</strong>,
              specializing in high-quality agricultural products including
              <strong> 8mm bold cardamom</strong>, <strong>550 GL black pepper</strong>,
              and <strong>export-grade coconuts</strong>. We operate with international
              compliance standards such as EU MRL, ASTA, and Spices Board certifications,
              ensuring safe and consistent supply.
            </p>

            <p className="text-gray-600 leading-relaxed">
              With strong sourcing networks across Kerala and Tamil Nadu, we follow a
              <strong> direct farm sourcing model</strong> that guarantees better pricing,
              quality control, and year-round availability for bulk buyers.
            </p>

            <p className="text-gray-600 leading-relaxed">
              Our logistics system is designed for efficient export handling,
              ensuring products are packed, tested, and shipped with
              <strong> zero compromise on quality</strong>.
            </p>

          </div>

          {/* RIGHT FEATURES */}
          <div className="grid gap-6">

            <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl border hover:shadow-lg">
              <Globe className="text-blue-700" size={28} />
              <div>
                <h3 className="font-semibold text-gray-800">Direct Sourcing</h3>
                <p className="text-sm text-gray-600">
                  Sourced directly from farms across Kerala & Tamil Nadu for better pricing and quality.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl border hover:shadow-lg">
              <Award className="text-emerald-600" size={28} />
              <div>
                <h3 className="font-semibold text-gray-800">Premium Quality</h3>
                <p className="text-sm text-gray-600">
                  High oil content, proper grading, and export-ready processing.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl border hover:shadow-lg">
              <Shield className="text-orange-600" size={28} />
              <div>
                <h3 className="font-semibold text-gray-800">Global Compliance</h3>
                <p className="text-sm text-gray-600">
                  EU MRL compliant, lab-tested, and aligned with international standards.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM STRIP */}
        <div className="mt-16 bg-gradient-to-r from-blue-700 to-emerald-600 text-white p-8 rounded-xl text-center">
          <h3 className="text-2xl font-bold mb-3">
            Reliable Export Partner for Bulk Buyers
          </h3>
          <p className="max-w-2xl mx-auto">
            From sourcing to shipment, we ensure consistency, transparency, and
            long-term supply support for global importers.
          </p>
        </div>

      </div>
    </section>
  );
};

export default About;