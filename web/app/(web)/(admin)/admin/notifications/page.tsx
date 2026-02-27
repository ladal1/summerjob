import NoActiveEventPage from 'lib/components/error-page/NoActiveEventPage'
import EditBox from 'lib/components/forms/EditBox'
import SendPushNotificationForm from 'lib/components/notifications/SendPushNotificationForm'
import PageHeader from 'lib/components/page-header/PageHeader'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'

export const dynamic = 'force-dynamic'

export default async function NotificationPage() {
  const event = await cache_getActiveSummerJobEvent()
  if (!event) {
    return <NoActiveEventPage></NoActiveEventPage>
  }

  return (
    <>
      <PageHeader title={'Notifikace'} isFluid={false} />
      <section>
        <div className="container mb-3">
          <EditBox>
            <h4 className="mb-3">
              Zaslání hromadné notifikace všem účastníkům
            </h4>
            <SendPushNotificationForm />
          </EditBox>
        </div>
      </section>
    </>
  )
}
