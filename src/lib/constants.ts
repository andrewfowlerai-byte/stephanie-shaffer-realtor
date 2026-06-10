import type { Category } from './types';

// How Stephanie met a contact (lead source).
export const SOURCES = ['Referral', 'Past Client', 'Sphere', 'Open House', 'Sign Call', 'Zillow', 'Realtor.com', 'Social Media', 'Website', 'Other'];

// Realtor contact categories. A contact can hold several.
export const CATEGORIES: Category[] = ['Buyer', 'Seller', 'Past Client', 'Sphere', 'Lead', 'Referral', 'Vendor'];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Buyer':       'bg-blue-100 text-blue-700',
  'Seller':      'bg-emerald-100 text-emerald-700',
  'Past Client': 'bg-flame-100 text-flame-700',
  'Sphere':      'bg-violet-100 text-violet-700',
  'Lead':        'bg-amber-100 text-amber-700',
  'Referral':    'bg-teal-100 text-teal-700',
  'Vendor':      'bg-silver-200 text-silver-700',
};
