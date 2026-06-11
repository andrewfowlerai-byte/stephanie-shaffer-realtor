import { supabase } from './supabase';

export type ListingStatus = 'Active' | 'Pending' | 'Sold';

export interface Listing {
  id: string;
  created_at?: string;
  status: ListingStatus;
  address: string;
  city: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  mls: string | null;
  description: string | null;
  photos: string[];
  published: boolean;
  position: number;
}

export type ListingInput = Omit<Listing, 'id' | 'created_at'>;

/**
 * Fetch listings. The public site (anon key) only ever sees published rows via
 * RLS; the signed-in CRM user sees everything. Pass limit for the home teaser.
 */
export async function fetchListings(opts?: { limit?: number }): Promise<Listing[]> {
  let q = supabase
    .from('listings')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) {
    console.error('[listings] fetch failed', error);
    return [];
  }
  return (data ?? []) as Listing[];
}

export async function createListing(input: ListingInput): Promise<Listing> {
  const { data, error } = await supabase.from('listings').insert(input).select().single();
  if (error) throw error;
  return data as Listing;
}

export async function updateListing(id: string, input: Partial<ListingInput>): Promise<void> {
  const { error } = await supabase.from('listings').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

/** Upload a photo to the public listing-photos bucket and return its public URL. */
export async function uploadListingPhoto(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('listing-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    const m = (error as { message?: string }).message ?? '';
    if (/bucket not found|not found|does not exist/i.test(m)) {
      throw new Error('Photo storage is not set up yet. In Supabase, create a public bucket named "listing-photos" (it ships in migration 0003).');
    }
    if (/row-level security|unauthorized|jwt|permission/i.test(m)) {
      throw new Error('Not allowed to upload. Make sure you are signed in and the listing-photos bucket policies from migration 0003 are applied.');
    }
    throw new Error(m || 'Photo upload failed.');
  }
  const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
  return data.publicUrl;
}

export function formatPrice(dollars: number | null): string {
  if (dollars == null) return 'Price on request';
  return `$${dollars.toLocaleString('en-US')}`;
}

export interface ParsedListingFields {
  status?: string | null;
  address?: string | null;
  city?: string | null;
  price?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  mls?: string | null;
  description?: string | null;
}

/** Ask the server to read a listing URL or pasted text and extract structured fields. */
export async function parseListingSource(input: { url?: string; text?: string }): Promise<{ fields: ParsedListingFields; note?: string }> {
  const res = await fetch('/api/parse-listing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { fields?: ParsedListingFields; note?: string; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? 'Could not read that listing.');
  return { fields: data.fields ?? {}, note: data.note };
}
