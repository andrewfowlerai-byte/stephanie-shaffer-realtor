import { supabase } from './supabase';
import type { Category, Contact } from './types';

export interface ParsedContact {
  contact_name: string;
  email?: string;
  phone?: string;
  birthday?: string; // YYYY-MM-DD
  address?: string;
}

// ─── Entry point ────────────────────────────────────────────────────────────

/** Parse an uploaded file (CSV from Google/iCloud/Outlook, or a .vcf vCard). */
export function parseImportFile(fileName: string, text: string): ParsedContact[] {
  const looksVcard = /\.vcf$/i.test(fileName) || /BEGIN:VCARD/i.test(text);
  return looksVcard ? parseVCard(text) : csvRowsToContacts(parseCsv(text));
}

// ─── CSV ──────────────────────────────────────────────────────────────────-

/** Parse CSV text into objects keyed by header. Handles quoted fields, escaped
 *  quotes, and commas / newlines inside quotes. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = csvToRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
      return obj;
    });
}

function csvToRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else { cell += ch; }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell); cell = '';
    } else if (ch === '\n') {
      row.push(cell); rows.push(row); row = []; cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

export function csvRowsToContacts(rows: Record<string, string>[]): ParsedContact[] {
  return rows.map(mapCsvRow).filter((c): c is ParsedContact => c !== null);
}

/** Find a value by exact header match first, then by a header that contains a hint. */
function field(row: Record<string, string>, exact: string[], contains: string[]): string {
  const keys = Object.keys(row);
  for (const e of exact) {
    const k = keys.find((kk) => kk.toLowerCase() === e.toLowerCase());
    if (k && row[k]?.trim()) return row[k].trim();
  }
  for (const c of contains) {
    const k = keys.find((kk) => kk.toLowerCase().includes(c.toLowerCase()));
    if (k && row[k]?.trim()) return row[k].trim();
  }
  return '';
}

function mapCsvRow(row: Record<string, string>): ParsedContact | null {
  const full = field(row, ['Name', 'Display Name', 'Formatted Name'], []);
  const first = field(row, ['First Name', 'Given Name'], []);
  const last = field(row, ['Last Name', 'Family Name'], []);
  const email = field(row, ['E-mail 1 - Value', 'E-mail Address', 'Email', 'E-mail'], ['mail']);
  const phone = field(row, ['Phone 1 - Value', 'Mobile Phone', 'Phone'], ['phone', 'mobile', 'tel']);
  const birthday = normalizeBday(field(row, ['Birthday', 'Birthdate'], ['birth']));
  const address = field(row, ['Address 1 - Formatted', 'Home Address', 'Address'], ['address']);

  let name = full || [first, last].filter(Boolean).join(' ').trim();
  if (!name) name = email || phone || '';
  if (!name && !email && !phone) return null;
  if (!name) name = 'Unknown';

  return {
    contact_name: name,
    email: email || undefined,
    phone: phone || undefined,
    birthday: birthday || undefined,
    address: address || undefined,
  };
}

// ─── vCard ──────────────────────────────────────────────────────────────────

export function parseVCard(text: string): ParsedContact[] {
  const blocks = text.split(/BEGIN:VCARD/i).slice(1);
  const out: ParsedContact[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim());
    let fn = '', n = '', email = '', tel = '', bday = '', adr = '';
    for (const line of lines) {
      const u = line.toUpperCase();
      const after = line.includes(':') ? line.slice(line.indexOf(':') + 1).trim() : '';
      if (u.startsWith('FN:')) fn = after;
      else if (u.startsWith('N:') || u.startsWith('N;')) n = after;
      else if (u.startsWith('EMAIL') && !email) email = after;
      else if (u.startsWith('TEL') && !tel) tel = after;
      else if (u.startsWith('BDAY')) bday = after;
      else if (u.startsWith('ADR') && !adr) adr = after;
    }
    let name = fn || nameFromN(n);
    if (!name) name = email || tel || '';
    if (!name && !email && !tel) continue;
    if (!name) name = 'Unknown';
    out.push({
      contact_name: name,
      email: email || undefined,
      phone: tel || undefined,
      birthday: normalizeBday(bday) || undefined,
      address: formatAdr(adr) || undefined,
    });
  }
  return out;
}

function nameFromN(n: string): string {
  // Family;Given;Additional;Prefix;Suffix
  const parts = n.split(';');
  const family = parts[0]?.trim() ?? '';
  const given = parts[1]?.trim() ?? '';
  return [given, family].filter(Boolean).join(' ').trim();
}

function formatAdr(adr: string): string {
  if (!adr) return '';
  return adr.split(';').map((p) => p.trim()).filter(Boolean).join(', ');
}

// ─── Helpers ──────────────────────────────────────────────────────────────-

function pad2(n: string): string { return n.padStart(2, '0'); }

function normalizeBday(raw: string): string {
  if (!raw) return '';
  const s = raw.trim();
  let m: RegExpMatchArray | null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if ((m = s.match(/^(\d{4})(\d{2})(\d{2})$/))) return `${m[1]}-${m[2]}-${m[3]}`;
  if ((m = s.match(/^--(\d{2})-?(\d{2})$/))) return `1900-${m[1]}-${m[2]}`; // month/day only
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return `${m[3]}-${pad2(m[1])}-${pad2(m[2])}`;
  if ((m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/))) return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
  return '';
}

const normEmail = (s?: string) => (s ?? '').toLowerCase().trim();
const normPhone = (s?: string) => (s ?? '').replace(/\D/g, '').slice(-10);

/** Split parsed rows into genuinely new vs duplicates (against existing CRM contacts
 *  and against earlier rows in the same file), matching on email or last-10 phone digits. */
export function splitNewVsDuplicate(
  parsed: ParsedContact[],
  existing: Contact[],
): { fresh: ParsedContact[]; dupes: ParsedContact[] } {
  const existingEmails = new Set(existing.map((c) => normEmail(c.email)).filter(Boolean));
  const existingPhones = new Set(existing.map((c) => normPhone(c.phone)).filter((p) => p.length >= 10));
  const seenEmail = new Set<string>();
  const seenPhone = new Set<string>();
  const fresh: ParsedContact[] = [];
  const dupes: ParsedContact[] = [];

  for (const p of parsed) {
    const e = normEmail(p.email);
    const ph = normPhone(p.phone);
    const isDup =
      (e && (existingEmails.has(e) || seenEmail.has(e))) ||
      (ph.length >= 10 && (existingPhones.has(ph) || seenPhone.has(ph)));
    if (isDup) {
      dupes.push(p);
    } else {
      fresh.push(p);
      if (e) seenEmail.add(e);
      if (ph.length >= 10) seenPhone.add(ph);
    }
  }
  return { fresh, dupes };
}

/** Insert new contacts in chunks. Applies an optional category to all of them. */
export async function bulkInsertContacts(parsed: ParsedContact[], category: Category | null): Promise<number> {
  if (parsed.length === 0) return 0;
  const rows = parsed.map((p) => ({
    contact_name: p.contact_name,
    email: p.email ?? null,
    phone: p.phone ?? null,
    birthday: p.birthday ?? null,
    address: p.address ?? null,
    stage: 'Prospect' as const,
    source: 'import',
    categories: category ? [category] : [],
  }));
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { data, error } = await supabase.from('contacts').insert(chunk).select('id');
    if (error) throw error;
    inserted += data?.length ?? chunk.length;
  }
  return inserted;
}
