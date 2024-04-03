import CreateAreaForm from 'lib/components/area/CreateAreaForm'

export const dynamic = 'force-dynamic'

type Props = {
  params: {
    eventId: string
  }
}

export default function NewAreaPage({ params }: Props) {
  return <CreateAreaForm eventId={params.eventId} />
}
