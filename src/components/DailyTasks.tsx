import { useEffect, useState, type FormEvent } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import {
  fetchTodayTasks,
  toggleTaskComplete,
  addManualTask,
  deleteTask,
  type DailyTask,
  type DailyTaskPriority,
} from '../lib/dailyTasks';

/**
 * Daily Tasks card for the Dashboard. Auto-populated by the morning debrief
 * (its GPT-generated checklist) and editable by the user. Check items off,
 * add manual tasks, delete what you don't want. Persists per-staff per-day.
 *
 * Refresh prop: pass a number that changes whenever you want to force a
 * re-fetch (e.g., after the user plays a fresh debrief).
 */
interface DailyTasksProps {
  refreshKey?: number;
}

export default function DailyTasks({ refreshKey = 0 }: DailyTasksProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newPriority, setNewPriority] = useState<DailyTaskPriority>('medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchTodayTasks();
      if (!cancelled) {
        setTasks(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleToggle = async (task: DailyTask) => {
    const isComplete = !task.completed_at;
    const updated = await toggleTaskComplete(task.id, isComplete);
    if (updated) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteTask(id);
    if (ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleAddSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    const added = await addManualTask({
      title: newTitle,
      detail: newDetail || undefined,
      priority: newPriority,
    });
    setSaving(false);
    if (added) {
      setTasks((prev) => [...prev, added]);
      setNewTitle('');
      setNewDetail('');
      setNewPriority('medium');
      setShowAdd(false);
    }
  };

  const completedCount = tasks.filter((t) => t.completed_at).length;
  const totalCount = tasks.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/70 p-5">
      {/* Corner brackets */}
      <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-l border-t border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-r border-t border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-l border-b border-amber-500/40 rounded-[2px]" aria-hidden="true" />
      <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-r border-b border-amber-500/40 rounded-[2px]" aria-hidden="true" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-800 flex items-center gap-1.5">
          <span className="text-slate-400">11</span>
          Daily Tasks
        </h2>
        {totalCount > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
            {completedCount}/{totalCount} · {pct}%
          </span>
        )}
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-flame-600 hover:text-flame-700 transition-colors"
          title="Add task"
        >
          {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showAdd ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleAddSubmit}
          className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title (e.g., Reach out to one warm referral)"
            required
            autoFocus
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
          />
          <input
            type="text"
            value={newDetail}
            onChange={(e) => setNewDetail(e.target.value)}
            placeholder="Detail (optional)"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
          />
          <div className="flex items-center justify-between gap-2">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as DailyTaskPriority)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent"
            >
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <button
              type="submit"
              disabled={saving || !newTitle.trim()}
              className="px-4 py-1.5 bg-flame-600 hover:bg-flame-700 disabled:opacity-60 text-white font-medium rounded-lg text-xs transition-colors"
            >
              {saving ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      {loading ? (
        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
          Play your debrief to generate today's tasks, or add one manually.
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const isDone = !!task.completed_at;
            return (
              <li
                key={task.id}
                className={`group flex items-start gap-3 p-2.5 rounded-xl border transition-colors ${
                  isDone
                    ? 'bg-slate-50 border-slate-100'
                    : 'bg-white border-slate-200 hover:border-amber-400/50'
                }`}
              >
                <button
                  onClick={() => handleToggle(task)}
                  className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 transition-colors flex items-center justify-center ${
                    isDone
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-slate-300 hover:border-amber-400'
                  }`}
                  aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isDone && (
                    <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-white">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${
                        isDone ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        task.priority === 'high'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : task.priority === 'medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      } ${isDone ? 'opacity-50' : ''}`}
                    >
                      {task.priority}
                    </span>
                    {task.source === 'manual' && (
                      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">
                        manual
                      </span>
                    )}
                  </div>
                  {task.detail && (
                    <p
                      className={`text-xs mt-0.5 ${
                        isDone ? 'text-slate-300 line-through' : 'text-slate-500'
                      }`}
                    >
                      {task.detail}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Delete task"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
