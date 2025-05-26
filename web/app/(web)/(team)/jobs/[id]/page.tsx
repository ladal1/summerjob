import ErrorPage404 from 'lib/components/404/404'
import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'
import EditProposedJobForm from 'lib/components/jobs/EditProposedJobForm'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getProposedJobById } from 'lib/data/proposed-jobs'
import { serializeProposedJob } from 'lib/types/proposed-job'
import { getAreas } from '../../../../../lib/data/areas'
import { serializeAreas } from '../../../../../lib/types/area'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditProposedJobPage(props: PathProps) {
  const params = await props.params;
  const job = await getProposedJobById(params.id)
  if (!job) {
    return <ErrorPage404 message="Job nenalezen."></ErrorPage404>
  }
  const serialized = serializeProposedJob(job)
  const areas = await getAreas()
  const serializedAreas = serializeAreas(areas)
  const summerJobEvent = await cache_getActiveSummerJobEvent()
   
  const { startDate, endDate } = summerJobEvent!

  const allDates = dateSelectionMaker(startDate.toJSON(), endDate.toJSON())

  return (
    <EditProposedJobForm
      serializedJob={serialized}
      serializedAreas={serializedAreas}
      allDates={allDates}
    />
  )
}
