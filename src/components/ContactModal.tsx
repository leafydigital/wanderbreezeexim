import React from "react";
import Contact from "./Contact";

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  product: string;
};

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, product }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">

      <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">

        <button className="absolute top-3 right-3" onClick={onClose}>
          ✕
        </button>

        <h2 className="text-xl font-bold text-center mb-4">
          Get Price – {product}
        </h2>

        <Contact productDefault={product} hideInfo={true} />

      </div>
    </div>
  );
};

export default ContactModal;