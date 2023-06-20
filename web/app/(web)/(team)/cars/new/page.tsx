import CreateCar from 'lib/components/car/CreateCar'
import EditBox from 'lib/components/forms/EditBox'
import { getWorkers } from 'lib/data/workers'

export const dynamic = 'force-dynamic'

export default async function CreateCarPage() {
  const workers = await getWorkers()
  const names = workers.map(worker => {
    return {
      id: worker.id,
      firstName: worker.firstName,
      lastName: worker.lastName,
    }
  })
  return (
    <EditBox>
      <CreateCar workers={names} />
    </EditBox>
  )
}
