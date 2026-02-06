import ErrorPage404 from 'lib/components/404/404'
import EditFoodAllergy from 'lib/components/food-allergy/EditFoodAllergy'
import { getFoodAllergyById } from 'lib/data/food-allergies'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditFoodAllergyPage(props: PathProps) {
  const params = await props.params
  const foodAllergy = await getFoodAllergyById(params.id)
  if (!foodAllergy) return <ErrorPage404 message="Alergie nenalezena." />

  return <EditFoodAllergy foodAllergy={foodAllergy} />
}
