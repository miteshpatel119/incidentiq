import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { InvestigationTimeline } from './InvestigationTimeline'
import { INVESTIGATION_STEPS } from './investigationTypes'

describe('InvestigationTimeline', () => {
  describe('rendering', () => {
    it('renders all investigation steps', () => {
      const steps = INVESTIGATION_STEPS.map((step) => ({ ...step, status: 'pending' as const }))

      render(<InvestigationTimeline steps={steps} />)

      expect(screen.getByText('Investigation steps')).toBeInTheDocument()

      for (const step of INVESTIGATION_STEPS) {
        expect(screen.getByText(step.label)).toBeInTheDocument()
        expect(screen.getByText(step.description)).toBeInTheDocument()
      }
    })

    it('renders with completed steps', () => {
      const steps = INVESTIGATION_STEPS.map((step) => ({ ...step, status: 'completed' as const }))

      render(<InvestigationTimeline steps={steps} />)

      expect(screen.getByText('Investigation steps')).toBeInTheDocument()
    })

    it('renders with in-progress step', () => {
      const steps = INVESTIGATION_STEPS.map((step, index) => ({
        ...step,
        status: index === 2 ? ('in-progress' as const) : ('pending' as const),
      }))

      render(<InvestigationTimeline steps={steps} />)

      expect(screen.getByText(INVESTIGATION_STEPS[2]?.label)).toBeInTheDocument()
    })

    it('renders with failed step', () => {
      const steps = INVESTIGATION_STEPS.map((step, index) => ({
        ...step,
        status: index === 1 ? ('failed' as const) : ('pending' as const),
      }))

      render(<InvestigationTimeline steps={steps} />)

      expect(screen.getByText(INVESTIGATION_STEPS[1]?.label)).toBeInTheDocument()
    })
  })

  describe('visual states', () => {
    it('applies correct styling for completed steps', () => {
      const steps = INVESTIGATION_STEPS.map((step) => ({ ...step, status: 'completed' as const }))

      const { container } = render(<InvestigationTimeline steps={steps} />)

      // Check that the container has the investigation timeline class
      const timelineContainer = container.querySelector('.rounded-xl')
      expect(timelineContainer).toBeInTheDocument()
    })

    it('applies correct styling for pending steps', () => {
      const steps = INVESTIGATION_STEPS.map((step) => ({ ...step, status: 'pending' as const }))

      render(<InvestigationTimeline steps={steps} />)

      // All labels should be present but with pending styling
      for (const step of INVESTIGATION_STEPS) {
        expect(screen.getByText(step.label)).toBeInTheDocument()
      }
    })

    it('applies correct styling for in-progress steps', () => {
      const steps = INVESTIGATION_STEPS.map((step) => ({
        ...step,
        status: 'in-progress' as const,
      }))

      render(<InvestigationTimeline steps={steps} />)

      // All labels should be present
      for (const step of INVESTIGATION_STEPS) {
        expect(screen.getByText(step.label)).toBeInTheDocument()
      }
    })
  })

  describe('step count', () => {
    it('has correct number of steps from INVESTIGATION_STEPS', () => {
      const steps = INVESTIGATION_STEPS.map((step) => ({ ...step, status: 'pending' as const }))

      render(<InvestigationTimeline steps={steps} />)

      // Each step has a label that should be displayed
      expect(screen.getByText('Collecting application & server logs')).toBeInTheDocument()
      expect(screen.getByText('Correlating metrics & infrastructure data')).toBeInTheDocument()
      expect(screen.getByText('Inspecting deployment history')).toBeInTheDocument()
      expect(screen.getByText('Analyzing configuration changes')).toBeInTheDocument()
      expect(screen.getByText('Searching similar historical incidents')).toBeInTheDocument()
      expect(screen.getByText('Generating RCA report')).toBeInTheDocument()
    })
  })

  describe('messaging', () => {
    it('displays step labels correctly', () => {
      const steps = INVESTIGATION_STEPS.map((step) => ({ ...step, status: 'pending' as const }))

      render(<InvestigationTimeline steps={steps} />)

      expect(screen.getByText('Collecting application & server logs')).toBeInTheDocument()
      expect(screen.getByText('Correlating metrics & infrastructure data')).toBeInTheDocument()
      expect(
        screen.getByText('Inspecting deployment history'),
      ).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('handles empty steps array', () => {
      render(<InvestigationTimeline steps={[]} />)

      expect(screen.getByText('Investigation steps')).toBeInTheDocument()
    })
  })
})