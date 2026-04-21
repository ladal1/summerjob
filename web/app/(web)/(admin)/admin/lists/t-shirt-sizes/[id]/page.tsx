import ErrorPage404 from 'lib/components/404/404'
import EditTShirtSize from 'lib/components/t-shirt-size/EditTShirtSize'
import { getTShirtSizeById } from 'lib/data/t-shirt-sizes'

type PathProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditTShirtSizePage(props: PathProps) {
  const params = await props.params
  const size = await getTShirtSizeById(params.id)
  if (!size) return <ErrorPage404 message="Velikost trička nenalezena." />

  return <EditTShirtSize tShirtSize={size} />
}
