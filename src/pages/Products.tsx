import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Package } from 'lucide-react';
import { supabase } from '../crm/lib/supabase';

interface DBProduct {
  id: string;
  name: string;
  category_group: string;
  image_path: string | null;
  hs_code: string | null;
  origin: string | null;
  color: string | null;
  slug: string;
  overview_text: string | null;
  specs: { label: string; value: string }[] | null;
}

const Products: React.FC = () => {
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('sc_product_categories')
        .select('id, name, category_group, image_path, hs_code, origin, color, slug, overview_text, specs')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setDbProducts(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  // Map DB product to the shape ProductCard expects
  function toProductCard(p: DBProduct) {
    const gradeSpec = p.specs?.find(s => s.label.toLowerCase().includes('grade'));
    return {
      id:            p.id,
      name:          p.name,
      category:      (p.category_group === 'spices' ? 'spices' : 'agri-products') as 'spices' | 'agri-products',
      image:         p.image_path || '/Images/Cardamom.png',
      hsnCode:       p.hs_code || '—',
      placeOfOrigin: p.origin || 'India',
      color:         p.color || '—',
      grade:         gradeSpec?.value || '—',
      description:   p.overview_text?.slice(0, 100) + (p.overview_text && p.overview_text.length > 100 ? '…' : '') || '',
      route:         `/products/${p.slug}`,
    };
  }

  const filtered = activeCategory === 'all'
    ? dbProducts
    : dbProducts.filter(p => p.category_group === activeCategory);

  const spicesCount     = dbProducts.filter(p => p.category_group === 'spices').length;
  const agriCount       = dbProducts.filter(p => p.category_group === 'agri-products').length;
  const valueAddedCount = dbProducts.filter(p => p.category_group === 'value-added').length;
  const seaFoodsCount   = dbProducts.filter(p => p.category_group === 'sea-foods').length;

  const categories = [
    { id: 'all',           label: 'All Products',    count: dbProducts.length },
    { id: 'spices',        label: 'Spices',          count: spicesCount },
    { id: 'agri-products', label: 'Agri Products',   count: agriCount },
    ...(valueAddedCount > 0 ? [{ id: 'value-added', label: 'Value Added', count: valueAddedCount }] : []),
    ...(seaFoodsCount   > 0 ? [{ id: 'sea-foods',   label: 'Sea Foods',   count: seaFoodsCount   }] : []),
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const targetPosition = element.offsetTop - 64;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  };

  return (
    <section id="products" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Our Premium <span className="text-blue-700">Export Products</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our carefully curated selection of authentic Indian products,
            each meeting international quality standards and export requirements.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-blue-700 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
              }`}
            >
              <Package size={16} />
              {cat.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{cat.count}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(p => (
              <ProductCard key={p.id} product={toProductCard(p)} />
            ))}
          </div>
        )}

        {/* Custom Quote CTA */}
        <div className="text-center mt-16 p-8 bg-white rounded-2xl shadow-md max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Need Custom Products or Bulk Orders?</h3>
          <p className="text-gray-600 mb-6">
            We specialize in custom product sourcing and large volume exports. Contact us with your specific requirements.
          </p>
          <button
            onClick={() => scrollToSection('contact')}
            className="bg-gradient-to-r from-blue-700 to-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Request Custom Quote
          </button>
        </div>
      </div>
    </section>
  );
};

export default Products;