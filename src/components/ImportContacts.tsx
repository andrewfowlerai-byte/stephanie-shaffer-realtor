import { useMemo, useState } from 'react';
import { X, Upload, CheckCircle2 } from 'lucide-react';
import type { Contact, Category } from '../lib/types';
import { CATEGORIES } from '../lib/constants';
import { parseImportFile, splitNewVsDuplicate, bulkInsertContacts, type ParsedContact } from '../lib/importContacts';

interface Props {
  existing: Contact[];
  onClose: () => void;
  onImported: () => void;
}

/**
 * Import contacts from a phone export. iPhone (Contacts, Share) and Google
 * Contacts both export vCard (.vcf) or CSV; we parse either, dedupe against
 * what is already in the CRM, and let her tag the whole batch at once.
 */
export default function ImportContacts({ existing, onClose, onImported }: Props) {
  const [parsed, setParsed] = useState<ParsedContact[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [status, setStatus] = useState<'idle' | 'preview' | 'importing' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [insertedCount, setInsertedCount] = useState(0);

  const { fresh, dupes } = useMemo(
    () => (parsed ? splitNewVsDuplicate(parsed, existing) : { fresh: [], dupes: [] }),
    [parsed, existing],
  );

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      const text = await file.text();
      const rows = parseImportFile(file.name, text);
      if (rows.length === 0) {
        setError('No contacts found in that file. Export as vCard (.vcf) or CSV and try again.');
        setStatus('error');
        return;
      }
      setFileName(file.name);
      setParsed(rows);
      setStatus('preview');
    } catch {
      setError('Could not read that file.');
      setStatus('error');
    }
  }

  async function handleImport() {
    setStatus('importing');
    setError('');
    try {
      const n = await bulkInsertContacts(fresh, category || null);
      setInsertedCount(n);
      setStatus('done');
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
      setStatus('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-silver-200 w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-silver-200">
          <h2 className="text-lg font-semibold text-midnight-900">Import contacts</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-silver-100 transition-colors">
            <X className="w-5 h-5 text-silver-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {(status === 'idle' || status === 'error') && (
            <>
              <p className="text-sm text-silver-600">
                Export your contacts from your phone as a <strong>vCard (.vcf)</strong> or <strong>CSV</strong>, then drop the file here.
                On iPhone: Contacts, select all, Share, Mail to yourself. On Android or Gmail: Google Contacts, Export.
              </p>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-silver-300 rounded-xl py-10 cursor-pointer hover:border-flame-400 hover:bg-flame-50/30 transition-colors">
                <Upload className="w-6 h-6 text-flame-600" />
                <span className="text-sm font-medium text-midnight-800">Choose a .vcf or .csv file</span>
                <input
                  type="file"
                  accept=".csv,.vcf,text/csv,text/vcard"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
              {status === 'error' && error && <p className="text-sm text-red-600">{error}</p>}
            </>
          )}

          {status === 'preview' && (
            <>
              <div className="rounded-xl border border-silver-200 bg-silver-50 p-4 text-sm">
                <p className="text-midnight-900 font-medium">{fileName}</p>
                <p className="text-silver-600 mt-1">
                  Found <strong>{parsed?.length ?? 0}</strong>. <strong className="text-flame-700">{fresh.length} new</strong>
                  {dupes.length > 0 && <span>, {dupes.length} already in your CRM (skipped)</span>}.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-midnight-800 mb-1.5">Tag all imported as (optional)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category | '')}
                  className="w-full px-3 py-2 border border-silver-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-flame-500"
                >
                  <option value="">No category</option>
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
                <p className="text-[11px] text-silver-400 mt-1">A good first pass: tag a phone export as Sphere, then refine.</p>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button onClick={() => { setParsed(null); setStatus('idle'); }} className="px-4 py-2 text-sm font-medium text-silver-600 hover:bg-silver-100 rounded-lg transition-colors">
                  Choose another file
                </button>
                <button
                  onClick={handleImport}
                  disabled={fresh.length === 0}
                  className="bg-flame-600 hover:bg-flame-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
                >
                  Import {fresh.length} contact{fresh.length === 1 ? '' : 's'}
                </button>
              </div>
            </>
          )}

          {status === 'importing' && (
            <div className="flex items-center justify-center gap-3 py-10 text-sm text-silver-600">
              <span className="w-5 h-5 border-2 border-flame-600 border-t-transparent rounded-full animate-spin" />
              Importing…
            </div>
          )}

          {status === 'done' && (
            <div className="flex flex-col items-center text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-flame-600" />
              <h3 className="mt-3 font-display text-xl text-midnight-900">Imported {insertedCount} contact{insertedCount === 1 ? '' : 's'}.</h3>
              <p className="text-sm text-silver-600 mt-1">They are in your contacts now, ready to categorize and follow up.</p>
              <button onClick={onClose} className="mt-5 bg-flame-600 hover:bg-flame-700 text-white font-medium rounded-lg px-5 py-2 text-sm transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
