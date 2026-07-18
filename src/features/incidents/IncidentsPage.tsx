import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { CreateIncidentForm } from '@/features/incidents/CreateIncidentForm'
import { IncidentTable } from '@/features/incidents/IncidentTable'
import { MonitoringConnection } from '@/features/incidents/MonitoringConnection'
import { useIncidentSimulation } from '@/features/incidents/IncidentSimulationProvider'

export function IncidentsPage(): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { incidents, createIncident } = useIncidentSimulation()

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">OPERATIONS</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Incidents</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A single, searchable view of your incident response work.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create incident
        </Button>
      </header>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create incident">
        <CreateIncidentForm
          onSubmit={(data) => {
            createIncident(data)
            setIsModalOpen(false)
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      <MonitoringConnection />
      <IncidentTable incidents={incidents} />
    </div>
  )
}
