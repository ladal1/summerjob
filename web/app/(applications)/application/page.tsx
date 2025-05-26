import ApplicationsPage from 'lib/components/application/ApplicationClientPage'
import { getActiveSummerJobEvent } from 'lib/data/summerjob-event'

export const dynamic = 'force-dynamic'

export default async function ApplicationsPageServer() {
  const summerJobEvent = await getActiveSummerJobEvent()

  if (!summerJobEvent) {
    return (
      <p className="text-center text-lg font-bold mt-5">
        Žádný aktivní ročník.
      </p>
    )
  }

  return (
    <ApplicationsPage
      startDate={summerJobEvent.startDate.toJSON()}
      endDate={summerJobEvent.endDate.toJSON()}
      isApplicationOpen={summerJobEvent.isApplicationOpen}
      isPasswordProtected={summerJobEvent.isPasswordProtected}
      eventId={summerJobEvent.id}
    />
  )
}
