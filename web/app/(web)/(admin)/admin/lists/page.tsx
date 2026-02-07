import PageHeader from 'lib/components/page-header/PageHeader'
import FoodAllergiesClientPage from 'lib/components/food-allergy/FoodAllergiesClientPage'
import { getFoodAllergies } from 'lib/data/food-allergies'
import { serializeFoodAllergies } from 'lib/types/food-allergy'
import WorkAllergiesClientPage from 'lib/components/work-allergy/WorkAllergiesClientPage'
import { getWorkAllergies } from 'lib/data/work-allergies'
import { serializeWorkAllergies } from 'lib/types/work-allergy'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ListsPage() {
  const foodAllergies = await getFoodAllergies()
  const serializedFoodAllergies = serializeFoodAllergies(foodAllergies)

  const workAllergies = await getWorkAllergies()
  const serializedWorkAllergies = serializeWorkAllergies(workAllergies)
  return (
    <>
      <PageHeader title={'Seznamy'}>
        <Link href="/admin/lists/food-allergies/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-utensils"></i>
            <span>Nová alergie na jídlo</span>
          </button>
        </Link>

        <Link href="/admin/lists/work-allergies/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-hammer"></i>
            <span>Nová pracovní alergie</span>
          </button>
        </Link>
      </PageHeader>

      <FoodAllergiesClientPage initialData={serializedFoodAllergies} />
      <WorkAllergiesClientPage initialData={serializedWorkAllergies} />
    </>
  )
}
