import CourierDeliveryClientPage from 'lib/components/plan/CourierDeliveryClientPage'
import { withPermissions } from 'lib/auth/auth'
import { Permission } from 'lib/types/auth'

interface PageProps {
  params: Promise<{
    id: string
    courierId: string
  }>
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { id, courierId } = params
  const deliveryId =
    typeof searchParams?.deliveryId === 'string'
      ? searchParams.deliveryId
      : courierId

  // Check if user has permission to access delivery management
  const hasDeliveryManagementAccess = await withPermissions([Permission.PLANS])

  return (
    <CourierDeliveryClientPage
      planId={id}
      courierId={deliveryId}
      hasDeliveryManagementAccess={hasDeliveryManagementAccess.success}
    />
  )
}
