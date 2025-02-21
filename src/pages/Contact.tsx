import React, { useState } from "react";
import axios from "axios";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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
      const response = await axios.post("https://wanderbreezeexim-backend.vercel.app/api/contact", formData);
      if (response.data.success) {
        setStatus("Message sent successfully!");
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setStatus("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setStatus("Error sending message.");
    }
  };

  return (
    <div className="bg-gray-50 py-16 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" id="name" value={formData.name} onChange={handleChange} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" value={formData.email} onChange={handleChange} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                <input type="tel" id="phone" value={formData.phone} onChange={handleChange} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                <textarea id="message" rows={4} value={formData.message} onChange={handleChange} required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                ></textarea>
              </div>
              <button type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Send Message
              </button>
            </form>
            {status && <p className="mt-4 text-center text-gray-700">{status}</p>}
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-6">
              <div className="flex items-center">
                <Mail className="h-6 w-6 text-blue-600" />
                <span className="ml-3 text-gray-600"> <a href="mailto:wanderbreezeexim@gmail.com"> wanderbreezeexim@gmail.com</a></span>
              </div>
              <div className="flex items-center">
                <Phone className="h-6 w-6 text-blue-600" />
                <span className="ml-3 text-gray-600"><a href="https://wa.me/917871126830" target="_blank" rel="noopener noreferrer"> +91 7871126830</a></span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-6 w-6 text-blue-600" />
                <span className="ml-3 text-gray-600">Tenkasi, Tamilnadu - India</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
