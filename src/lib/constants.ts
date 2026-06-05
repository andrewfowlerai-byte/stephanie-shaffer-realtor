import type { Stage, Platform, Service } from './types';

export const STAGES: Stage[] = ['Prospect', 'Contacted', 'In Conversation', 'Proposal Out', 'Client'];

export const TIER_DETAILS = {
  1: { price: 350, label: 'Tier 1 — Starter', color: 'bg-blue-100 text-blue-700' },
  2: { price: 750, label: 'Tier 2 — Growth', color: 'bg-purple-100 text-purple-700' },
  3: { price: 1000, label: 'Tier 3 — Full Service', color: 'bg-amber-100 text-amber-700' },
};

export const PLATFORMS: Platform[] = ['Facebook', 'Instagram', 'LinkedIn', 'X', 'TikTok', 'YouTube', 'Pinterest', 'Other'];
export const SERVICES: Service[] = ['Social Media Management', 'Website Design', 'AI Integration', 'Analytics', 'Blog Writing'];
export const SOURCES = ['Real Estate Network', 'CE Class', 'Referral', 'Cold Outreach', 'Social Media', 'Other'];

export const STAGE_COLORS: Record<Stage, string> = {
  'Prospect': 'bg-slate-100 text-slate-600',
  'Contacted': 'bg-blue-100 text-blue-700',
  'In Conversation': 'bg-yellow-100 text-yellow-700',
  'Proposal Out': 'bg-orange-100 text-orange-700',
  'Client': 'bg-green-100 text-green-700',
};
