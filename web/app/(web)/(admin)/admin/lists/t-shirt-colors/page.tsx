import PageHeader from 'lib/components/page-header/PageHeader'
import TShirtColorsClientPage from 'lib/components/t-shirt-color/TShirtColorsClientPage'
import { getTShirtColors } from 'lib/data/t-shirt-colors'
import { serializeTShirtColors } from 'lib/types/t-shirt-color'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TShirtColorsPage() {
  const colors = await getTShirtColors()
  const serialized = serializeTShirtColors(colors)
  return (
    <>
      <PageHeader title={'Barvy trička'}>
        <Link href="/admin/lists/t-shirt-colors/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-palette"></i>
            <span>Nová barva</span>
          </button>
        </Link>
      </PageHeader>

      <TShirtColorsClientPage initialData={serialized} />
    </>
  )
}
