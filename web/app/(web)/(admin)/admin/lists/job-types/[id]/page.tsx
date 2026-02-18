import ErrorPage404 from 'lib/components/404/404'
import EditJobType from 'lib/components/job-type/EditJobType'
import { getJobTypeById } from 'lib/data/job-types'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditJobTypePage(props: PathProps) {
  const params = await props.params
  const jobType = await getJobTypeById(params.id)
  if (!jobType) return <ErrorPage404 message="Typ práce nenalezen." />

  return <EditJobType jobType={jobType} />
}
