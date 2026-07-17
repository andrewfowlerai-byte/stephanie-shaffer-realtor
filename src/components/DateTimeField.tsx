import { Calendar, CalendarClock } from 'lucide-react';

/**
 * A date / datetime field that looks the same on every platform.
 *
 * The native <input type="datetime-local"> (and type="date") is a good PICKER
 * on mobile (the OS wheel), but iOS Safari renders its VALUE as a centered gray
 * pill that ignores your styling and clashes with the rest of the form. So we
 * keep the native input purely as an invisible tap layer and show our own clean,
 * left-aligned, on-brand value on top. Tapping anywhere still opens the OS picker.
 */

function fmt(value: string, mode: 'datetime' | 'date'): string {
  if (!value) return '';
  // datetime-local: 'YYYY-MM-DDTHH:MM'; date: 'YYYY-MM-DD'. Build the Date from
  // parts so a date-only value never shifts a day in a negative UTC offset.
  const [datePart, timePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return value;
  let hh = 0;
  let mm = 0;
  if (timePart) {
    const [h, mi] = timePart.split(':').map(Number);
    hh = h || 0;
    mm = mi || 0;
  }
  const dt = new Date(y, m - 1, d, hh, mm);
  if (isNaN(dt.getTime())) return value;
  return mode === 'date'
    ? dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : dt.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface DateTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  mode?: 'datetime' | 'date';
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  'aria-label'?: string;
}

export function DateTimeField({
  value,
  onChange,
  mode = 'datetime',
  placeholder,
  className = '',
  min,
  max,
  disabled,
  required,
  'aria-label': ariaLabel,
}: DateTimeFieldProps) {
  const display = fmt(value, mode);
  const ph = placeholder ?? (mode === 'date' ? 'Pick a date' : 'Pick a date & time');
  const Icon = mode === 'date' ? Calendar : CalendarClock;

  return (
    <label
      className={`relative flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm transition focus-within:border-flame-500 focus-within:ring-2 focus-within:ring-flame-100 ${
        disabled ? 'opacity-60' : 'cursor-pointer'
      } ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-flame-600" />
      <span className={`min-w-0 flex-1 truncate ${display ? 'text-slate-900' : 'text-slate-400'}`}>
        {display || ph}
      </span>
      <input
        type={mode === 'date' ? 'date' : 'datetime-local'}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        required={required}
        aria-label={ariaLabel || ph}
        onChange={(e) => onChange(e.target.value)}
        // Invisible tap layer over the whole field: opens the OS picker but never
        // shows its own (gray, centered) rendering.
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </label>
  );
}
