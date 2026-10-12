/**
 * ProductImageUploader.tsx
 * Image upload fields for the CRM "Add / Edit Product" form.
 *  - MainImageUpload : single hero image  -> image_path
 *  - GalleryUpload   : many images + alt text -> gallery_images
 * Files are resized (max 1600px) and converted to WebP in the browser before upload,
 * stored in the public Supabase bucket "product-images" with SEO-friendly file names.
 */
import { useRef, useState } from 'react';
import { Upload, X, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface GalleryImage { url: string; alt: string; }

const BUCKET = 'product-images';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB raw input
const MAX_DIM = 1600;

const box: React.CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 13,
  outline: 'none', width: '100%', background: '#fff', fontFamily: 'inherit', color: '#111',
};
const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
  fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151',
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
}

async function toWebp(file: File): Promise<Blob> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/webp', 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // fall back to the original if the browser can't decode it
  }
}

async function uploadOne(file: File, productSlug: string, label: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not an image.`);
  if (file.size > MAX_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);
  const blob = await toWebp(file);
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase();
  const slug = slugify(productSlug);
  const path = `${slug}/${slug}-${label}-${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || file.type, cacheControl: '31536000', upsert: false,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// ── Main (hero) image ─────────────────────────────────────────
export function MainImageUpload({
  value, onChange, productSlug,
}: { value: string; onChange: (url: string) => void; productSlug: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(files: FileList | null) {
    if (!files?.[0]) return;
    setBusy(true); setErr('');
    try { onChange(await uploadOne(files[0], productSlug, 'main')); }
    catch (e: any) { setErr(e.message || 'Upload failed'); }
    setBusy(false);
    if (ref.current) ref.current.value = '';
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {value ? (
          <img src={value} alt="Main product" style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
        ) : (
          <div style={{ width: 96, height: 72, borderRadius: 8, border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 11 }}>No image</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onClick={e => e.stopPropagation()} onChange={e => pick(e.target.files)} />
          <button type="button" style={ghostBtn} onClick={() => ref.current?.click()} disabled={busy}>
            {busy ? <Loader2 size={14} /> : <Upload size={14} />} {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload main image'}
          </button>
          {value && <button type="button" style={{ ...ghostBtn, color: '#DC2626', borderColor: '#FCA5A5' }} onClick={() => onChange('')}><X size={13} /> Remove</button>}
        </div>
      </div>
      <input value={value} onChange={e => onChange(e.target.value)} style={{ ...box, marginTop: 10, fontSize: 12 }}
        placeholder="…or paste an image path / URL, e.g. /Images/Cardamom.png" />
      {err && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{err}</div>}
    </div>
  );
}

// ── Gallery ───────────────────────────────────────────────────
export function GalleryUpload({
  images, onChange, productSlug, productName,
}: { images: GalleryImage[]; onChange: (imgs: GalleryImage[]) => void; productSlug: string; productName: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true); setErr('');
    const added: GalleryImage[] = [];
    const errors: string[] = [];
    for (const f of Array.from(files)) {
      try {
        const n = images.length + added.length + 1;
        const url = await uploadOne(f, productSlug, String(n));
        added.push({ url, alt: `${productName || 'Product'} – export quality photo ${n}` });
      } catch (e: any) { errors.push(e.message); }
    }
    if (added.length) onChange([...images, ...added]);
    if (errors.length) setErr(errors.join(' '));
    setBusy(false);
    if (ref.current) ref.current.value = '';
  }

  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= images.length) return;
    const c = [...images]; [c[i], c[j]] = [c[j], c[i]]; onChange(c);
  };

  return (
    <div>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: 'none' }} onClick={e => e.stopPropagation()} onChange={e => pick(e.target.files)} />
      <button type="button" style={ghostBtn} onClick={() => ref.current?.click()} disabled={busy}>
        {busy ? <Loader2 size={14} /> : <Upload size={14} />} {busy ? 'Uploading…' : 'Upload gallery images'}
      </button>
      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
        Shown in a separate "Product Images" section on the product page. Images are auto-resized to WebP for fast loading.
      </div>
      {err && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 6 }}>{err}</div>}

      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginTop: 12 }}>
          {images.map((img, i) => (
            <div key={img.url + i} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 8, background: '#fff' }}>
              <img src={img.url} alt={img.alt} style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 6 }} />
              <input value={img.alt} onChange={e => onChange(images.map((x, k) => k === i ? { ...x, alt: e.target.value } : x))}
                style={{ ...box, marginTop: 6, fontSize: 11, padding: '6px 8px' }} placeholder="Alt text (helps SEO)" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" style={{ ...ghostBtn, padding: '3px 7px' }} onClick={() => move(i, -1)} disabled={i === 0} title="Move left"><ArrowLeft size={12} /></button>
                  <button type="button" style={{ ...ghostBtn, padding: '3px 7px' }} onClick={() => move(i, 1)} disabled={i === images.length - 1} title="Move right"><ArrowRight size={12} /></button>
                </div>
                <button type="button" style={{ ...ghostBtn, padding: '3px 7px', color: '#DC2626', borderColor: '#FCA5A5' }}
                  onClick={() => onChange(images.filter((_, k) => k !== i))} title="Remove"><X size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}