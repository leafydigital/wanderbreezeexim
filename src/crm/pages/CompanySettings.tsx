import { useEffect, useState, useRef } from 'react';
import { Building2, Plus, Trash2, Upload, Eye, Download, CheckCircle, X, AlertCircle, QrCode } from 'lucide-react';
import { supabase, BankAccount } from '../lib/supabase';

interface CompanyProfile {
  id?: string;
  company_name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  gstin: string;
  iec_code: string;
  fssai: string;
  spices_board_rcmc: string;
  other_certifications: string;
}

interface Certificate {
  id?: string;
  name: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

const emptyProfile: CompanyProfile = {
  company_name: 'Wander Breeze Exim Pvt Ltd',
  address: '',
  city: 'Thiruvananthapuram',
  state: 'Kerala',
  pincode: '',
  country: 'India',
  email: 'contact@wanderbreezeexim.com',
  phone: '+91 73580 60254',
  website: 'wanderbreezeexim.com',
  gstin: '',
  iec_code: '',
  fssai: '',
  spices_board_rcmc: '',
  other_certifications: '',
};

const emptyBank = (): BankAccount => ({
  bank_name: '', branch: '', account_name: 'Wander Breeze Exim Pvt Ltd',
  account_number: '', ifsc_code: '', swift_code: '', is_active: false,
});

export default function CompanySettings() {
  const [profile, setProfile] = useState<CompanyProfile>(emptyProfile);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingBank, setSavingBank] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newBank, setNewBank] = useState<BankAccount>(emptyBank());
  const [addingBank, setAddingBank] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certName, setCertName] = useState('');
  const [certNamePrompt, setCertNamePrompt] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [newBankQrFile, setNewBankQrFile] = useState<File | null>(null);
  const [newBankQrPreview, setNewBankQrPreview] = useState<string | null>(null);
  const [qrUploadingFor, setQrUploadingFor] = useState<string | null>(null);
  const newBankQrInputRef = useRef<HTMLInputElement>(null);
  const existingBankQrInputRef = useRef<HTMLInputElement>(null);
  const [qrTargetBankId, setQrTargetBankId] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    const [profRes, bankRes, certRes] = await Promise.all([
      supabase.from('company_settings').select('*').limit(1).maybeSingle(),
      supabase.from('bank_accounts').select('*').order('is_active', { ascending: false }),
      supabase.from('certificates').select('*').order('uploaded_at', { ascending: false }),
    ]);
    if (profRes.data) setProfile(profRes.data as CompanyProfile);
    setBanks((bankRes.data as BankAccount[]) ?? []);
    setCertificates((certRes.data as Certificate[]) ?? []);
  }

  async function saveProfile() {
    setSaving(true);
    setSaveError(null);

    // Strip undefined id for insert path
    const { id, ...rest } = profile;

    let error: any = null;

    if (id) {
      // Update existing row
      const res = await supabase.from('company_settings').update(rest).eq('id', id);
      error = res.error;
    } else {
      // Try insert first
      const res = await supabase.from('company_settings').insert(rest).select('id').single();
      error = res.error;
      if (!error && res.data) {
        setProfile(p => ({ ...p, id: res.data.id }));
      }
      // If insert fails due to RLS or duplicate, try upsert
      if (error) {
        const res2 = await supabase.from('company_settings').upsert(rest, { onConflict: 'id' });
        error = res2.error;
      }
    }

    setSaving(false);
    if (error) {
      setSaveError(error.message || 'Failed to save. Check Supabase RLS policies for company_settings table.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      fetchAll();
    }
  }

  async function uploadQrFile(file: File): Promise<string> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `bank-qr/${Date.now()}_${safeName}`;
    const { error: upError } = await supabase.storage.from('documents').upload(path, file, { upsert: false });
    if (upError) throw new Error(`QR upload failed: ${upError.message}`);
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
    return urlData.publicUrl;
  }

  function handleNewBankQrSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewBankQrFile(file);
    setNewBankQrPreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  async function saveBank() {
    setSavingBank('new');
    setSaveError(null);
    try {
      let qr_code_url: string | null = null;
      if (newBankQrFile) {
        qr_code_url = await uploadQrFile(newBankQrFile);
      }
      if (newBank.is_active) {
        await supabase.from('bank_accounts').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      }
      const { error } = await supabase.from('bank_accounts').insert({ ...newBank, qr_code_url });
      if (error) throw new Error(`Bank save failed: ${error.message}`);
      setNewBank(emptyBank());
      setNewBankQrFile(null);
      setNewBankQrPreview(null);
      setAddingBank(false);
      fetchAll();
    } catch (e: any) {
      setSaveError(e.message || 'Bank save failed');
    }
    setSavingBank(null);
  }

  function triggerExistingBankQrUpload(bankId: string) {
    setQrTargetBankId(bankId);
    existingBankQrInputRef.current?.click();
  }

  async function handleExistingBankQrSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !qrTargetBankId) return;
    setQrUploadingFor(qrTargetBankId);
    setSaveError(null);
    try {
      const qr_code_url = await uploadQrFile(file);
      const { error } = await supabase.from('bank_accounts').update({ qr_code_url }).eq('id', qrTargetBankId);
      if (error) throw new Error(`QR save failed: ${error.message}`);
      fetchAll();
    } catch (err: any) {
      setSaveError(err.message || 'QR upload failed');
    }
    setQrUploadingFor(null);
    setQrTargetBankId(null);
  }

  async function removeBankQr(bankId: string) {
    await supabase.from('bank_accounts').update({ qr_code_url: null }).eq('id', bankId);
    fetchAll();
  }

  async function deleteBank(id: string) {
    await supabase.from('bank_accounts').delete().eq('id', id);
    fetchAll();
  }

  async function setActiveBank(id: string) {
    setSavingBank(id);
    await supabase.from('bank_accounts').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bank_accounts').update({ is_active: true }).eq('id', id);
    setSavingBank(null);
    fetchAll();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setCertName(file.name.replace(/\.[^/.]+$/, ''));
    setCertNamePrompt(true);
    e.target.value = '';
  }

  async function uploadCert() {
    if (!pendingFile) return;
    setUploading(true);
    setCertNamePrompt(false);
    setSaveError(null);
    try {
      const safeName = pendingFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `certificates/${Date.now()}_${safeName}`;
      const { data: upData, error: upError } = await supabase.storage
        .from('documents')
        .upload(path, pendingFile, { upsert: false });
      if (upError) throw new Error(`Upload failed: ${upError.message}`);
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      const { error: dbError } = await supabase.from('certificates').insert({
        name: certName || pendingFile.name,
        file_url: urlData.publicUrl,
        file_name: pendingFile.name,
        uploaded_at: new Date().toISOString(),
      });
      if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);
      fetchAll();
    } catch (e: any) {
      setSaveError(e.message || 'Upload failed');
    }
    setUploading(false);
    setPendingFile(null);
    setCertName('');
  }

  async function deleteCert(id: string, fileUrl: string) {
    const path = fileUrl.split('/documents/')[1];
    if (path) await supabase.storage.from('documents').remove([path]);
    await supabase.from('certificates').delete().eq('id', id);
    fetchAll();
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
  const labelCls = 'block text-xs font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Building2 size={22} className="text-teal-600" />
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Company Settings</h1>
          <p className="text-sm text-gray-500">Manage your company profile, bank accounts & certifications</p>
        </div>
      </div>

      {/* Company Profile */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Company Profile</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Company Name</label>
            <input value={profile.company_name} onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Address</label>
            <input value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} className={inputCls} placeholder="Street / Building / Floor" />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input value={profile.state} onChange={e => setProfile(p => ({ ...p, state: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Pincode</label>
            <input value={profile.pincode} onChange={e => setProfile(p => ({ ...p, pincode: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Country</label>
            <input value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} className={inputCls} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Registrations & Certifications</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>GSTIN</label>
              <input value={profile.gstin} onChange={e => setProfile(p => ({ ...p, gstin: e.target.value }))} className={inputCls} placeholder="22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className={labelCls}>IEC Code</label>
              <input value={profile.iec_code} onChange={e => setProfile(p => ({ ...p, iec_code: e.target.value }))} className={inputCls} placeholder="AABCW1234A" />
            </div>
            <div>
              <label className={labelCls}>FSSAI License Number</label>
              <input value={profile.fssai} onChange={e => setProfile(p => ({ ...p, fssai: e.target.value }))} className={inputCls} placeholder="10000000000000" />
            </div>
            <div>
              <label className={labelCls}>Spices Board RCMC</label>
              <input value={profile.spices_board_rcmc} onChange={e => setProfile(p => ({ ...p, spices_board_rcmc: e.target.value }))} className={inputCls} placeholder="RCMC Number" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Other Certifications / Notes</label>
              <textarea value={profile.other_certifications} onChange={e => setProfile(p => ({ ...p, other_certifications: e.target.value }))} rows={2} className={inputCls + ' resize-none'} placeholder="ISO, Organic, etc." />
            </div>
          </div>
        </div>

        {saveError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            <div><strong>Save failed:</strong> {saveError}</div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60">
            {saved ? <><CheckCircle size={15} /> Saved!</> : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bank Accounts</h2>
          <button onClick={() => setAddingBank(true)} className="flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:text-teal-700">
            <Plus size={15} /> Add Bank
          </button>
        </div>

        <input ref={existingBankQrInputRef} type="file" accept="image/*" className="hidden" onChange={handleExistingBankQrSelect} />

        {banks.length === 0 && !addingBank && (
          <p className="text-sm text-gray-400 text-center py-6">No bank accounts added yet.</p>
        )}

        <div className="space-y-3">
          {banks.map(bank => (
            <div key={bank.id} className={`border rounded-lg p-4 ${bank.is_active ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{bank.bank_name}</span>
                    {bank.is_active && <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">Active</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-gray-600">
                    <span>Branch: {bank.branch}</span>
                    <span>A/C: {bank.account_number}</span>
                    <span>IFSC: {bank.ifsc_code}</span>
                    <span>SWIFT: {bank.swift_code}</span>
                    <span className="col-span-2">Name: {bank.account_name}</span>
                  </div>
                </div>

                {bank.qr_code_url && (
                  <img src={bank.qr_code_url} alt="Payment QR" className="w-16 h-16 object-contain border border-gray-200 rounded bg-white flex-shrink-0" />
                )}

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {!bank.is_active && (
                      <button onClick={() => setActiveBank(bank.id!)} disabled={savingBank === bank.id} className="text-xs text-teal-600 border border-teal-300 px-2 py-1 rounded hover:bg-teal-50">
                        {savingBank === bank.id ? '...' : 'Set Active'}
                      </button>
                    )}
                    <button onClick={() => deleteBank(bank.id!)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerExistingBankQrUpload(bank.id!)}
                      disabled={qrUploadingFor === bank.id}
                      className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 disabled:opacity-50"
                    >
                      <QrCode size={12} /> {qrUploadingFor === bank.id ? 'Uploading...' : bank.qr_code_url ? 'Change QR' : 'Upload QR'}
                    </button>
                    {bank.qr_code_url && (
                      <button onClick={() => removeBankQr(bank.id!)} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {addingBank && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Bank Account</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Bank Name</label><input value={newBank.bank_name} onChange={e => setNewBank(b => ({ ...b, bank_name: e.target.value }))} className={inputCls} placeholder="Axis Bank" /></div>
              <div><label className={labelCls}>Branch</label><input value={newBank.branch} onChange={e => setNewBank(b => ({ ...b, branch: e.target.value }))} className={inputCls} placeholder="Pattom, Trivandrum" /></div>
              <div><label className={labelCls}>Account Name</label><input value={newBank.account_name} onChange={e => setNewBank(b => ({ ...b, account_name: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Account Number</label><input value={newBank.account_number} onChange={e => setNewBank(b => ({ ...b, account_number: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>IFSC Code</label><input value={newBank.ifsc_code} onChange={e => setNewBank(b => ({ ...b, ifsc_code: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>SWIFT Code</label><input value={newBank.swift_code} onChange={e => setNewBank(b => ({ ...b, swift_code: e.target.value }))} className={inputCls} /></div>
              <div className="col-span-2">
                <label className={labelCls}>Payment QR Code (optional)</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => newBankQrInputRef.current?.click()} className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
                    <QrCode size={13} /> {newBankQrFile ? 'Change Image' : 'Choose Image'}
                  </button>
                  <input ref={newBankQrInputRef} type="file" accept="image/*" className="hidden" onChange={handleNewBankQrSelect} />
                  {newBankQrPreview && <img src={newBankQrPreview} alt="QR preview" className="w-12 h-12 object-contain border border-gray-200 rounded bg-white" />}
                  {newBankQrFile && <span className="text-xs text-gray-400">{newBankQrFile.name}</span>}
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={newBank.is_active} onChange={e => setNewBank(b => ({ ...b, is_active: e.target.checked }))} className="rounded" />
                <label htmlFor="is_active" className="text-sm text-gray-700">Set as active bank (default on invoices)</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setAddingBank(false); setNewBank(emptyBank()); setNewBankQrFile(null); setNewBankQrPreview(null); }} className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100">Cancel</button>
              <button onClick={saveBank} disabled={savingBank === 'new'} className="bg-teal-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-teal-700 disabled:opacity-60">
                {savingBank === 'new' ? 'Saving...' : 'Save Bank'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Certificates & Documents</h2>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-sm text-teal-600 font-medium hover:text-teal-700 disabled:opacity-50">
            <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload Certificate'}
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
        </div>

        {certNamePrompt && (
          <div className="border border-teal-200 bg-teal-50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-teal-800">Name this certificate</p>
            <input value={certName} onChange={e => setCertName(e.target.value)} className={inputCls} placeholder="e.g. FSSAI License, Spices Board RCMC..." />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setCertNamePrompt(false); setPendingFile(null); }} className="border border-gray-200 text-gray-600 px-3 py-1.5 rounded text-sm">Cancel</button>
              <button onClick={uploadCert} className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm hover:bg-teal-700">Upload</button>
            </div>
          </div>
        )}

        {certificates.length === 0 && !certNamePrompt && (
          <p className="text-sm text-gray-400 text-center py-6">No certificates uploaded yet.</p>
        )}

        <div className="space-y-2">
          {certificates.map(cert => (
            <div key={cert.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">{cert.name}</p>
                <p className="text-xs text-gray-400">{cert.file_name} &nbsp;·&nbsp; {new Date(cert.uploaded_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={cert.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="Preview"><Eye size={15} /></a>
                <a href={cert.file_url} download={cert.file_name} className="p-1.5 text-gray-400 hover:text-teal-600 transition-colors" title="Download"><Download size={15} /></a>
                <button onClick={() => deleteCert(cert.id!, cert.file_url)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}