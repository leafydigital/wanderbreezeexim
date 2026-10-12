/**
 * ProductGallery.tsx
 * Separate "Product Images" section for product detail pages, with a lightbox.
 * Renders nothing when the product has no gallery images.
 */
import { useEffect, useState, useCallback } from 'react';

export interface GalleryImage { url: string; alt?: string; }

export default function ProductGallery({
  images, productName,
}: { images: GalleryImage[] | null | undefined; productName: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const list = (images || []).filter(i => i && i.url);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => {
    setOpen(i => (i === null ? i : (i + d + list.length) % list.length));
  }, [list.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, step]);

  if (list.length === 0) return null;
  const altOf = (img: GalleryImage, i: number) => img.alt?.trim() || `${productName} – export quality, photo ${i + 1}`;

  return (
    <section className="py-20 px-6 bg-white" aria-labelledby="product-images-heading">
      <div className="max-w-6xl mx-auto">
        <h2 id="product-images-heading" className="text-3xl font-bold text-center text-gray-900">
          {productName} – Product Images
        </h2>
        <p className="mt-3 text-center text-gray-500">Real photos of our export grade {productName}. Click an image to enlarge.</p>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {list.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setOpen(i)}
              className="group relative overflow-hidden rounded-xl shadow bg-gray-100 aspect-[4/3] focus:outline-none focus:ring-2 focus:ring-green-600"
              aria-label={`View larger: ${altOf(img, i)}`}
            >
              <img
                src={img.url}
                alt={altOf(img, i)}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {open !== null && (
        <div
          role="dialog" aria-modal="true" aria-label={`${productName} image viewer`}
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={close}
        >
          <button type="button" onClick={close} aria-label="Close"
            className="absolute top-4 right-5 text-white text-4xl leading-none">×</button>
          {list.length > 1 && (
            <>
              <button type="button" aria-label="Previous image"
                onClick={e => { e.stopPropagation(); step(-1); }}
                className="absolute left-3 md:left-6 text-white text-5xl px-3 py-2 hover:bg-white/10 rounded">‹</button>
              <button type="button" aria-label="Next image"
                onClick={e => { e.stopPropagation(); step(1); }}
                className="absolute right-3 md:right-6 text-white text-5xl px-3 py-2 hover:bg-white/10 rounded">›</button>
            </>
          )}
          <figure className="max-w-5xl max-h-full" onClick={e => e.stopPropagation()}>
            <img src={list[open].url} alt={altOf(list[open], open)} className="max-h-[80vh] max-w-full mx-auto rounded-lg" />
            <figcaption className="mt-3 text-center text-sm text-white/80">
              {altOf(list[open], open)} ({open + 1}/{list.length})
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
