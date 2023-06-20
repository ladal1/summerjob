import ErrorPage404 from 'lib/components/404/404'
import EditBox from 'lib/components/forms/EditBox'
import EditProposedJobForm from 'lib/components/jobs/EditProposedJobForm'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getProposedJobById } from 'lib/data/proposed-jobs'
import { serializeProposedJob } from 'lib/types/proposed-job'

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

  const summerJobEvent = await cache_getActiveSummerJobEvent()
  const { startDate, endDate } = summerJobEvent!

  return (
    <section>
      <EditBox>
        <EditProposedJobForm
          serializedJob={serialized}
          eventStartDate={startDate.toJSON()}
          eventEndDate={endDate.toJSON()}
        />
      </EditBox>
    </section>
  )
}
