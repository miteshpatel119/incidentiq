import enterpriseData from '@/features/incidents/mock-enterprise-data.json'

export type EnterpriseIncidentProfile = (typeof enterpriseData.profiles)[number]

export const enterpriseIncidentProfiles: readonly EnterpriseIncidentProfile[] =
  enterpriseData.profiles

function looksLikeTimestamp(value: string): boolean {
  if (value.length < 8) return false
  // Check if value matches standard ISO timestamp format (YYYY-MM-DDTHH:MM:SS...)
  const isoTimestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
  if (!isoTimestampRegex.test(value)) return false

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return false

  return true
}

function shiftTimestamps(obj: unknown, base: number): unknown {
  if (typeof obj === 'string') {
    if (!looksLikeTimestamp(obj)) return obj
    const parsed = Date.parse(obj)
    if (Number.isNaN(parsed)) return obj
    return new Date(parsed - (Date.now() - base)).toISOString()
  }
  if (Array.isArray(obj)) return obj.map((item) => shiftTimestamps(item, base))
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = shiftTimestamps(value, base)
    }
    return result
  }
  return obj
}

export function getEnterpriseIncidentProfile(
  scenarioKey: string,
  incidentCreatedAt?: number,
): EnterpriseIncidentProfile | undefined {
  const profile = enterpriseIncidentProfiles.find((profile) => profile.scenarioKey === scenarioKey)
  if (profile === undefined || incidentCreatedAt === undefined) return profile
  return shiftTimestamps(profile, incidentCreatedAt) as EnterpriseIncidentProfile
}
