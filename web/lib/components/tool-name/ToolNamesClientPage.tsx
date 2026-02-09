'use client'
import { Serialized } from 'lib/types/serialize'
import { deserializeToolNames, ToolNameComplete } from 'lib/types/tool-name'
import { useAPIToolNames } from 'lib/fetcher/tool-name'
import { ToolNamesTable } from './ToolNamesTable'

interface ToolNamesClientPageProps {
  initialData: Serialized
}

export default function ToolNamesClientPage({
  initialData,
}: ToolNamesClientPageProps) {
  const initialToolNames = deserializeToolNames(initialData)
  const { data, mutate } = useAPIToolNames({
    fallbackData: initialToolNames,
  })

  const requestReload = (expectedResult: ToolNameComplete[]) => {
    mutate(expectedResult)
  }

  return (
    <>
      <section>
        <div className="container-fluid">
          <h3>Nástroje</h3>
          <div className="row gx-3"></div>
          <div className="row gx-3">
            <div className="col-lg-10 pb-2">
              <ToolNamesTable data={data} reload={requestReload} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
