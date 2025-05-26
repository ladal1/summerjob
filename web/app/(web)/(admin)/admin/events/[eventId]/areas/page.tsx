import { redirect } from 'next/navigation'
type Props = {
  params: Promise<{
    eventId: string
  }>
}

export default async function AreasPage(props: Props) {
  const params = await props.params;
  redirect(`/admin/events/${params.eventId}`)
}
