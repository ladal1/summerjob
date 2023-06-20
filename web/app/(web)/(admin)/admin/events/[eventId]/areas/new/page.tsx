import CreateAreaForm from 'lib/components/area/CreateAreaForm'
import EditBox from 'lib/components/forms/EditBox'

export const dynamic = 'force-dynamic'

type Props = {
  params: {
    eventId: string
  }
}

export default function NewAreaPage({ params }: Props) {
  return (
    <EditBox>
      <CreateAreaForm eventId={params.eventId} />
    </EditBox>
  )
}
