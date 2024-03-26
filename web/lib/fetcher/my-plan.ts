import { MyPlansAPIGetResponse } from 'pages/api/my-plans'
import { useData } from './fetcher'
import { MyEventsAPIGetResponse } from 'pages/api/my-events'

const MINUTES_10 = 10 * 60 * 1000

export function useAPIMyPlans(options?: any) {
  // Refresh My Plan every 10 minutes
  const opts = Object.assign({ refreshInterval: MINUTES_10 }, options)
  const properties = useData<MyPlansAPIGetResponse>('/api/my-plans', opts)
  if (properties.data && typeof properties.data === 'object') {
    for (const plan of properties.data) {
      plan.day = new Date(plan.day)
    }
  }
  return properties
}

export function useAPIMyEvents(options?: any) {
  return useData<MyEventsAPIGetResponse>('/api/my-events', options)
}
