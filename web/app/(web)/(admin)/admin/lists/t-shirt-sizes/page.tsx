import PageHeader from 'lib/components/page-header/PageHeader'
import TShirtSizesClientPage from 'lib/components/t-shirt-size/TShirtSizesClientPage'
import { getTShirtSizes } from 'lib/data/t-shirt-sizes'
import { serializeTShirtSizes } from 'lib/types/t-shirt-size'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TShirtSizesPage() {
  const sizes = await getTShirtSizes()
  const serialized = serializeTShirtSizes(sizes)
  return (
    <>
      <PageHeader title={'Velikosti trička'}>
        <Link href="/admin/lists/t-shirt-sizes/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-tshirt"></i>
            <span>Nová velikost</span>
          </button>
        </Link>
      </PageHeader>

      <TShirtSizesClientPage initialData={serialized} />
    </>
  )
}
