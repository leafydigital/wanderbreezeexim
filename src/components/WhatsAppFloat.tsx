import { MessageCircle } from "lucide-react";

const WhatsAppFloat = () => {
  const phoneNumber = "+917358060254"; // Example: 919876543210
  const message = "Hello, I'm interested in your export products.";

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group"
      title="Send Message on WhatsApp"
    >
      <div className="relative">

        {/* Pulse Animation */}
        <span className="absolute inline-flex h-16 w-16 rounded-full bg-green-500 opacity-30 animate-ping"></span>

        {/* WhatsApp Button */}
        <div className="relative flex items-center justify-center h-16 w-16 rounded-full bg-green-500 shadow-xl hover:scale-110 transition transform">

          {/* Official WhatsApp SVG */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="white"
            className="w-8 h-8"
          >
            <path d="M16 .5C7.5.5.5 7.5.5 16c0 2.8.7 5.4 2 7.7L.5 31.5l8-2c2.2 1.2 4.7 1.9 7.5 1.9 8.5 0 15.5-7 15.5-15.5S24.5.5 16 .5zm0 28.5c-2.4 0-4.6-.6-6.6-1.7l-.5-.3-4.7 1.2 1.3-4.6-.3-.5C3.1 21 2.5 18.8 2.5 16 2.5 8.6 8.6 2.5 16 2.5S29.5 8.6 29.5 16 23.4 29 16 29zm7.2-9.5c-.4-.2-2.3-1.1-2.6-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.1-.8.1-.1.4-.4.5-.6.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6 0-.2-.9-2.2-1.2-3-.3-.7-.6-.6-.9-.6h-.8c-.3 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.6 5.6 5 .8.3 1.4.5 1.9.7.8.2 1.5.2 2 .1.6-.1 2.3-.9 2.6-1.7.3-.8.3-1.5.2-1.7-.1-.2-.3-.3-.7-.5z" />
          </svg>

        </div>
      </div>
    </a>
  );
};

export default WhatsAppFloat;
