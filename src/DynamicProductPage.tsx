/**
 * DynamicProductPage.tsx
 * Dynamic website product detail page — reads from sc_product_categories in Supabase.
 * Route: /products/:slug
 *
 * Add to App.tsx routes BEFORE the static product routes:
 *   <Route path="/products/:slug" element={<WebsiteLayout><DynamicProductPage /></WebsiteLayout>} />
 *
 * This handles ALL products added via CRM.
 * Existing static pages (/products/cardamom, /products/pepper, etc.) still work
 * — they take priority in the routes array because they're listed before the dynamic route.
 * OR you can remove the static routes and let this handle everything.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import ContactModal from './components/ContactModal';
import { supabase } from './crm/lib/supabase';

interface Spec { label: string; value: string; }

interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  category_group: string;
  is_active: boolean;
  page_title: string | null;
  page_subtitle: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  hero_bullets: string[] | null;
  origin: string | null;
  moq: string | null;
  supply_capacity: string | null;
  specs: Spec[] | null;
  overview_title: string | null;
  overview_text: string | null;
  image_path: string | null;
  hs_code: string | null;
}

export default function DynamicProductPage() {
  const { slug }      = useParams<{ slug: string }>();
  const navigate      = useNavigate();
  const [product, setProduct] = useState<ProductCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('sc_product_categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        navigate('/404', { replace: true });
        return;
      }
      setProduct(data);
      document.title = data.meta_title || data.page_title || data.name;
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading product…</p>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const whatsappText = `Hello, I am interested in importing ${product.name} from India. Please share price and details.`;
  const whatsappLink = `https://wa.me/917358060254?text=${encodeURIComponent(whatsappText)}`;

  return (
    <div className="bg-gray-50">
      {/* SEO */}
      {product.meta_title && (
        <Helmet>
          <title>{product.meta_title}</title>
          {product.meta_description && <meta name="description" content={product.meta_description} />}
          {product.meta_keywords && <meta name="keywords" content={product.meta_keywords} />}
        </Helmet>
      )}

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {product.page_title || product.name}
          </h1>

          {product.page_subtitle && (
            <p className="mt-6 text-lg text-gray-600">{product.page_subtitle}</p>
          )}

          {product.hero_bullets && product.hero_bullets.length > 0 && (
            <ul className="mt-8 space-y-3 text-gray-700">
              {product.hero_bullets.map((b, i) => (
                <li key={i}>✔ {b}</li>
              ))}
            </ul>
          )}

          <div className="mt-10 flex gap-4 flex-wrap">
            <button
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:opacity-90 transition"
              onClick={() => setShowModal(true)}
            >
              Request Latest Price
            </button>
            <a href={whatsappLink} target="_blank" rel="noopener"
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg shadow-md transition">
              WhatsApp Inquiry
            </a>
          </div>
        </div>

        {product.image_path && (
          <div>
            <img
              src={product.image_path}
              alt={product.page_title || product.name}
              className="rounded-xl shadow-lg w-full object-cover"
            />
          </div>
        )}
      </section>

      {/* ── QUICK INFO CARDS ── */}
      {(product.origin || product.moq || product.supply_capacity) && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 text-center">
            {product.origin && (
              <div className="p-6 shadow rounded-xl">
                <h4 className="font-semibold text-blue-600">Origin</h4>
                <p className="mt-2 text-gray-600">{product.origin}</p>
              </div>
            )}
            {product.moq && (
              <div className="p-6 shadow rounded-xl">
                <h4 className="font-semibold text-blue-600">Minimum Order</h4>
                <p className="mt-2 text-gray-600">{product.moq}</p>
              </div>
            )}
            {product.supply_capacity && (
              <div className="p-6 shadow rounded-xl">
                <h4 className="font-semibold text-blue-600">Supply Capacity</h4>
                <p className="mt-2 text-gray-600">{product.supply_capacity}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── OVERVIEW ── */}
      {(product.overview_title || product.overview_text) && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto text-center">
            {product.overview_title && (
              <h2 className="text-3xl font-bold text-gray-900">{product.overview_title}</h2>
            )}
            {product.overview_text && (
              <p className="mt-6 text-gray-600 leading-relaxed whitespace-pre-line">{product.overview_text}</p>
            )}
          </div>
        </section>
      )}

      {/* ── TECH SPECS ── */}
      {product.specs && product.specs.length > 0 && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Technical Specifications – Export Grade {product.name}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {product.specs.map((spec, i) => (
                <div key={i} className="flex justify-between p-5 bg-white shadow rounded-xl">
                  <span className="font-semibold text-gray-700">{spec.label}</span>
                  <span className="text-gray-600 text-right ml-4">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA STRIP ── */}
      <section className="py-16 px-6 bg-gradient-to-r from-green-600 to-blue-600 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-bold">Ready to Import {product.name}?</h2>
        <p className="mt-4 text-white/80">Get pricing, samples, and export documentation from Wander Breeze Exim Pvt Ltd.</p>
        <div className="mt-8 flex gap-4 justify-center flex-wrap">
          <button
            className="bg-white text-green-700 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setShowModal(true)}
          >
            Request Price Quote
          </button>
          <a href={whatsappLink} target="_blank" rel="noopener"
            className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition">
            WhatsApp Us
          </a>
        </div>
      </section>

      {/* Contact modal */}
      <ContactModal isOpen={showModal} onClose={() => setShowModal(false)} product={product.name} />
    </div>
  );
}