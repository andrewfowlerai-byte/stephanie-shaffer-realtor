import { supabase } from './supabase';

export interface Testimonial {
  id: string;
  created_at?: string;
  name: string;
  quote: string;
  rating: number | null;
  relationship: string | null;
  date: string | null; // YYYY-MM-DD
  published: boolean;
  position: number;
}

export type TestimonialInput = Omit<Testimonial, 'id' | 'created_at'>;

/** Fetch testimonials. The public site (anon) only sees published rows via RLS;
 *  the signed-in CRM user sees everything. */
export async function fetchTestimonials(opts?: { publishedOnly?: boolean }): Promise<Testimonial[]> {
  let q = supabase
    .from('testimonials')
    .select('*')
    .order('position', { ascending: true })
    .order('date', { ascending: false, nullsFirst: false });
  if (opts?.publishedOnly) q = q.eq('published', true);
  const { data, error } = await q;
  if (error) {
    console.error('[testimonials] fetch failed', error);
    return [];
  }
  return (data ?? []) as Testimonial[];
}

export async function createTestimonial(input: TestimonialInput): Promise<Testimonial> {
  const { data, error } = await supabase.from('testimonials').insert(input).select().single();
  if (error) throw error;
  return data as Testimonial;
}

export async function updateTestimonial(id: string, input: Partial<TestimonialInput>): Promise<void> {
  const { error } = await supabase.from('testimonials').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw error;
}
