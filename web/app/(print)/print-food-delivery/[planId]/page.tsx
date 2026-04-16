import ErrorPage404 from 'lib/components/404/404'
import FoodDeliveryPrint from 'lib/components/plan/print/FoodDeliveryPrint'
import { getFoodDeliveriesWithPlanByPlanId } from 'lib/data/food-delivery'
import '/styles/print.css'

type PathProps = {
  params: Promise<{
    planId: string
  }>
  searchParams: Promise<{ courier?: string }>
}

export default async function PrintFoodDeliveryPage(props: PathProps) {
  const params = await props.params
  const search = await props.searchParams
  const data = await getFoodDeliveriesWithPlanByPlanId(params.planId)
  if (!data) return <ErrorPage404 message="Plán nenalezen." />

  const courierFilter = search.courier ? parseInt(search.courier) : null
  const filteredDeliveries =
    courierFilter !== null && !isNaN(courierFilter)
      ? data.deliveries.filter(d => d.courierNum === courierFilter)
      : data.deliveries

  return <FoodDeliveryPrint plan={data.plan} deliveries={filteredDeliveries} />
}
