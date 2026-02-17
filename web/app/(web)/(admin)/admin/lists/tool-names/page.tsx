import PageHeader from 'lib/components/page-header/PageHeader'
import ToolNamesClientPage from 'lib/components/tool-name/ToolNamesClientPage'
import { getToolNames } from 'lib/data/tool-names'
import { serializeToolNames } from 'lib/types/tool-name'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ToolNamesPage() {
  const toolNames = await getToolNames()
  const serializedToolNames = serializeToolNames(toolNames)
  return (
    <>
      <PageHeader title={'Nástroje'}>
        <Link href="/admin/lists/tool-names/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-tools"></i>
            <span>Nový nástroj</span>
          </button>
        </Link>
      </PageHeader>

      <ToolNamesClientPage initialData={serializedToolNames} />
    </>
  )
}
