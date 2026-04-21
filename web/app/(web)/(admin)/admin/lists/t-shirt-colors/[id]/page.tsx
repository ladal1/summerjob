import ErrorPage404 from 'lib/components/404/404'
import EditTShirtColor from 'lib/components/t-shirt-color/EditTShirtColor'
import { getTShirtColorById } from 'lib/data/t-shirt-colors'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditTShirtColorPage(props: PathProps) {
  const params = await props.params
  const color = await getTShirtColorById(params.id)
  if (!color) return <ErrorPage404 message="Barva trička nenalezena." />

  return <EditTShirtColor tShirtColor={color} />
}
