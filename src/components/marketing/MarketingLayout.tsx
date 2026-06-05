import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';

/** Wraps every public marketing route with the warm header + footer chrome. */
export default function MarketingLayout() {
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
