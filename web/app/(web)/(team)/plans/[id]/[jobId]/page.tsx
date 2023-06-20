import ErrorPage404 from 'lib/components/404/404'
import EditActiveJobForm from 'lib/components/active-job/EditActiveJobForm'
import EditBox from 'lib/components/forms/EditBox'
import { getActiveJobById } from 'lib/data/active-jobs'
import { serializeActiveJob } from 'lib/types/active-job'

type PathProps = {
  params: {
    id: string
    jobId: string
  }
}

export default async function EditActiveJobPage({ params }: PathProps) {
  const job = await getActiveJobById(params.jobId)
  if (!job) {
    return <ErrorPage404 message="Job nenalezen."></ErrorPage404>
  }
  const serialized = serializeActiveJob(job)
  return (
    <section>
      <EditBox>
        <EditActiveJobForm serializedJob={serialized}></EditActiveJobForm>
      </EditBox>
    </section>
  )
}
