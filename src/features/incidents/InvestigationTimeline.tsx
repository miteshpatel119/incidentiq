import { CheckCircle2, Circle, LoaderCircle, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'
import type { InvestigationStep } from '@/features/incidents/investigationTypes'

interface InvestigationTimelineProps {
  readonly steps: readonly InvestigationStep[]
}

const statusIcon: Record<string, ReactNode> = {
  pending: <Circle className="h-4 w-4 text-muted-foreground/40" />,
  'in-progress': <LoaderCircle className="h-4 w-4 animate-spin text-primary" />,
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
}

export function InvestigationTimeline({ steps }: InvestigationTimelineProps): JSX.Element {
  const lastCompletedIndex = ((): number => {
    for (let i = steps.length - 1; i >= 0; i--) {
      if (steps[i]?.status === 'completed') return i
    }
    return -1
  })()

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Investigation steps
      </h3>
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isActive = step.status === 'in-progress'
          const isCompleted = step.status === 'completed'
          const isLast = index === steps.length - 1
          const showLine = !isLast

          return (
            <div className="relative flex gap-4 pb-6 last:pb-0" key={step.id}>
              {/* Vertical connecting line */}
              {showLine ? (
                <div
                  className={cn(
                    'absolute left-[15px] top-8 w-px',
                    index < lastCompletedIndex ? 'bg-emerald-400/40' : 'bg-border',
                    isActive ? 'animate-pulse bg-primary/40' : '',
                  )}
                  style={{ height: 'calc(100% - 8px)' }}
                />
              ) : null}

              {/* Status icon */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  isCompleted ? 'bg-emerald-500/10' : '',
                  isActive ? 'bg-primary/10' : '',
                  step.status === 'failed' ? 'bg-destructive/10' : '',
                )}
              >
                {statusIcon[step.status]}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.status === 'pending' ? 'text-muted-foreground/50' : 'text-foreground',
                    isActive ? 'text-primary' : '',
                  )}
                >
                  {step.label}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-xs',
                    step.status === 'pending'
                      ? 'text-muted-foreground/40'
                      : 'text-muted-foreground',
                    isActive ? 'text-primary/80' : '',
                  )}
                >
                  {step.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
