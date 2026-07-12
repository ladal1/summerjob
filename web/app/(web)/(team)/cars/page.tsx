import CarsClientPage from 'lib/components/car/CarsClientPage'
import { getSMJSession } from 'lib/auth/auth'
import { getCars } from 'lib/data/cars'
import { Permission } from 'lib/types/auth'
import { serializeCars } from 'lib/types/car'

export const dynamic = 'force-dynamic'

export default async function CarsPage() {
  const cars = await getCars()
  const serialized = serializeCars(cars)
  const session = await getSMJSession()
  const accessedFromReception = !!session?.permissions.includes(
    Permission.RECEPTION
  )
  return (
    <CarsClientPage
      initialData={serialized}
      accessedFromReception={accessedFromReception}
    />
  )
}
