import ErrorPage404 from 'lib/components/404/404'
import EditToolName from 'lib/components/tool-name/EditToolName'
import { getToolNameById } from 'lib/data/tool-names'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditToolNamePage(props: PathProps) {
  const params = await props.params
  const toolName = await getToolNameById(params.id)
  if (!toolName) return <ErrorPage404 message="Nástroj nenalezen." />

  return <EditToolName toolName={toolName} />
}
