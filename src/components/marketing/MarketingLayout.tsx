import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';
import { trackPageView } from '../../lib/analytics';

/** Wraps every public marketing route with the warm header + footer chrome. */
export default function MarketingLayout() {
  const { pathname } = useLocation();
  useEffect(() => { void trackPageView(pathname); }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col bg-silver-50 text-midnight-900 font-sans">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
