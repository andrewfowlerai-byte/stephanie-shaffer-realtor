export type ListingStatus = 'Active' | 'Pending' | 'Sold';

export interface Listing {
  id: string;
  status: ListingStatus;
  address: string;
  city: string;       // e.g. "Mentor, OH"
  price: number;      // dollars
  beds: number;
  baths: number;
  sqft?: number;
  mls?: string;
  imageUrl?: string;  // absent renders a tasteful gradient placeholder
  description?: string;
  url?: string;       // detail link (her MLS Now / brokerage listing page)
}

/**
 * Featured listings. Placeholder data until the MLS Now IDX feed is connected
 * (see SETUP.md / the MLS Now integration notes). When the feed lands, swap
 * getListings() to fetch from /api and keep this shape so the UI is unchanged.
 */
export const LISTINGS: Listing[] = [
  {
    id: 'sample-1',
    status: 'Active',
    address: 'Sample Listing One',
    city: 'Mentor, OH',
    price: 369000,
    beds: 3,
    baths: 2,
    sqft: 1780,
    mls: 'MLS Now feed pending',
    description: 'Move-in ready ranch in a quiet, walkable neighborhood. Updated kitchen, large yard.',
    url: '/contact',
  },
  {
    id: 'sample-2',
    status: 'Pending',
    address: 'Sample Listing Two',
    city: 'Willoughby, OH',
    price: 475000,
    beds: 4,
    baths: 3,
    sqft: 2450,
    mls: 'MLS Now feed pending',
    description: 'Spacious colonial with a finished basement and a flat, fenced lot near parks and schools.',
    url: '/contact',
  },
  {
    id: 'sample-3',
    status: 'Active',
    address: 'Sample Listing Three',
    city: 'Chardon, OH',
    price: 625000,
    beds: 4,
    baths: 3,
    sqft: 3100,
    mls: 'MLS Now feed pending',
    description: 'Set on acreage in Geauga County. Open floor plan, first-floor primary suite, three-car garage.',
    url: '/contact',
  },
];

export function getListings(): Listing[] {
  return LISTINGS;
}

export function formatPrice(dollars: number): string {
  return `$${dollars.toLocaleString('en-US')}`;
}
