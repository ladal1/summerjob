import ApplicationAdminPage from 'lib/components/application/ApplicationAdminPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { getActiveSummerJobEvent } from 'lib/data/summerjob-event'

export default async function AdminApplicationsPage() {
  const summerJobEvent = await getActiveSummerJobEvent()

  if (!summerJobEvent) {
    return (
      <p className="text-center text-lg font-bold mt-5">
        Žádný aktivní ročník.
      </p>
    )
  }

  return (
    <>
      <PageHeader title={'Přihlášky'} isFluid={false} />
      <ApplicationAdminPage
        eventId={summerJobEvent.id}
        isApplicationOpen={summerJobEvent.isApplicationOpen}
      />
    </>
  )
}
