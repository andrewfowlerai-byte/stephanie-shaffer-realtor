import { CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';

/**
 * Billing page: lets Stephanie pay her monthly invoice to ANF Consulting from
 * inside the CRM. The Pay button opens a Stripe-hosted page (a Payment Link or
 * Customer Portal URL) so no card data ever touches this app. The destination
 * and plan label are configured via Vercel env vars; if no URL is set the page
 * shows a friendly "not set up yet" note instead of a dead button.
 *
 *   VITE_BILLING_URL    the Stripe payment / customer-portal link (required to enable Pay)
 *   VITE_BILLING_PLAN   plan label shown on the card (optional)
 *   VITE_BILLING_PRICE  display price, e.g. "$250 / month" (optional)
 */
const BILLING_URL = import.meta.env.VITE_BILLING_URL as string | undefined;
const BILLING_PLAN = (import.meta.env.VITE_BILLING_PLAN as string) || 'Website & CRM, hosting and support';
const BILLING_PRICE = import.meta.env.VITE_BILLING_PRICE as string | undefined;

export default function Billing() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl text-midnight-900">Billing</h1>
        <p className="text-sm text-silver-600 mt-0.5">Your monthly subscription with ANF Consulting.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-silver-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-flame-100 text-flame-700 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver-500">Your plan</p>
            <p className="font-display text-lg text-midnight-900 mt-0.5">{BILLING_PLAN}</p>
            {BILLING_PRICE && <p className="font-display text-3xl text-midnight-900 mt-2">{BILLING_PRICE}</p>}
          </div>
        </div>

        {BILLING_URL ? (
          <a
            href={BILLING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full bg-flame-600 hover:bg-flame-700 px-6 py-3 text-sm font-semibold text-white transition-colors"
          >
            Pay your invoice <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <div className="mt-6 rounded-xl border border-silver-200 bg-silver-50 px-4 py-3 text-sm text-silver-600">
            Online payment is not set up yet. Reach out to ANF Consulting and we will add your secure payment link here.
          </div>
        )}

        <p className="mt-4 flex items-start gap-1.5 text-xs text-silver-500">
          <ShieldCheck className="w-3.5 h-3.5 text-flame-600 mt-0.5 flex-shrink-0" />
          Payments are processed securely by Stripe. Your card details never touch this site.
        </p>
      </div>

      <p className="text-xs text-silver-500">
        Questions about your invoice? Contact ANF Consulting at{' '}
        <a href="https://anfconsult.com" target="_blank" rel="noopener noreferrer" className="text-flame-600 hover:text-flame-700">anfconsult.com</a>.
      </p>
    </div>
  );
}
