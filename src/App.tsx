import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useContacts } from './hooks/useContacts';
import Login from './components/Login';
import Layout from './components/Layout';
import MarketingLayout from './components/marketing/MarketingLayout';
import Home from './pages/marketing/Home';
import Listings from './pages/marketing/Listings';
import About from './pages/marketing/About';
import Process from './pages/marketing/Process';
import ContactPage from './pages/marketing/Contact';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Calendar from './pages/Calendar';
import FollowUps from './pages/FollowUps';
import Settings from './pages/Settings';
import ContactModal from './components/ContactModal';

/**
 * One app, two worlds:
 *  - Public marketing routes render with no auth, under MarketingLayout.
 *  - Everything else falls to CrmApp, gated on a Supabase session, redirecting
 *    to /login when there isn't one. Stephanie is the only user; no roles.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing site (multi-page) */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/about" element={<About />} />
          <Route path="/process" element={<Process />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>

        {/* Auth screen (its own chrome) */}
        <Route path="/login" element={<Login />} />

        {/* Auth-gated CRM: /dashboard, /contacts, /calendar, /follow-ups, /settings */}
        <Route path="*" element={<CrmApp />} />
      </Routes>
    </BrowserRouter>
  );
}

function CrmApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    // Only flip on identity-changing events. TOKEN_REFRESHED / INITIAL_SESSION
    // fire on tab focus and would otherwise remount the shell and drop open
    // modals / in-flight form state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_OUT') setSession(null);
      else if (event === 'SIGNED_IN' && newSession) setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-silver-50">
        <div className="animate-spin w-8 h-8 border-4 border-flame-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <CrmShell />;
}

function CrmShell() {
  const { contacts, loading, refresh, addContact, updateContact, deleteContact } = useContacts();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <Layout onAddContact={() => setShowAddModal(true)}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard contacts={contacts} loading={loading} updateContact={updateContact} addContact={addContact} />} />
        <Route path="/contacts" element={<Contacts contacts={contacts} loading={loading} addContact={addContact} updateContact={updateContact} deleteContact={deleteContact} refresh={refresh} />} />
        <Route path="/calendar" element={<Calendar contacts={contacts} />} />
        <Route path="/follow-ups" element={<FollowUps contacts={contacts} loading={loading} updateContact={updateContact} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {showAddModal && (
        <ContactModal onSave={addContact} onClose={() => setShowAddModal(false)} />
      )}
    </Layout>
  );
}
