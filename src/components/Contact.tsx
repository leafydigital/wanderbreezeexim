import React, { useState } from 'react';
import axios from "axios";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';

const Contact: React.FC = () => {


  const [formData, setFormData] = useState({
    company_name: "",
    name: "",
    email: "",
    phone: "",
    country: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  const handleChange = (e: { target: { id: any; value: any; }; }) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setStatus("Sending...");

    try {
      //const response = await axios.post("http://localhost:5000/api/contact", formData);
      const response = await axios.post("https://wanderbreezeexim-backend.vercel.app/api/contact", formData);
      if (response.data.success) {
        setStatus("Message sent successfully!");
        setFormData({ company_name: "", name: "", email: "", phone: "", country:"", message: "" });
      } else {
        setStatus("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setStatus("Error sending message.");
    }
  };


  return (
    <section id="contact" className="py-20 bg-gradient-to-br from-blue-50 to-emerald-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Get In <span className="text-blue-700">Touch</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to place an order or need more information? Contact us for competitive pricing and custom solutions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                  <Mail className="text-blue-700 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-800">Email</h4>
                    <p className="text-gray-600"><a href="mailto:wanderbreezeexim@gmail.com"> wanderbreezeexim@gmail.com</a></p>
                    <p className="text-sm text-gray-500">For quotations and inquiries</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                  <Phone className="text-emerald-600 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-800">Phone</h4>
                    <p className="text-gray-600"><a href="https://wa.me/917358060254" target="_blank" rel="noopener noreferrer"> +91 73580 60254 </a></p>
                    <p className="text-sm text-gray-500">WhatsApp available</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                  <MapPin className="text-orange-600 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-800">Address</h4>
                    <p className="text-gray-600">Wander Breeze Exim, Madathur</p>
                    <p className="text-gray-600">Tenkasi, Tamilnadu, India</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 bg-white rounded-lg shadow-md">
                  <Clock className="text-purple-600 mt-1" size={24} />
                  <div>
                    <h4 className="font-semibold text-gray-800">Business Hours</h4>
                    <p className="text-gray-600">Mon - Fri: 9:00 AM - 6:00 PM IST</p>
                    <p className="text-gray-600">Sat: 9:00 AM - 2:00 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Response Promise */}
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

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Request Quote</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text" id="company_name" value={formData.company_name}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your company name" onChange={handleChange} required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text" id="name" value={formData.name}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name" onChange={handleChange} required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email" id="email" value={formData.email}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com" onChange={handleChange} required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel" id="phone" value={formData.phone}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 234 567 8900" onChange={handleChange} required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text" id="country" value={formData.country}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Destination country" onChange={handleChange} required
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Products Interested In *
                </label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select product category</option>
                  <option value="spices">Spices</option>
                  <option value="dry-fish">Dry Fish</option>
                  <option value="handcrafted">Handcrafted Items</option>
                  <option value="all">All Products</option>
                  <option value="custom">Custom Requirements</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Required
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 500 kg, 1000 units"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements
                </label>
                <textarea
                  rows={4} id="message" value={formData.message} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please specify any special requirements, packaging preferences, or additional details..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-700 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-blue-800 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2 group"
              >
                <Send size={20} className="group-hover:translate-x-1 transition-transform duration-200" />
                <span>Send Quote Request</span>
              </button>
            </form>

            {status && <p className="mt-4 text-center text-gray-700">{status}</p>}

          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;