import { serializeProposedJobs } from 'lib/types/proposed-job'
import { getProposedJobs } from 'lib/data/proposed-jobs'
import ProposedJobsClientPage from 'lib/components/jobs/JobsClientPage'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'

export const dynamic = 'force-dynamic'

export default async function ProposedJobsPage() {
  const jobs = await getProposedJobs()
  const serialized = serializeProposedJobs(jobs)
  const summerJobEvent = await cache_getActiveSummerJobEvent()
  const { startDate, endDate } = summerJobEvent!
  return (
    <ProposedJobsClientPage
      initialData={serialized}
      startDate={startDate.toJSON()}
      endDate={endDate.toJSON()}
    />
  )
}
