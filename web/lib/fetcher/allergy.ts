import { AllergiesAPIGetResponse } from 'pages/api/allergies'
import { useData } from './fetcher'

export function useAPIAllergies() {
  return useData<AllergiesAPIGetResponse>('/api/allergies')
}
