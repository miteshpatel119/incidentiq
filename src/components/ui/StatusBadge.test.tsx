import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('renders severity badge', () => {
    render(<StatusBadge kind="severity" value="critical" />)
    expect(screen.getByText('critical')).toBeInTheDocument()
  })

  it('renders status badge', () => {
    render(<StatusBadge kind="status" value="investigating" />)
    expect(screen.getByText('investigating')).toBeInTheDocument()
  })
})
