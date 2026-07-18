import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  readonly actionLabel?: string
  readonly description: string
  readonly icon: LucideIcon
  readonly onAction?: () => void
  readonly title: string
}

export function EmptyState({
  actionLabel,
  description,
  icon: Icon,
  onAction,
  title,
}: EmptyStateProps): JSX.Element {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 text-center">
      <div className="mb-4 rounded-xl bg-secondary p-3 text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
