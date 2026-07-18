import { cn } from '@/lib/utils'

type Status = 'investigating' | 'mitigated' | 'resolved'
type Severity = 'critical' | 'high' | 'medium' | 'low'

const statusClasses: Record<Status, string> = {
  investigating: 'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300',
  mitigated: 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300',
  resolved: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
}

const severityClasses: Record<Severity, string> = {
  critical: 'bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300',
  high: 'bg-orange-500/15 text-orange-700 ring-orange-500/30 dark:text-orange-300',
  medium: 'bg-yellow-500/15 text-yellow-700 ring-yellow-500/30 dark:text-yellow-300',
  low: 'bg-slate-400/15 text-slate-700 ring-slate-400/30 dark:text-slate-300',
}

interface StatusBadgeProps {
  readonly kind: 'status' | 'severity'
  readonly value: Status | Severity
}

export function StatusBadge({ kind, value }: StatusBadgeProps): JSX.Element {
  const classes =
    kind === 'status' ? statusClasses[value as Status] : severityClasses[value as Severity]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset',
        classes,
      )}
    >
      {value}
    </span>
  )
}
