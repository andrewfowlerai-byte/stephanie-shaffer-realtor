import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Trash2, ExternalLink, Bell, X, Search, Pencil } from 'lucide-react';
import {
  fetchEvents,
  createEvent,
  createEvents,
  updateEvent,
  deleteEvent,
  buildRecurringDates,
  type CalendarEvent,
  type EventType,
  type Recurrence,
  type NewCalendarEvent,
} from '../lib/calendarEvents';
import type { Contact } from '../lib/types';

// ── Config ────────────────────────────────────────────────────────────────────

const EVENT_TYPES: Record<EventType, { label: string; emoji: string; dot: string; badge: string; border: string }> = {
  lunch:            { label: 'Lunch',            emoji: '🍽️',  dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-800',   border: 'border-l-amber-400'  },
  meeting:          { label: 'Meeting',           emoji: '📋',  dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800',     border: 'border-l-blue-500'   },
  phone_call:       { label: 'Phone Call',         emoji: '📞',  dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800', border: 'border-l-emerald-500' },
  marketing_update: { label: 'Marketing Update',  emoji: '📊',  dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-800', border: 'border-l-violet-500' },
  other:            { label: 'Other',             emoji: '📅',  dot: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-700',   border: 'border-l-slate-400'  },
};

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none',      label: 'No repeat' },
  { value: 'weekly',    label: 'Weekly' },
  { value: 'biweekly',  label: 'Biweekly' },
  { value: 'monthly',   label: 'Monthly' },
];

const REMINDER_OPTIONS = [
  { value: 15,    label: '15 min before' },
  { value: 60,    label: '1 hour before' },
  { value: 1440,  label: '1 day before' },
  { value: 10080, label: '1 week before' },
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDateLabel(dateStr: string): string {
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);
  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function googleCalendarUrl(event: CalendarEvent): string {
  const ds = event.event_date.replace(/-/g, '');
  let dates: string;
  if (event.event_time) {
    const [h, m] = event.event_time.split(':').map(Number);
    const pad = (n: number) => String(n).padStart(2, '0');
    const endH = (h + 1) % 24;
    dates = `${ds}T${pad(h)}${pad(m)}00/${ds}T${pad(endH)}${pad(m)}00`;
  } else {
    const nextDay = new Date(event.event_date + 'T00:00:00');
    nextDay.setDate(nextDay.getDate() + 1);
    const nd = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
    dates = `${ds}/${nd}`;
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
    ...(event.notes ? { details: event.notes } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

async function requestNotifications(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

function scheduleNotifications(events: CalendarEvent[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = Date.now();
  const window24h = 24 * 60 * 60 * 1000;
  events.forEach((ev) => {
    const dt = new Date(`${ev.event_date}T${ev.event_time ?? '09:00'}:00`);
    const reminderMs = (ev.reminder_minutes ?? 60) * 60 * 1000;
    const notifyAt = dt.getTime() - reminderMs;
    const delay = notifyAt - now;
    if (delay > 0 && delay < window24h) {
      setTimeout(() => {
        const cfg = EVENT_TYPES[ev.type];
        new Notification(`${cfg.emoji} ${ev.title}`, {
          body: [ev.client_name, ev.event_time ? formatTime(ev.event_time) : 'All day']
            .filter(Boolean).join(' · '),
          icon: '/favicon.ico',
        });
      }, delay);
    }
  });
}

function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) =>
    a.event_date.localeCompare(b.event_date) ||
    (a.event_time ?? '').localeCompare(b.event_time ?? '')
  );
}

// ── Event Form Modal (Add + Edit) ─────────────────────────────────────────────

interface FormModalProps {
  contacts: Contact[];
  mode: 'add' | 'edit';
  initialEvent?: CalendarEvent;
  defaultDate?: string;
  onSave: (e: NewCalendarEvent) => Promise<void>;
  onClose: () => void;
}

export function EventFormModal({ contacts, mode, initialEvent, defaultDate, onSave, onClose }: FormModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewCalendarEvent & { recurrence: Recurrence }>({
    title:            initialEvent?.title ?? '',
    type:             initialEvent?.type ?? 'meeting',
    recurrence:       initialEvent?.recurrence ?? 'none',
    client_id:        initialEvent?.client_id ?? null,
    client_name:      initialEvent?.client_name ?? null,
    event_date:       initialEvent?.event_date ?? defaultDate ?? today,
    event_time:       initialEvent?.event_time ?? '',
    notes:            initialEvent?.notes ?? '',
    reminder_minutes: initialEvent?.reminder_minutes ?? 60,
  });

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDrop, setShowClientDrop] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);

  const filteredContacts = useMemo(() => {
    const q = clientSearch.toLowerCase();
    if (!q) return [];
    return contacts.filter(
      (c) => c.contact_name?.toLowerCase().includes(q) || c.business_name?.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [contacts, clientSearch]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowClientDrop(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        title:      form.title.trim(),
        event_time: form.event_time || null,
        notes:      form.notes?.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-base">{isEdit ? 'Edit Event' : 'Add Event'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Title *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Lunch with Sarah"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(EVENT_TYPES) as [EventType, typeof EVENT_TYPES[EventType]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('type', key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.type === key
                      ? 'border-flame-500 bg-flame-50 text-flame-700 ring-1 ring-flame-500'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>{cfg.emoji}</span>
                  <span>{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Repeat — only in add mode */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Repeat</label>
              <div className="grid grid-cols-4 gap-1.5">
                {RECURRENCE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set('recurrence', o.value)}
                    className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all text-center ${
                      form.recurrence === o.value
                        ? 'border-flame-500 bg-flame-50 text-flame-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {form.recurrence !== 'none' && (
                <p className="text-xs text-slate-400 mt-1.5">
                  {form.recurrence === 'weekly' ? '26 weeks' : form.recurrence === 'biweekly' ? '13 instances' : '6 months'} will be created automatically.
                </p>
              )}
            </div>
          )}

          {/* Client */}
          <div ref={clientRef}>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Client</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                value={form.client_name ?? clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  set('client_name', null);
                  set('client_id', null);
                  setShowClientDrop(true);
                }}
                onFocus={() => setShowClientDrop(true)}
                placeholder="Search contacts…"
                className="w-full border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
              />
              {form.client_name && (
                <button
                  type="button"
                  onClick={() => { set('client_name', null); set('client_id', null); setClientSearch(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
              {showClientDrop && filteredContacts.length > 0 && !form.client_name && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {filteredContacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        set('client_id', c.id);
                        set('client_name', c.business_name ?? c.contact_name);
                        setClientSearch('');
                        setShowClientDrop(false);
                      }}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 text-sm"
                    >
                      <p className="font-medium text-slate-900">{c.business_name ?? c.contact_name}</p>
                      {c.business_name && <p className="text-xs text-slate-500">{c.contact_name}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Date *</label>
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => set('event_date', e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Time</label>
              <input
                type="time"
                value={form.event_time ?? ''}
                onChange={(e) => set('event_time', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500"
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Reminder</label>
            <select
              value={form.reminder_minutes ?? 60}
              onChange={(e) => set('reminder_minutes', Number(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 bg-white"
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Agenda, location, talking points…"
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-flame-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="flex-1 py-2.5 bg-flame-600 hover:bg-flame-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {saving
                ? (isEdit ? 'Saving…' : form.recurrence !== 'none' ? 'Creating series…' : 'Saving…')
                : (isEdit ? 'Save Changes' : form.recurrence !== 'none' ? `Create series` : 'Add Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: CalendarEvent;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (id: string) => Promise<void>;
}

function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const [deleting, setDeleting] = useState(false);
  const cfg = EVENT_TYPES[event.type];

  async function handleDelete() {
    setDeleting(true);
    try { await onDelete(event.id); } finally { setDeleting(false); }
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-100 border-l-4 ${cfg.border} shadow-sm p-4 flex gap-3`}>
      <div className="flex-1 min-w-0">
        <div className="mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.emoji} {cfg.label}
          </span>
          {event.recurrence !== 'none' && (
            <span className="ml-1.5 text-xs font-medium text-slate-400">
              {event.recurrence === 'weekly' ? '↻ Weekly' : event.recurrence === 'biweekly' ? '↻ Biweekly' : '↻ Monthly'}
            </span>
          )}
        </div>
        <p className="font-semibold text-slate-900 text-sm leading-snug mt-1.5">{event.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {event.event_time && <span className="text-xs text-slate-500">{formatTime(event.event_time)}</span>}
          {event.client_name && (
            <>
              {event.event_time && <span className="text-slate-300 text-xs">·</span>}
              <span className="text-xs text-slate-500">{event.client_name}</span>
            </>
          )}
        </div>
        {event.notes && (
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">{event.notes}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <a
          href={googleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          title="Add to Google Calendar"
          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={() => onEdit(event)}
          title="Edit event"
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete event"
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Calendar Page ─────────────────────────────────────────────────────────────

interface CalendarProps {
  contacts: Contact[];
}

export default function Calendar({ contacts }: CalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // currentMonth lives in the URL (?month=YYYY-MM) so tab-away / iOS PWA
  // reloads don't reset the user back to the current month.
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('month');
  const currentMonth = useMemo(() => {
    if (monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)) {
      const [y, m] = monthParam.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [monthParam]);

  const setCurrentMonth = useCallback(
    (updater: Date | ((prev: Date) => Date)) => {
      const next = typeof updater === 'function' ? updater(currentMonth) : updater;
      const yyyy = next.getFullYear();
      const mm = String(next.getMonth() + 1).padStart(2, '0');
      const params = new URLSearchParams(searchParams);
      params.set('month', `${yyyy}-${mm}`);
      setSearchParams(params, { replace: true });
    },
    [currentMonth, searchParams, setSearchParams],
  );
  // Selected day (?day=YYYY-MM-DD) — persisted so reopening the tab keeps
  // the picked day highlighted and the day's events panel open.
  const dayParam = searchParams.get('day');
  const selectedDate = dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : null;
  const setSelectedDate = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams);
      if (next) params.set('day', next);
      else params.delete('day');
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [notifGranted, setNotifGranted] = useState(false);
  // Upcoming Events list starts collapsed. Auto-opens when a specific day is selected.
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const eventsListRef = useRef<HTMLDivElement>(null);

  // When the user clicks a day in the grid, surface the events list automatically.
  useEffect(() => {
    if (selectedDate) setEventsExpanded(true);
  }, [selectedDate]);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then((data) => { setEvents(data); scheduleNotifications(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { requestNotifications().then(setNotifGranted); }, []);

  // ── Calendar grid ──────────────────────────────────────────────────────────

  const { year, month, cells } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return { year, month, cells };
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((e) => { map.set(e.event_date, [...(map.get(e.event_date) ?? []), e]); });
    return map;
  }, [events]);

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function handleDayClick(day: number) {
    const ds = toDateString(year, month, day);
    setSelectedDate(selectedDate === ds ? null : ds);
    setTimeout(() => eventsListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  // ── Upcoming / filtered events ─────────────────────────────────────────────

  const displayEvents = useMemo(() => {
    if (selectedDate) return events.filter((e) => e.event_date === selectedDate);
    return events.filter((e) => e.event_date >= todayStr);
  }, [events, selectedDate, todayStr]);

  const groupedEvents = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    displayEvents.forEach((e) => {
      const label = formatDateLabel(e.event_date);
      map.set(label, [...(map.get(label) ?? []), e]);
    });
    return Array.from(map.entries());
  }, [displayEvents]);

  // ── Event CRUD ─────────────────────────────────────────────────────────────

  async function handleAdd(newEvent: NewCalendarEvent) {
    const recurrence = (newEvent as NewCalendarEvent & { recurrence: Recurrence }).recurrence ?? 'none';

    if (recurrence !== 'none') {
      const dates = buildRecurringDates(newEvent.event_date, recurrence);
      const rows = dates.map((d) => ({ ...newEvent, event_date: d }));
      const created = await createEvents(rows);
      setEvents((prev) => sortEvents([...prev, ...created]));
      scheduleNotifications(created);
    } else {
      const created = await createEvent(newEvent);
      setEvents((prev) => sortEvents([...prev, created]));
      scheduleNotifications([created]);
    }
    setShowModal(false);
  }

  async function handleEdit(updates: NewCalendarEvent) {
    if (!editingEvent) return;
    const updated = await updateEvent(editingEvent.id, updates);
    setEvents((prev) => sortEvents(prev.map((e) => (e.id === updated.id ? updated : e))));
    setEditingEvent(null);
  }

  async function handleDelete(id: string) {
    await deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Lunches, meetings & client updates</p>
        </div>
        <div className="flex items-center gap-2">
          {notifGranted && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <Bell className="w-3 h-3" /> Notifications on
            </span>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-flame-600 hover:bg-flame-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
      </div>

      {/* Month grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <button onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <h2 className="font-bold text-slate-900 text-sm">{monthLabel}</h2>
          <button onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="overflow-x-auto">
        <div className="grid grid-cols-7 border-b border-slate-100 min-w-[560px]">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2 tracking-wider">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-w-[560px]">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[64px] sm:min-h-[96px] border-r border-b border-slate-50 last:border-r-0 bg-slate-50/30" />;
            const ds = toDateString(year, month, day);
            const dayEvents = eventsByDate.get(ds) ?? [];
            const sortedEvents = [...dayEvents].sort((a, b) =>
              (a.event_time ?? '').localeCompare(b.event_time ?? '')
            );
            const visible = sortedEvents.slice(0, 3);
            const overflow = sortedEvents.length - visible.length;
            const isToday = ds === todayStr;
            const isSelected = ds === selectedDate;
            return (
              <button
                key={i}
                onClick={() => handleDayClick(day)}
                className={`min-h-[64px] sm:min-h-[96px] border-r border-b border-slate-100 p-1.5 flex flex-col items-stretch text-left transition-colors last:border-r-0 hover:bg-slate-50 ${isSelected ? 'bg-flame-50' : ''}`}
              >
                <span className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full leading-none flex-shrink-0 mb-1 ${isToday ? 'bg-flame-600 text-white' : isSelected ? 'text-flame-700' : 'text-slate-700'}`}>
                  {day}
                </span>
                {visible.length > 0 && (
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {visible.map((ev) => {
                      const cfg = EVENT_TYPES[ev.type];
                      const timeStr = ev.event_time ? formatTime(ev.event_time) : '';
                      return (
                        <div
                          key={ev.id}
                          className={`text-[9px] leading-tight px-1 py-0.5 rounded truncate border-l-2 ${cfg.badge} ${cfg.border}`}
                          title={`${timeStr ? timeStr + ' · ' : ''}${ev.title}${ev.client_name ? ' · ' + ev.client_name : ''}`}
                        >
                          {timeStr && <span className="font-semibold mr-1">{timeStr}</span>}
                          {ev.title}
                        </div>
                      );
                    })}
                    {overflow > 0 && (
                      <div className="text-[9px] text-slate-400 pl-1">+{overflow} more</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(EVENT_TYPES) as [EventType, typeof EVENT_TYPES[EventType]][]).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-slate-500">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Events list */}
      <div ref={eventsListRef}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setEventsExpanded((v) => !v)}
            className="flex items-center gap-2 group"
            aria-expanded={eventsExpanded}
          >
            <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform ${eventsExpanded ? 'rotate-0' : '-rotate-90'}`} />
            <h2 className="font-bold text-slate-900">
              {selectedDate ? formatDateLabel(selectedDate) : 'Upcoming Events'}
            </h2>
            {!eventsExpanded && displayEvents.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                ({displayEvents.length})
              </span>
            )}
          </button>
          {selectedDate && (
            <button onClick={() => setSelectedDate(null)} className="text-xs text-flame-600 hover:text-flame-700 font-semibold flex items-center gap-1">
              <X className="w-3 h-3" /> Clear filter
            </button>
          )}
        </div>

        {eventsExpanded && (loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-flame-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groupedEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-2xl mb-2">📅</p>
            <p className="font-semibold text-slate-700 text-sm">{selectedDate ? 'Nothing scheduled' : 'No upcoming events'}</p>
            <p className="text-xs text-slate-400 mt-1">Click Add Event to get started</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedEvents.map(([label, evts]) => (
              <div key={label}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                <div className="space-y-2">
                  {evts.map((ev) => (
                    <EventCard key={ev.id} event={ev} onEdit={setEditingEvent} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <EventFormModal
          contacts={contacts}
          mode="add"
          defaultDate={selectedDate ?? todayStr}
          onSave={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <EventFormModal
          contacts={contacts}
          mode="edit"
          initialEvent={editingEvent}
          onSave={handleEdit}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
}
