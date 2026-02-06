import FoodAllergiesClientPage from 'lib/components/food-allergy/FoodAllergiesClientPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { getFoodAllergies } from 'lib/data/food-allergies'
import { serializeFoodAllergies } from 'lib/types/food-allergy'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ListsPage() {
  const foodAllergies = await getFoodAllergies()
  const serializedFoodAllergies = serializeFoodAllergies(foodAllergies)

  return (
    <>
      <PageHeader title={'Seznamy'}>
        <Link href="/admin/lists/food-allergies/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-utensils"></i>
            <span>Nová alergie na jídlo</span>
          </button>
        </Link>
      </PageHeader>

      <FoodAllergiesClientPage initialData={serializedFoodAllergies} />
    </>
  )
}
