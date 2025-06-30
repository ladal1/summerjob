import FoodDeliveryClientPage from 'lib/components/plan/FoodDeliveryClientPage'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const { id } = params

  return <FoodDeliveryClientPage planId={id} />
}
