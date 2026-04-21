'use client'
import { Serialized } from 'lib/types/serialize'
import {
  deserializeTShirtSizes,
  TShirtSizeComplete,
} from 'lib/types/t-shirt-size'
import { useAPITShirtSizes } from 'lib/fetcher/t-shirt-size'
import { TShirtSizesTable } from './TShirtSizesTable'

interface TShirtSizesClientPageProps {
  initialData: Serialized
}

export default function TShirtSizesClientPage({
  initialData,
}: TShirtSizesClientPageProps) {
  const initial = deserializeTShirtSizes(initialData)
  const { data, mutate } = useAPITShirtSizes({
    fallbackData: initial,
  })

  const requestReload = (expectedResult: TShirtSizeComplete[]) => {
    mutate(expectedResult)
  }

  return (
    <section>
      <div className="container-fluid">
        <div className="row gx-3">
          <div className="col-lg-10 pb-2">
            <TShirtSizesTable data={data} reload={requestReload} />
          </div>
        </div>
      </div>
    </section>
  )
}
