import ErrorPage404 from 'lib/components/404/404'
import PageHeader from 'lib/components/page-header/PageHeader'
import EventClientPage from 'lib/components/summerjob-event/EventClientPage'
import { getSummerJobEventById } from 'lib/data/summerjob-event'
import { serializeSummerJobEvent } from 'lib/types/summerjob-event'

type Props = {
  params: Promise<{
    eventId: string
  }>
}

export default async function SummerJobEventPage(props: Props) {
  const params = await props.params;
  const event = await getSummerJobEventById(params.eventId)
  if (!event) {
    return <ErrorPage404 message="Ročník nenalezen."></ErrorPage404>
  }
  const sEvent = serializeSummerJobEvent(event)
  return (
    <>
      <PageHeader title={event.name} isFluid={false}>
        {}
      </PageHeader>
      <EventClientPage sEvent={sEvent} />
    </>
  )
}
