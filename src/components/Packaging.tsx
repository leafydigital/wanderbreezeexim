import React from "react";
import { Package, CheckCircle } from "lucide-react";

const packingData = [
  {
    product: "Spices (Cardamom, Pepper)",
    items: [
      "25kg / 50kg Jute Bags",
      "Vacuum Packing (for premium buyers)",
      "PP Bags with inner lining",
      "Custom retail packaging available"
    ]
  },
  {
    product: "Fresh Vegetables (Onion, Sweet Potato)",
    items: [
      "Mesh Bags (5kg / 10kg / 25kg)",
      "Corrugated Carton Boxes",
      "Ventilated packaging for freshness",
      "Custom branding available"
    ]
  },
  {
    product: "Coconut & Agro Products",
    items: [
      "HDPE Bags",
      "Gunny Bags",
      "Bulk packaging for container loads",
      "Customized export packaging"
    ]
  }
];

const Packing: React.FC = () => {
  return (
    <section className="py-20 bg-white" id="packing">
      <div className="container mx-auto px-4">

        <div className="text-center mb-12">
          <Package className="mx-auto text-blue-700 mb-4" size={48} />
          <h2 className="text-4xl font-bold text-gray-800">
            Product <span className="text-blue-700">Packaging Options</span>
          </h2>
          <p className="text-gray-600 mt-3">
            Flexible packaging solutions based on buyer requirements and international standards.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {packingData.map((item, i) => (
            <div key={i} className="bg-gray-50 p-6 rounded-xl border hover:shadow-lg">
              <h3 className="text-lg font-semibold text-blue-700 mb-4">
                {item.product}
              </h3>

              {item.items.map((pack, idx) => (
                <div key={idx} className="flex items-center space-x-2 mb-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm text-gray-700">{pack}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Packing;