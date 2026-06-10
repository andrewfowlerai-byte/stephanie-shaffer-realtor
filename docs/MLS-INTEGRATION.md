# Wiring in MLS Now (listings for the website)

Listings are managed by hand in the CRM today: the Listings section lets her add, edit, and hide
listings with photo uploads, backed by Supabase (`listings` table + `listing-photos` bucket). That
fully covers showing Stephanie's own listings with no MLS connection.

This document is the OPTIONAL upgrade path: connecting MLS Now (the NE Ohio MLS) so the site can
display the full area-wide listing feed automatically, rather than only her own listings. The card
UI does not change; only the data source does.

## Step 0: The gate (do this first, it has lead time)

MLS Now listing data is licensed, not public. Before any code can pull live listings:

1. **Broker participation + agent authorization.** IDX data access flows through the
   brokerage. Coldwell Banker Schmidt Realty (the broker) must participate, and Stephanie
   must be authorized to display IDX listings on her site. Her broker or office admin
   usually signs off.
2. **Apply for an IDX / data feed through MLS Now.** Contact MLS Now (mlsnow.com) data or
   membership services, or have the broker do it, and request IDX display access. Confirm
   the current application steps and the IDX display rules with them directly, since these
   change over time.
3. **Agree to the display rules.** IDX has required compliance: a listing-courtesy /
   attribution line, the MLS logo where required, a minimum refresh frequency, and limits
   on how long data can be stored. Whichever route you choose below must honor these.

Expect a few days to a couple of weeks for approval. Start this early.

## Route A: IDX vendor (recommended, fastest)

A third-party IDX vendor is an approved MLS Now data partner. They handle the feed
connection, MLS compliance, and give you either an embeddable widget or an API. Examples
to evaluate: IDX Broker, iHomefinder, Showcase IDX, Realtyna, Real Geeks. Typical cost is
roughly $40 to $100+ per month.

Steps:
1. Pick a vendor that supports MLS Now. Sign up and authorize them against Stephanie's
   MLS Now access (they will walk you through the MLS Now connection).
2. Choose how to display:
   - **Embed (simplest):** the vendor gives you a snippet or an iframe. Drop it into the
     `/listings` page. In `src/pages/marketing/Listings.tsx`, replace `<ListingsGrid />`
     with the vendor embed (a small component that renders their script or iframe). The
     home teaser can keep a few hand-picked featured listings, or also embed a compact widget.
   - **API:** if the vendor exposes a JSON API, prefer that for a fully native look. Then
     follow Route B's wiring, pointing at the vendor API instead of MLS Now directly.
3. Keep the required attribution/disclaimer text the vendor provides (usually built into
   their widget).

Trade-off: fastest and lowest maintenance, but the embed looks like the vendor's UI, and
there is a monthly fee.

## Route B: Direct RESO Web API (most control, more work)

MLS Now exposes listing data through the RESO Web API (the modern standard). You get
credentials, fetch listings server-side, map them to our `Listing` shape, and render them
in the existing cards for a fully native look. No vendor fee, but you own the compliance
and upkeep.

1. **Get credentials from MLS Now**: a RESO Web API base URL plus an access token or
   OAuth client id/secret. Store them as server-only env vars in Vercel, for example
   `MLSNOW_API_BASE`, `MLSNOW_API_TOKEN` (never `VITE_`-prefixed, so they stay off the browser).
2. **Add a serverless route** `api/listings.ts` (mirror the style of the existing
   `api/draft-email.ts`). It:
   - reads the env vars,
   - calls the RESO `Property` resource, filtered to Stephanie's listings or her area
     (for example `StandardStatus eq 'Active'` and her `ListAgentMlsId`),
   - maps RESO fields to our shape,
   - caches the response briefly (respect the MLS minimum refresh rule),
   - returns JSON.
3. **RESO field mapping** to our `Listing` (in `src/lib/listings.ts`):
   - `StandardStatus` to `status` (Active / Pending / Closed)
   - `ListPrice` to `price`
   - `BedroomsTotal` to `beds`
   - `BathroomsTotalInteger` to `baths`
   - `LivingArea` to `sqft`
   - `ListingId` to `mls`
   - `UnparsedAddress` (or street fields) to `address`, `City` + `StateOrProvince` to `city`
   - `Media[0].MediaURL` to `imageUrl`
   - `PublicRemarks` to `description`
4. **Switch the data source**: change `getListings()` in `src/lib/listings.ts` to an async
   `fetchListings()` that calls `/api/listings`, and update `ListingsGrid` (in
   `src/components/marketing/sections.tsx`) to fetch on mount with a loading state. The
   card markup stays the same.
5. **Compliance**: add the required courtesy/attribution line and MLS logo to the listings
   page, and keep the cache within the allowed refresh window.

Trade-off: native look and no monthly fee, but you build and maintain the integration and
own MLS compliance.

## Recommendation

Start the MLS Now / broker application now (Step 0) regardless of route. For speed, go
with Route A (a vendor) to get real listings up quickly. If you later want the listings to
look fully custom and avoid the monthly fee, move to Route B. Either way, the rest of the
site does not change.
