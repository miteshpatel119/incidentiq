import enterpriseData from '@/features/incidents/mock-enterprise-data.json'

export type EnterpriseIncidentProfile = (typeof enterpriseData.profiles)[number]

export const enterpriseIncidentProfiles: readonly EnterpriseIncidentProfile[] =
  enterpriseData.profiles

export function getEnterpriseIncidentProfile(
  scenarioKey: string,
): EnterpriseIncidentProfile | undefined {
  return enterpriseIncidentProfiles.find((profile) => profile.scenarioKey === scenarioKey)
}
