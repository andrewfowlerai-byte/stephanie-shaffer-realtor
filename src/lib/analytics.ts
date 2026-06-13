import { supabase } from './supabase';

const VISITOR_KEY = 'ss_visitor_id';

/** A stable random id per browser, kept in localStorage. No PII; used only to
 *  count unique visitors. Returns 'anon' if storage is unavailable. */
function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

/** Record one public-site page view. Best-effort: never blocks or throws. */
export async function trackPageView(path: string): Promise<void> {
  try {
    await supabase.from('page_views').insert({
      path: path.slice(0, 300),
      visitor_id: getVisitorId(),
      referrer: (typeof document !== 'undefined' && document.referrer) ? document.referrer.slice(0, 300) : null,
    });
  } catch {
    /* analytics must never affect the visitor experience */
  }
}

export interface SiteStats {
  views_today: number;
  views_7d: number;
  views_30d: number;
  visitors_7d: number;
  visitors_30d: number;
}

/** Aggregate site stats for the dashboard (signed-in user only). */
export async function fetchSiteStats(): Promise<SiteStats | null> {
  const { data, error } = await supabase.rpc('site_view_stats');
  if (error) {
    console.error('[analytics] site_view_stats failed', error);
    return null;
  }
  return data as SiteStats;
}
