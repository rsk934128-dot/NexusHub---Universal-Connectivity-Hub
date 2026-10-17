import React, { useState } from 'react';
import { Contact } from '../types';
import { Language, translations } from '../utils/i18n';
import { X, Download, Upload, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  language: Language;
  onImport: (contacts: Array<Omit<Contact, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>) => Promise<number>;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  contacts,
  language,
  onImport,
}) => {
  const t = translations[language];

  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const dataToExport = contacts.map(({ id, ownerId, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexushub_contacts_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorStatus(null);
    setImportStatus(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const list = Array.isArray(parsed) ? parsed : [parsed];
        const validContacts = list.filter((item) => item && item.name && item.phone);

        if (validContacts.length === 0) {
          setErrorStatus(language === 'bn' ? 'ফাইলে কোনো সঠিক কন্টাক্ট পাওয়া যায়নি (name ও phone ফিল্ড আবশ্যক)।' : 'No valid contacts found (name and phone fields are required).');
          setIsProcessing(false);
          return;
        }

        const count = await onImport(validContacts);
        setImportStatus(language === 'bn' ? `সফলভাবে ${count}টি কন্টাক্ট ইমপোর্ট ও সিঙ্ক হয়েছে!` : `Successfully imported and synced ${count} contacts!`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON file';
        setErrorStatus(msg);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <FileJson className="w-5 h-5 text-indigo-400" />
            <span>{language === 'bn' ? 'ব্যাকআপ ও ডাটা ট্রান্সফার' : 'Backup & Data Transfer'}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Export Box */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center space-x-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{t.exportBackup}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {language === 'bn'
                ? `আপনার বর্তমানে থাকা ${contacts.length}টি কন্টাক্টকে JSON ফাইলে ডাউনলোড করুন।`
                : `Download all ${contacts.length} saved contacts into a JSON file.`}
            </p>
            <button
              onClick={handleExport}
              disabled={contacts.length === 0}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-40 flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>{t.exportBackup}</span>
            </button>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>{t.importJson}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {language === 'bn'
                ? 'আগে সেভ করা যেকোনো JSON ব্যাকআপ ফাইল থেকে কন্টাক্ট ক্লাউডে রিস্টোর করুন।'
                : 'Upload previously exported JSON backup to restore contacts to Firestore.'}
            </p>

            <label className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : t.importJson}</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importStatus}</span>
            </div>
          )}

          {errorStatus && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorStatus}</span>
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
