import CourierDeliveryClientPage from 'lib/components/plan/CourierDeliveryClientPage'

interface PageProps {
  params: Promise<{
    id: string
    courierId: string
  }>
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const { id, courierId } = params

  return <CourierDeliveryClientPage planId={id} courierId={courierId} />
}
