import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { products } from "../data/products";

const Contact: React.FC<{ productDefault?: string; hideInfo?: boolean }> = ({ productDefault = "", hideInfo = false }) => {

  const [formData, setFormData] = useState({
    company_name: "",
    name: "",
    email: "",
    phone: "",
    country: "",
    message: "",
    product: "",
  });

  const [status, setStatus] = useState("");

  // ✅ AUTO SELECT PRODUCT (FOR MODAL)
  useEffect(() => {
    if (productDefault) {
      setFormData((prev) => ({
        ...prev,
        product: productDefault
      }));
    }
  }, [productDefault]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // ✅ SEND ENQUIRY
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      const response = await axios.post(
        "https://wanderbreezeexim-backend.vercel.app/api/contact",
        formData
      );

      if (response.data.success) {
        setStatus("Message sent successfully!");
        setFormData({
          company_name: "",
          name: "",
          email: "",
          phone: "",
          country: "",
          message: "",
          product: productDefault || "", // ✅ retain product in modal
        });
      } else {
        setStatus("Something went wrong.");
      }
    } catch (error) {
      setStatus("Error sending message.");
    }
  };

  // ✅ WHATSAPP REDIRECT WITH DATA
  const handleWhatsApp = () => {

    // ❗ Prevent empty submission
    if (!formData.name || !formData.phone) {
      alert("Please fill Name and Phone before WhatsApp.");
      return;
    }

    const message = `
Hello, I'm interested in your product.

Product: ${formData.product}
Company: ${formData.company_name}
Name: ${formData.name}
Country: ${formData.country}
Phone: ${formData.phone}

Requirement:
${formData.message}
    `;

    const url = `https://wa.me/917358060254?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 to-emerald-50">

      <div className="container mx-auto px-4">
        <div className={`grid ${hideInfo ? "grid-cols-1" : "lg:grid-cols-2"} gap-12`}>

          {/* LEFT SIDE */}
          {!hideInfo && (
            <div className="space-y-8">

              {/* ✅ YOUR ORIGINAL CONTENT KEPT EXACTLY */}

              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h3>

                <div className="space-y-6">

                  <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                    <Mail className="text-blue-700 mt-1" size={24} />
                    <div>
                      <h4 className="font-semibold text-gray-800">Email</h4>
                      <p className="text-gray-600">
                        <a href="mailto:contact@wanderbreezeexim.com">
                          contact@wanderbreezeexim.com
                        </a>
                      </p>
                      <p className="text-sm text-gray-500">For quotations and inquiries</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                    <Phone className="text-emerald-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-semibold text-gray-800">Phone</h4>
                      <p className="text-gray-600">
                        <a href="https://wa.me/917358060254" target="_blank">
                          +91 73580 60254
                        </a>
                      </p>
                      <p className="text-sm text-gray-500">WhatsApp available</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                    <MapPin className="text-orange-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-semibold text-gray-800">Address</h4>
                      <p className="text-gray-600">Wander Breeze Exim, Mannammoola</p>
                      <p className="text-gray-600">Thiruvananthapuram, Kerala, India</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                    <Clock className="text-purple-600 mt-1" size={24} />
                    <div>
                      <h4 className="font-semibold text-gray-800">Business Hours</h4>
                      <p className="text-gray-600">Mon - Sat: 8:00 AM - 8:00 PM IST</p>
                      <p className="text-gray-600">Sun: 9:00 AM - 2:00 PM IST</p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-700">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                  <MessageSquare className="text-blue-700" size={20} />
                  <span>Quick Response Guarantee</span>
                </h4>
                <p className="text-gray-600 text-sm">
                  We respond to all quotation requests within 24 hours.
                  For urgent inquiries, WhatsApp us for immediate assistance.
                </p>
              </div>

            </div>
          )}

          {/* FORM (UNCHANGED DESIGN) */}
          <div className="bg-white p-8 rounded-xl shadow-lg">

            <h3 className="text-2xl font-bold mb-6">Request Quote</h3>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ✅ PRODUCT DROPDOWN */}
              <select
                id="product"
                value={formData.product}
                onChange={handleChange}
                required
                className="w-full p-3 border rounded-lg"
                disabled={!!productDefault} // ✅ lock in modal
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* REST SAME */}
              <input id="company_name" placeholder="Company Name" value={formData.company_name} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
              <input id="name" placeholder="Name" value={formData.name} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
              <input id="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
              <input id="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required className="w-full p-3 border rounded-lg" />
              <input id="country" placeholder="Country" value={formData.country} onChange={handleChange} required className="w-full p-3 border rounded-lg" />

              <textarea id="message" placeholder="Requirement" value={formData.message} onChange={handleChange} required className="w-full p-3 border rounded-lg" />

              {/* BUTTONS */}
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg">
                Send Enquiry
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full bg-green-600 text-white py-3 rounded-lg"
              >
                Chat on WhatsApp
              </button>

            </form>

            {status && <p className="mt-4 text-center">{status}</p>}
          </div>
        </div>
      </div>


    </section>
  );
};

export default Contact;