import ErrorPage404 from 'lib/components/404/404'
import EditAreaForm from 'lib/components/area/EditAreaForm'
import EditBox from 'lib/components/forms/EditBox'
import { getAreaById } from 'lib/data/areas'
import { serializeAreaComp } from 'lib/types/area'

type PathProps = {
  params: {
    eventId: string
    areaId: string
  }
}

export default async function EditAreaPage({ params }: PathProps) {
  const area = await getAreaById(params.areaId)
  if (!area) return <ErrorPage404 message="Oblast nenalezena." />
  const sArea = serializeAreaComp(area)

  return (
    <EditBox>
      <EditAreaForm sArea={sArea} />
    </EditBox>
  )
}
