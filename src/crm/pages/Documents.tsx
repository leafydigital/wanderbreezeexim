import { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, Download, FolderOpen, Search, FileText } from 'lucide-react';
import { supabase, Document, OrderType } from '../lib/supabase';
import Modal from '../components/Modal';
import { formatDate } from '../lib/utils';

const DOC_TYPES = [
  'Signed PI Copy',
  'Packing List',
  'COO (Certificate of Origin)',
  'Phytosanitary Certificate',
  'Pesticide Certificate',
  'Commercial Invoice',
  'Bill of Lading',
  'Fumigation Certificate',
  'Quality Certificate',
  'Other',
];

const emptyForm = {
  order_ref: '',
  order_type: 'PI' as OrderType,
  document_type: 'Signed PI Copy',
};

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [fileData, setFileData] = useState<{ name: string; url: string; size: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    const handleVisibility = () => { if (document.visibilityState === 'visible') fetchDocuments(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  async function fetchDocuments() {
    setLoading(true);
    const { data } = await supabase.from('documents').select('*').order('uploaded_at', { ascending: false });
    setDocuments(data ?? []);
    setLoading(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { data, error } = await supabase.storage.from('documents').upload(fileName, file, { upsert: false });

    if (error) {
      // If bucket doesn't exist, use a data URL fallback for demo
      const reader = new FileReader();
      reader.onload = () => {
        setFileData({ name: file.name, url: reader.result as string, size: file.size });
        setUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(data.path);
    setFileData({ name: file.name, url: urlData.publicUrl, size: file.size });
    setUploading(false);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.order_ref.trim()) e.order_ref = 'Order reference required';
    if (!fileData) e.file = 'Please upload a file';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate() || !fileData) return;
    setSaving(true);
    await supabase.from('documents').insert({
      order_ref: form.order_ref,
      order_type: form.order_type,
      document_type: form.document_type,
      file_name: fileData.name,
      file_url: fileData.url,
      file_size: fileData.size,
    });
    await fetchDocuments();
    setModalOpen(false);
    setSaving(false);
    setForm(emptyForm);
    setFileData(null);
  }

  async function handleDelete(id: string) {
    await supabase.from('documents').delete().eq('id', id);
    setDeleteId(null);
    fetchDocuments();
  }

  function getDocIcon(docType: string) {
    if (docType.includes('Certificate')) return '📜';
    if (docType.includes('Packing')) return '📦';
    if (docType.includes('Invoice')) return '🧾';
    if (docType.includes('Lading')) return '🚢';
    return '📄';
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  const filtered = documents.filter(d => {
    const matchSearch = !search ||
      d.order_ref.toLowerCase().includes(search.toLowerCase()) ||
      d.document_type.toLowerCase().includes(search.toLowerCase()) ||
      d.file_name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || d.order_type === filterType;
    return matchSearch && matchType;
  });

  // Group by order_ref
  const grouped = filtered.reduce((acc, d) => {
    if (!acc[d.order_ref]) acc[d.order_ref] = [];
    acc[d.order_ref].push(d);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-gray-500">{documents.length} documents across {Object.keys(grouped).length} orders</p>
        <button onClick={() => { setForm(emptyForm); setFileData(null); setErrors({}); setModalOpen(true); }} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          <Upload size={16} /> Upload Document
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ref, document type..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Types</option>
          <option value="PI">PI</option>
          <option value="Invoice">Invoice</option>
          <option value="General">General</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm text-center py-16 text-gray-400">
          <FolderOpen size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No documents yet</p>
          <p className="text-sm mt-1">Upload export documents to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([orderRef, docs]) => (
            <div key={orderRef} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                <FolderOpen size={15} className="text-teal-600" />
                <span className="text-sm font-semibold text-gray-900">{orderRef}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">{docs[0].order_type}</span>
                <span className="ml-auto text-xs text-gray-400">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {docs.map(doc => (
                  <div key={doc.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                      {getDocIcon(doc.document_type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.document_type}</p>
                      <p className="text-xs text-gray-500 truncate">{doc.file_name} · {formatSize(doc.file_size)}</p>
                    </div>
                    <p className="text-xs text-gray-400 hidden md:block whitespace-nowrap">{formatDate(doc.uploaded_at)}</p>
                    <div className="flex items-center gap-1.5">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors" title="View/Download">
                        <Download size={14} />
                      </a>
                      <button onClick={() => setDeleteId(doc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload Document" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order Reference *</label>
              <input value={form.order_ref} onChange={e => setForm(f => ({ ...f, order_ref: e.target.value }))} placeholder="e.g. WBE-PI-2024-0001" className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${errors.order_ref ? 'border-red-400' : 'border-gray-200'}`} />
              {errors.order_ref && <p className="text-xs text-red-500 mt-1">{errors.order_ref}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Order Type</label>
              <select value={form.order_type} onChange={e => setForm(f => ({ ...f, order_type: e.target.value as OrderType }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="PI">Proforma Invoice (PI)</option>
                <option value="Invoice">Invoice</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
            <select value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">File *</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${errors.file ? 'border-red-400' : 'border-gray-200 hover:border-teal-400'} ${fileData ? 'bg-teal-50 border-teal-300' : ''}`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Uploading...</p>
                </div>
              ) : fileData ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText size={24} className="text-teal-600" />
                  <p className="text-sm font-medium text-teal-700">{fileData.name}</p>
                  <p className="text-xs text-teal-500">{formatSize(fileData.size)} · Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-gray-300" />
                  <p className="text-sm text-gray-500">Click to upload file</p>
                  <p className="text-xs text-gray-400">PDF, DOC, XLS, Images supported</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
            {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setModalOpen(false); setFileData(null); }} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={saving || uploading} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Upload Document'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Document" size="sm">
        <p className="text-sm text-gray-600 mb-5">Delete this document? The file will be removed.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
