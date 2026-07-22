import CourierDeliveryClientPage from 'lib/components/plan/CourierDeliveryClientPage'
import { withPermissions } from 'lib/auth/auth'
import { Permission } from 'lib/types/auth'
import { notFound } from 'next/navigation'

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
  const { id } = params
  const deliveryIdFromQuery = searchParams?.deliveryId
  const resolvedDeliveryId =
    typeof deliveryIdFromQuery === 'string' ? deliveryIdFromQuery : null

  if (!resolvedDeliveryId) {
    notFound()
  }

  // Check if user has permission to access delivery management
  const hasDeliveryManagementAccess = await withPermissions([Permission.PLANS])

  return (
    <CourierDeliveryClientPage
      planId={id}
      courierId={resolvedDeliveryId}
      hasDeliveryManagementAccess={hasDeliveryManagementAccess.success}
    />
  )
}
