import { supabase } from './supabase';

export interface HelpedStory {
  id: string;
  created_at?: string;
  summary: string;
  area: string | null;
  year: number | null;
  published: boolean;
  position: number;
}

export type HelpedStoryInput = Omit<HelpedStory, 'id' | 'created_at'>;

/** Fetch stories. The public site (anon) only ever sees published rows via RLS;
 *  the signed-in CRM user sees everything. */
export async function fetchHelpedStories(opts?: { publishedOnly?: boolean }): Promise<HelpedStory[]> {
  let q = supabase
    .from('helped_stories')
    .select('*')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });
  if (opts?.publishedOnly) q = q.eq('published', true);
  const { data, error } = await q;
  if (error) {
    console.error('[helpedStories] fetch failed', error);
    return [];
  }
  return (data ?? []) as HelpedStory[];
}

export async function createHelpedStory(input: HelpedStoryInput): Promise<HelpedStory> {
  const { data, error } = await supabase.from('helped_stories').insert(input).select().single();
  if (error) throw error;
  return data as HelpedStory;
}

export async function updateHelpedStory(id: string, input: Partial<HelpedStoryInput>): Promise<void> {
  const { error } = await supabase.from('helped_stories').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteHelpedStory(id: string): Promise<void> {
  const { error } = await supabase.from('helped_stories').delete().eq('id', id);
  if (error) throw error;
}
