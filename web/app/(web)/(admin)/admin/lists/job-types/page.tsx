import PageHeader from 'lib/components/page-header/PageHeader'
import JobTypesClientPage from 'lib/components/job-type/JobTypesClientPage'
import { getJobTypes } from 'lib/data/job-types'
import { serializeJobTypes } from 'lib/types/job-type'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function JobTypesPage() {
  const jobTypes = await getJobTypes()
  const serializedJobTypes = serializeJobTypes(jobTypes)
  return (
    <>
      <PageHeader title={'Typy práce'}>
        <Link href="/admin/lists/job-types/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-briefcase"></i>
            <span>Nový typ práce</span>
          </button>
        </Link>
      </PageHeader>

      <JobTypesClientPage initialData={serializedJobTypes} />
    </>
  )
}
