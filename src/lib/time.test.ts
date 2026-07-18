import { describe, expect, it } from 'vitest'
import { relativeTime } from '@/lib/time'

describe('relativeTime', () => {
  it('returns "Just now" for timestamps less than 10 seconds old', () => {
    expect(relativeTime(Date.now() - 5000)).toBe('Just now')
  })

  it('returns seconds ago for timestamps between 10 seconds and 1 minute', () => {
    expect(relativeTime(Date.now() - 30_000)).toBe('30s ago')
  })

  it('returns minutes ago for timestamps between 1 minute and 1 hour', () => {
    expect(relativeTime(Date.now() - 5 * 60_000)).toBe('5 minutes ago')
  })

  it('returns hours ago for timestamps between 1 hour and 1 day', () => {
    expect(relativeTime(Date.now() - 3 * 3_600_000)).toBe('3 hours ago')
  })
})