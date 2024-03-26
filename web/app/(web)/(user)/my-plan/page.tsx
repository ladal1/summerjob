import { getSMJSession } from 'lib/auth/auth'
import ErrorPage404 from 'lib/components/404/404'
import MyPlanClientPage from 'lib/components/my-plan/MyPlanClientPage'
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
  const worker = await getWorkerById(session!.userID)
  if (!worker || !worker.availability) {
    return <ErrorPage404 message="Pracant nenalezen." />
  }
  let plans: MyPlan[] = []
  try {
    plans = await getMyPlans(worker.id)
  } catch (e) {}
  const events = await getMyEvents(session!.userID)
  const sEvents = serializePosts(events)
  return (
    <MyPlanClientPage
      sPlan={serializeMyPlans(plans)}
      sEvents={sEvents}
      userId={session!.userID}
    />
  )
}
