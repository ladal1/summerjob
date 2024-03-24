import ErrorPage404 from 'lib/components/404/404'
import EditCar from 'lib/components/car/EditCar'
import { getCarById } from 'lib/data/cars'

type PathProps = {
  params: {
    id: string
  }
}

export default async function EditCarPage({ params }: PathProps) {
  const car = await getCarById(params.id)
  if (!car) return <ErrorPage404 message="Auto nenalezeno." />

  return <EditCar car={car} />
}
