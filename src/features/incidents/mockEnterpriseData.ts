import enterpriseData from '@/features/incidents/mock-enterprise-data.json'

export type EnterpriseIncidentProfile = (typeof enterpriseData.profiles)[number]

export const enterpriseIncidentProfiles: readonly EnterpriseIncidentProfile[] =
  enterpriseData.profiles

function shiftTimestamps(obj: unknown, base: number): unknown {
  if (typeof obj === 'string') {
    const parsed = Date.parse(obj)
    if (!Number.isNaN(parsed)) return new Date(parsed - (Date.now() - base)).toISOString()
    return obj
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
