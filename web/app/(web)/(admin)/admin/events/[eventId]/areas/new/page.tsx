import CreateAreaForm from 'lib/components/area/CreateAreaForm'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{
    eventId: string
  }>
}

export default async function NewAreaPage(props: Props) {
  const params = await props.params;
  return <CreateAreaForm eventId={params.eventId} />
}
