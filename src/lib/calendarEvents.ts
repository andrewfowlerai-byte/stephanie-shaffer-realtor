import { supabase } from './supabase';

export type EventType = 'lunch' | 'meeting' | 'marketing_update' | 'other';
export type Recurrence = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  type: EventType;
  recurrence: Recurrence;
  client_id?: string | null;
  client_name?: string | null;
  event_date: string;   // YYYY-MM-DD
  event_time?: string | null; // HH:MM
  notes?: string | null;
  reminder_minutes?: number | null;
  created_at: string;
}

export interface NewCalendarEvent {
  title: string;
  type: EventType;
  recurrence?: Recurrence;
  client_id?: string | null;
  client_name?: string | null;
  event_date: string;
  event_time?: string | null;
  notes?: string | null;
  reminder_minutes?: number | null;
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true });
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

export async function createEvent(event: NewCalendarEvent): Promise<CalendarEvent> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ ...event, recurrence: event.recurrence ?? 'none', user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

/** Batch-insert multiple events (used for recurring series). */
export async function createEvents(events: NewCalendarEvent[]): Promise<CalendarEvent[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const rows = events.map(e => ({ ...e, recurrence: e.recurrence ?? 'none', user_id: user.id }));
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(rows)
    .select();
  if (error) throw error;
  return (data ?? []) as CalendarEvent[];
}

/** Generate the future dates for a recurring event series. */
export function buildRecurringDates(startDate: string, recurrence: Recurrence): string[] {
  if (recurrence === 'none') return [startDate];

  const count = recurrence === 'weekly' ? 26 : recurrence === 'biweekly' ? 13 : 6;
  const dates: string[] = [];
  const cur = new Date(startDate + 'T00:00:00');

  for (let i = 0; i < count; i++) {
    dates.push(cur.toISOString().slice(0, 10));
    if (recurrence === 'weekly') cur.setDate(cur.getDate() + 7);
    else if (recurrence === 'biweekly') cur.setDate(cur.getDate() + 14);
    else cur.setMonth(cur.getMonth() + 1);
  }
  return dates;
}

export async function updateEvent(id: string, updates: Partial<NewCalendarEvent>): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CalendarEvent;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
