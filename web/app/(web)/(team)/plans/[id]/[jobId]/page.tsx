import ErrorPage404 from 'lib/components/404/404'
import EditActiveJobForm from 'lib/components/active-job/EditActiveJobForm'
import { getActiveJobById } from 'lib/data/active-jobs'
import { serializeActiveJob } from 'lib/types/active-job'

type PathProps = {
  params: Promise<{
    id: string
    jobId: string
  }>
}

export default async function EditActiveJobPage(props: PathProps) {
  const params = await props.params;
  const job = await getActiveJobById(params.jobId)
  if (!job) {
    return <ErrorPage404 message="Job nenalezen."></ErrorPage404>
  }
  const serialized = serializeActiveJob(job)
  return <EditActiveJobForm serializedJob={serialized}></EditActiveJobForm>
}
