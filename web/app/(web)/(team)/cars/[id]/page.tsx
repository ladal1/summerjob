import ErrorPage404 from 'lib/components/404/404'
import EditCar from 'lib/components/car/EditCar'
import { getCarById } from 'lib/data/cars'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditCarPage(props: PathProps) {
  const params = await props.params;
  const car = await getCarById(params.id)
  if (!car) return <ErrorPage404 message="Auto nenalezeno." />

  return <EditCar car={car} />
}
