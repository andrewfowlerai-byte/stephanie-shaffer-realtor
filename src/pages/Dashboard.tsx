import { useEffect, useState } from 'react';
import { Users, Bell, CalendarDays, UserPlus } from 'lucide-react';
import type { Contact } from '../lib/types';
import ContactModal from '../components/ContactModal';
import DailyTasks from '../components/DailyTasks';
import SuggestedFollowups from '../components/SuggestedFollowups';
import NotificationsToggle from '../components/NotificationsToggle';
import { EventFormModal } from './Calendar';
import { fetchEvents, updateEvent, type CalendarEvent, type NewCalendarEvent } from '../lib/calendarEvents';
import { localDateString, localDateLabel } from '../lib/dateLabels';

interface DashboardProps {
  contacts: Contact[];
  loading: boolean;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  addContact: (data: Omit<Contact, 'id' | 'created_at'>) => Promise<void>;
}

const EVENT_TYPE_EMOJI: Record<string, string> = {
  lunch: '🍽️', meeting: '📋', marketing_update: '📊', other: '📅',
};
const EVENT_TYPE_COLOR: Record<string, string> = {
  lunch: 'text-amber-700 bg-amber-50 border-amber-200',
  meeting: 'text-blue-700 bg-blue-50 border-blue-200',
  marketing_update: 'text-violet-700 bg-violet-50 border-violet-200',
  other: 'text-silver-600 bg-silver-100 border-silver-200',
};

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function Dashboard({ contacts, loading, updateContact, addContact }: DashboardProps) {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Live-updating day label, pinned to America/New_York. Recomputes each
  // minute so the weekday never goes stale across midnight on an open tab.
  const [todayLabel, setTodayLabel] = useState(() => localDateLabel());
  useEffect(() => {
    const update = () => setTodayLabel(localDateLabel());
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, []);

  const refreshEvents = () => {
    const todayStr = localDateString();
    fetchEvents()
      .then((evs) => setTodayEvents(evs.filter((e) => e.event_date === todayStr)))
      .catch(() => {});
  };
  useEffect(() => { refreshEvents(); }, []);

  const handleSaveEvent = async (updates: NewCalendarEvent) => {
    if (!editingEvent) return;
    await updateEvent(editingEvent.id, updates);
    setEditingEvent(null);
    refreshEvents();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-flame-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const todayStr = localDateString();
  const followupsToday = contacts.filter((c) => c.next_followup && c.next_followup <= todayStr);
  const newThisWeek = contacts.filter((c) => c.created_at.slice(0, 10) >= daysAgo(7));

  return (
    <div className="space-y-6">
      {/* Brand header band */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-midnight-900 via-midnight-900 to-midnight-800 px-6 py-5 shadow-sm">
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-flame-300/80 mb-1">
          Stephanie Shaffer · {todayLabel}
        </p>
        <h1 className="font-display text-2xl text-white">Good to see you.</h1>
        <p className="text-sm text-silver-300 mt-1">Here is what needs you today.</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Contacts" icon={<Users className="w-4 h-4" />}>{contacts.length}</StatCard>
        <StatCard label="Follow-ups Today" icon={<Bell className="w-4 h-4" />}>{followupsToday.length}</StatCard>
        <StatCard label="New This Week" icon={<UserPlus className="w-4 h-4" />}>{newThisWeek.length}</StatCard>
      </div>

      <NotificationsToggle />

      <DailyTasks />

      {/* Who to reach out to */}
      <SuggestedFollowups
        contacts={contacts}
        onSelect={(c) => setEditingContact(c)}
      />

      {/* Today's schedule */}
      {todayEvents.length > 0 && (
        <Card title="Today's Schedule" icon={<CalendarDays className="w-4 h-4 text-flame-600" />}>
          <div className="space-y-2">
            {todayEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setEditingEvent(ev)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm ${EVENT_TYPE_COLOR[ev.type]}`}
              >
                <span className="text-base flex-shrink-0">{EVENT_TYPE_EMOJI[ev.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{ev.title}</p>
                  {ev.client_name && <p className="text-xs opacity-75 truncate">{ev.client_name}</p>}
                </div>
                {ev.event_time && (
                  <span className="font-mono text-xs font-semibold flex-shrink-0 opacity-75">{formatTime(ev.event_time)}</span>
                )}
              </button>
            ))}
          </div>
        </Card>
      )}

      {editingContact && (
        <ContactModal
          contact={editingContact}
          onSave={addContact}
          onUpdate={updateContact}
          onClose={() => setEditingContact(null)}
        />
      )}

      {editingEvent && (
        <EventFormModal
          contacts={contacts}
          mode="edit"
          initialEvent={editingEvent}
          onSave={handleSaveEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}

// ---------- Card primitives (warm, hairline gold corner accents) ----------

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-silver-200/70 p-5">
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-midnight-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl shadow-sm border border-silver-200 bg-gradient-to-br from-white to-silver-100 p-5">
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-flame-100 text-flame-700 border border-flame-200">
          {icon}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-silver-600 leading-tight">{label}</div>
      </div>
      <p className="font-mono text-3xl font-bold tracking-tight text-midnight-900">{children}</p>
    </div>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const posClass: Record<typeof pos, string> = {
    tl: 'top-1.5 left-1.5 border-l border-t',
    tr: 'top-1.5 right-1.5 border-r border-t',
    bl: 'bottom-1.5 left-1.5 border-l border-b',
    br: 'bottom-1.5 right-1.5 border-r border-b',
  };
  return <div className={`absolute ${posClass[pos]} w-2.5 h-2.5 border-flame-500/40 rounded-[2px]`} aria-hidden="true" />;
}
