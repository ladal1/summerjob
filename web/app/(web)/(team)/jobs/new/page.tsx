import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'
import CreateProposedJobForm from 'lib/components/jobs/CreateProposedJobForm'
import { getAreas } from 'lib/data/areas'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { serializeAreas } from 'lib/types/area'

export const dynamic = 'force-dynamic'

export default async function CreateProposedJobPage() {
  const areas = await getAreas()
  const serializedAreas = serializeAreas(areas)
  const summerJobEvent = await cache_getActiveSummerJobEvent()
  const { startDate, endDate } = summerJobEvent!

  const allDates = dateSelectionMaker(startDate.toJSON(), endDate.toJSON())

  return (
    <CreateProposedJobForm
      serializedAreas={serializedAreas}
      allDates={allDates}
    />
  )
}
