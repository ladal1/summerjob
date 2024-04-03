import { getSMJSession } from 'lib/auth/auth'
import ErrorPage404 from 'lib/components/404/404'
import MyPlanClientPage from 'lib/components/my-plan/MyPlanClientPage'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getMyEvents } from 'lib/data/my-events'
import { getMyPlans } from 'lib/data/my-plan'
import { getWorkerById } from 'lib/data/workers'
import { MyPlan, serializeMyPlans } from 'lib/types/my-plan'
import { serializePosts } from 'lib/types/post'

export const metadata = {
  title: 'Můj plán',
}

export const dynamic = 'force-dynamic'

export default async function MyPlanPage() {
  const session = await getSMJSession()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userId = session!.userID
  const worker = await getWorkerById(userId)
  if (!worker || !worker.availability) {
    return <ErrorPage404 message="Pracant nenalezen." />
  }
  let plans: MyPlan[] = []
  try {
    plans = await getMyPlans(worker.id)
  } catch (e) {}
  const events = await getMyEvents(userId)
  const sEvents = serializePosts(events)

  const summerJobEvent = await cache_getActiveSummerJobEvent()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { startDate, endDate } = summerJobEvent!
  return (
    <MyPlanClientPage
      sPlan={serializeMyPlans(plans)}
      sEvents={sEvents}
      userId={userId}
      startDate={startDate.toJSON()}
      endDate={endDate.toJSON()}
    />
  )
}
