import { supabase } from './supabase';
import { localDateString } from './dateLabels';

export type DailyTaskPriority = 'high' | 'medium' | 'low';
export type DailyTaskSource = 'debrief' | 'manual';

export interface DailyTask {
  id: string;
  user_id: string;
  task_date: string; // YYYY-MM-DD
  title: string;
  detail: string | null;
  priority: DailyTaskPriority;
  source: DailyTaskSource;
  position: number;
  completed_at: string | null;
  created_at: string;
}

/**
 * Fetch today's daily tasks for the signed-in staff user. Returns tasks
 * ordered by completion (incomplete first), then priority (high → low),
 * then position.
 */
export async function fetchTodayTasks(): Promise<DailyTask[]> {
  const today = localDateString();
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
