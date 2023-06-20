import { redirect } from 'next/navigation'
type Props = {
  params: {
    eventId: string
  }
}

export default function AreasPage({ params }: Props) {
  redirect(`/admin/events/${params.eventId}`)
}
