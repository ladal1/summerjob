import ErrorPage404 from 'lib/components/404/404'
import EditBox from 'lib/components/forms/EditBox'
import EditProposedJobForm from 'lib/components/jobs/EditProposedJobForm'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getProposedJobById } from 'lib/data/proposed-jobs'
import { serializeProposedJob } from 'lib/types/proposed-job'
import { serializeAreas } from '../../../../../lib/types/area'
import { getAreas } from '../../../../../lib/data/areas'
import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'

type PathProps = {
  params: {
    id: string
  }
}

export default async function EditProposedJobPage({ params }: PathProps) {
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
    <section>
      <EditBox>
        <EditProposedJobForm
          serializedJob={serialized}
          serializedAreas={serializedAreas}
          allDates={allDates}
        />
      </EditBox>
    </section>
  )
}
