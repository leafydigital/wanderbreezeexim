/**
 * useProductsForOutreach.ts
 * Fetches product categories from DB for use in the outreach modal.
 * Replace the static PRODUCTS_LIST in OutreachTrackerV2.tsx with this hook.
 *
 * Usage in OutreachTrackerV2.tsx:
 *   import { useProductsForOutreach } from './leadradar/outreach/useProductsForOutreach';
 *   const { products: PRODUCTS_LIST, loading: productsLoading } = useProductsForOutreach();
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export interface OutreachProduct {
  id: string;
  name: string;           // category name: "Green Cardamom"
  variants: string[];     // variant names: ["Green Cardamom (8mm Bold)", ...]
}

export function useProductsForOutreach() {
  const [products, setProducts] = useState<OutreachProduct[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: cats } = await supabase
        .from('sc_product_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order');

      const { data: vars } = await supabase
        .from('sc_product_variants')
        .select('category_id, name')
        .eq('is_active', true)
        .order('name');

      const result: OutreachProduct[] = (cats || []).map(cat => ({
        id:       cat.id,
        name:     cat.name,
        variants: (vars || [])
          .filter(v => v.category_id === cat.id)
          .map(v => v.name),
      }));

      setProducts(result);
      setLoading(false);
    }
    fetch();
  }, []);

  /** Flat list of all variant names for the outreach modal product pills */
  const flatList = products.flatMap(p => p.variants.length > 0 ? p.variants : [p.name]);

  return { products, flatList, loading };
}