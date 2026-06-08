import type { Lead } from './types';

const LEAD_HEADERS = [
  'Company Name', 'Email', 'All Emails', 'Phone Number', 'Website',
  'Address', 'Country', 'Category', 'Rating', 'Source',
  'LinkedIn', 'Facebook', 'Instagram', 'Twitter',
];

const SUPPLIER_HEADERS = [
  'Company Name', 'Email', 'All Emails', 'Phone Number', 'Website',
  'Address', 'Country', 'Products', 'Min Order', 'Certifications',
  'Source', 'LinkedIn', 'Facebook', 'Instagram', 'Twitter',
];

function toLeadRow(l: Lead) {
  return {
    'Company Name':  l.name       || '',
    'Email':         l.email      || '',
    'All Emails':    (l.emails || []).join('; '),
    'Phone Number':  l.phone      || '',
    'Website':       l.website    || '',
    'Address':       l.address    || '',
    'Country':       l.country    || '',
    'Category':      l.category   || '',
    'Rating':        l.rating     || '',
    'Source':        l.source     || '',
    'LinkedIn':      l.linkedin   || '',
    'Facebook':      l.facebook   || '',
    'Instagram':     l.instagram  || '',
    'Twitter':       l.twitter    || '',
  };
}

function toSupplierRow(l: Lead) {
  return {
    'Company Name':   l.name           || '',
    'Email':          l.email          || '',
    'All Emails':     (l.emails || []).join('; '),
    'Phone Number':   l.phone          || '',
    'Website':        l.website        || '',
    'Address':        l.address        || '',
    'Country':        l.country        || '',
    'Products':       l.products       || '',
    'Min Order':      l.min_order      || '',
    'Certifications': l.certifications || '',
    'Source':         l.source         || '',
    'LinkedIn':       l.linkedin       || '',
    'Facebook':       l.facebook       || '',
    'Instagram':      l.instagram      || '',
    'Twitter':        l.twitter        || '',
  };
}

function isSupplierMode(leads: Lead[]): boolean {
  return leads.some(l => l.products || l.min_order || l.certifications);
}

/**
 * Build a smart filename from query + location.
 * e.g. query="Spice Importers", location="UAE" → "Spice_Importers_UAE"
 */
export function buildFilename(query: string, location: string): string {
  const clean = (s: string) =>
    s.trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 40);
  const q = clean(query);
  const l = clean(location);
  if (q && l) return `${q}_${l}`;
  if (q) return q;
  if (l) return l;
  return 'leads';
}

export function exportCSV(leads: Lead[], query = '', location = '') {
  const filename = buildFilename(query, location);
  const supplier = isSupplierMode(leads);
  const headers  = supplier ? SUPPLIER_HEADERS : LEAD_HEADERS;
  const rows     = leads.map(l => supplier ? toSupplierRow(l) : toLeadRow(l));

  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => `"${((r as any)[h] || '').toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export function exportExcel(leads: Lead[], query = '', location = '') {
  const filename = buildFilename(query, location);
  const supplier = isSupplierMode(leads);
  const headers  = supplier ? SUPPLIER_HEADERS : LEAD_HEADERS;
  const rows     = leads.map(l => supplier ? toSupplierRow(l) : toLeadRow(l));

  const thead = headers.map(h => `<th>${h}</th>`).join('');
  const tbody = rows.map(r =>
    `<tr>${headers.map(h => `<td>${(r as any)[h] || ''}</td>`).join('')}</tr>`
  ).join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"/></head>
      <body>
        <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
      </body>
    </html>`;

  downloadBlob(new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' }), `${filename}.xls`);
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}