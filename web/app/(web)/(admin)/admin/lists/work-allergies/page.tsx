import PageHeader from 'lib/components/page-header/PageHeader'
import WorkAllergiesClientPage from 'lib/components/work-allergy/WorkAllergiesClientPage'
import { getWorkAllergies } from 'lib/data/work-allergies'
import { serializeWorkAllergies } from 'lib/types/work-allergy'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function WorkAllergiesPage() {
  const workAllergies = await getWorkAllergies()
  const serializedWorkAllergies = serializeWorkAllergies(workAllergies)
  return (
    <>
      <PageHeader title={'Pracovní alergie'}>
        <Link href="/admin/lists/work-allergies/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-hammer"></i>
            <span>Nová pracovní alergie</span>
          </button>
        </Link>
      </PageHeader>

      <WorkAllergiesClientPage initialData={serializedWorkAllergies} />
    </>
  )
}
