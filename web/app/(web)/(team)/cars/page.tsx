import CarsClientPage from 'lib/components/car/CarsClientPage'
import { getCars } from 'lib/data/cars'
import { serializeCars } from 'lib/types/car'

export const dynamic = 'force-dynamic'

export default async function CarsPage() {
  const cars = await getCars()
  const serialized = serializeCars(cars)
  return <CarsClientPage initialData={serialized} />
}
