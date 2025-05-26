import ErrorPage404 from 'lib/components/404/404'
import EditAreaForm from 'lib/components/area/EditAreaForm'
import { getAreaById } from 'lib/data/areas'
import { serializeAreaComp } from 'lib/types/area'

type PathProps = {
  params: Promise<{
    eventId: string
    areaId: string
  }>
}

export default async function EditAreaPage(props: PathProps) {
  const params = await props.params;
  const area = await getAreaById(params.areaId)
  if (!area) return <ErrorPage404 message="Oblast nenalezena." />
  const sArea = serializeAreaComp(area)

  return <EditAreaForm sArea={sArea} />
}
