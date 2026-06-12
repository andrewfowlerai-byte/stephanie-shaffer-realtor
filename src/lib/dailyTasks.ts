import { supabase } from './supabase';
import { localDateString } from './dateLabels';

export type DailyTaskPriority = 'high' | 'medium' | 'low';
export type DailyTaskSource = 'debrief' | 'manual' | 'recurring';

export interface DailyTask {
  id: string;
  user_id: string;
  task_date: string; // YYYY-MM-DD
  title: string;
  detail: string | null;
  priority: DailyTaskPriority;
  source: DailyTaskSource;
  recurring_task_id: string | null;
  position: number;
  completed_at: string | null;
  created_at: string;
}

/** A repeating task template. It materializes a fresh daily_tasks row on each
 *  selected weekday (0 = Sunday ... 6 = Saturday). */
export interface RecurringTask {
  id: string;
  user_id: string;
  title: string;
  detail: string | null;
  priority: DailyTaskPriority;
  weekdays: number[];
  active: boolean;
  created_at: string;
}

/**
 * Fetch today's daily tasks for the signed-in staff user. Returns tasks
 * ordered by completion (incomplete first), then priority (high → low),
 * then position.
 */
export async function fetchTodayTasks(): Promise<DailyTask[]> {
  const today = localDateString();
  const weekday = new Date().getDay(); // 0 = Sunday ... 6 = Saturday (local)

  // Materialize any recurring tasks scheduled for today (idempotent: one row per
  // template per day). Each scheduled day gets a fresh, uncompleted instance.
  const { data: recs } = await supabase
    .from('recurring_tasks')
    .select('*')
    .eq('active', true)
    .contains('weekdays', [weekday]);
  if (recs && recs.length > 0) {
    const rows = (recs as RecurringTask[]).map((r, i) => ({
      user_id: r.user_id,
      task_date: today,
      title: r.title,
      detail: r.detail,
      priority: r.priority,
      source: 'recurring' as const,
      recurring_task_id: r.id,
      position: 200 + i,
    }));
    await supabase
      .from('daily_tasks')
      .upsert(rows, { onConflict: 'recurring_task_id,task_date', ignoreDuplicates: true });
  }

  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('task_date', today)
    .order('position', { ascending: true });
  if (error) {
    console.error('[dailyTasks] fetch failed', error);
    return [];
  }
  return (data ?? []) as DailyTask[];
}

/**
 * Toggle a task's completion state. Returns the updated row, or null on
 * failure.
 */
export async function toggleTaskComplete(
  id: string,
  complete: boolean,
): Promise<DailyTask | null> {
  const { data, error } = await supabase
    .from('daily_tasks')
    .update({ completed_at: complete ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('[dailyTasks] toggle failed', error);
    return null;
  }
  return data as DailyTask;
}

/**
 * Add a manual task to today. Title is required. Priority defaults to
 * 'medium'. Returns the new row or null on failure.
 */
export async function addManualTask(opts: {
  title: string;
  detail?: string;
  priority?: DailyTaskPriority;
}): Promise<DailyTask | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const today = localDateString();

  // Put new manual tasks at the end of the list for today
  const { data: existing } = await supabase
    .from('daily_tasks')
    .select('position')
    .eq('task_date', today)
    .order('position', { ascending: false })
    .limit(1);
  const nextPosition = (existing && existing.length > 0 ? existing[0].position : 0) + 1;

  const { data, error } = await supabase
    .from('daily_tasks')
    .insert({
      user_id: user.id,
      task_date: today,
      title: opts.title.trim(),
      detail: opts.detail?.trim() || null,
      priority: opts.priority ?? 'medium',
      source: 'manual',
      position: nextPosition,
    })
    .select()
    .single();
  if (error) {
    console.error('[dailyTasks] insert failed', error);
    return null;
  }
  return data as DailyTask;
}

/**
 * Delete a task.
 */
export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase.from('daily_tasks').delete().eq('id', id);
  if (error) {
    console.error('[dailyTasks] delete failed', error);
    return false;
  }
  return true;
}

// ─── Recurring task templates ───────────────────────────────────────────────

export async function listRecurringTasks(): Promise<RecurringTask[]> {
  const { data, error } = await supabase
    .from('recurring_tasks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[recurringTasks] list failed', error);
    return [];
  }
  return (data ?? []) as RecurringTask[];
}

export async function createRecurringTask(opts: {
  title: string;
  detail?: string;
  priority?: DailyTaskPriority;
  weekdays: number[];
}): Promise<RecurringTask | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('recurring_tasks')
    .insert({
      user_id: user.id,
      title: opts.title.trim(),
      detail: opts.detail?.trim() || null,
      priority: opts.priority ?? 'medium',
      weekdays: opts.weekdays,
    })
    .select()
    .single();
  if (error) {
    console.error('[recurringTasks] insert failed', error);
    return null;
  }
  return data as RecurringTask;
}

/** Delete a recurring template. Cascades to its materialized daily_tasks rows,
 *  so the task stops repeating and leaves today's list. */
export async function deleteRecurringTask(id: string): Promise<boolean> {
  const { error } = await supabase.from('recurring_tasks').delete().eq('id', id);
  if (error) {
    console.error('[recurringTasks] delete failed', error);
    return false;
  }
  return true;
}
