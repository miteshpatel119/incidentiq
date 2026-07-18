const UNITS = [
  { label: 'year', seconds: 31_536_000 },
  { label: 'month', seconds: 2_592_000 },
  { label: 'week', seconds: 604_800 },
  { label: 'day', seconds: 86_400 },
  { label: 'hour', seconds: 3_600 },
  { label: 'minute', seconds: 60 },
] as const

export function relativeTime(timestamp: number): string {
  const elapsed = Math.floor((Date.now() - timestamp) / 1000)

  if (elapsed < 10) return 'Just now'
  if (elapsed < 60) return `${elapsed}s ago`

  for (const unit of UNITS) {
    const count = Math.floor(elapsed / unit.seconds)
    if (count >= 1) {
      return `${count} ${unit.label}${count === 1 ? '' : 's'} ago`
    }
  }

  return 'Just now'
}