import { Construction } from 'lucide-react'

import { EmptyState } from '@/components/ui/EmptyState'

export function PlaceholderPage({ title }: { readonly title: string }): JSX.Element {
  return (
    <div>
      <p className="text-sm font-medium text-primary">INCIDENTIQ</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-6">
        <EmptyState
          description="This destination is included in the application shell and will be connected to its data workflow next."
          icon={Construction}
          title={`${title} is ready for its workflow`}
        />
      </div>
    </div>
  )
}
