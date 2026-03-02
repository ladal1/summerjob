import NoActiveEventPage from 'lib/components/error-page/NoActiveEventPage'
import EditBox from 'lib/components/forms/EditBox'
import SendPushNotificationForm from 'lib/components/notifications/SendPushNotificationForm'
import PageHeader from 'lib/components/page-header/PageHeader'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { datesBetween } from 'lib/helpers/helpers'

export const dynamic = 'force-dynamic'

export default async function NotificationPage() {
  const event = await cache_getActiveSummerJobEvent()
  if (!event) {
    return <NoActiveEventPage></NoActiveEventPage>
  }

  const availableDates = datesBetween(event.startDate, event.endDate)
  const availableJobs: { jobId: string; jobName: string }[] = []
  const availablePosts: { postId: string; postName: string }[] = []

  return (
    <>
      <PageHeader title={'Notifikace'} isFluid={false} />
      <section>
        <div className="container mb-3">
          <EditBox>
            <>
              <h4 className="mb-3">Zaslání hromadné notifikace účastníkům</h4>
              <SendPushNotificationForm
                availableDates={availableDates}
                availableJobs={availableJobs}
                availablePosts={availablePosts}
              ></SendPushNotificationForm>
            </>
          </EditBox>
        </div>
      </section>
    </>
  )
}
