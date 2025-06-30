import CourierDeliveryClientPage from 'lib/components/plan/CourierDeliveryClientPage'
import { withPermissions } from 'lib/auth/auth'
import { Permission } from 'lib/types/auth'

interface PageProps {
  params: Promise<{
    id: string
    courierId: string
  }>
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const { id, courierId } = params

  // Check if user has permission to access delivery management
  const hasDeliveryManagementAccess = await withPermissions([Permission.PLANS])

  return (
    <CourierDeliveryClientPage 
      planId={id} 
      courierId={courierId} 
      hasDeliveryManagementAccess={hasDeliveryManagementAccess.success}
    />
  )
}
