import ErrorPage404 from 'lib/components/404/404'
import EditWorkAllergy from 'lib/components/work-allergy/EditWorkAllergy'
import { getWorkAllergyById } from 'lib/data/work-allergies'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditWorkAllergyPage(props: PathProps) {
  const params = await props.params
  const workAllergy = await getWorkAllergyById(params.id)
  if (!workAllergy) return <ErrorPage404 message="Alergie nenalezena." />

  return <EditWorkAllergy workAllergy={workAllergy} />
}
