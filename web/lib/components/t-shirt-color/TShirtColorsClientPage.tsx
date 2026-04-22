'use client'
import { Serialized } from 'lib/types/serialize'
import {
  deserializeTShirtColors,
  TShirtColorComplete,
} from 'lib/types/t-shirt-color'
import { useAPITShirtColors } from 'lib/fetcher/t-shirt-color'
import { TShirtColorsTable } from './TShirtColorsTable'

interface TShirtColorsClientPageProps {
  initialData: Serialized
}

export default function TShirtColorsClientPage({
  initialData,
}: TShirtColorsClientPageProps) {
  const initial = deserializeTShirtColors(initialData)
  const { data, mutate } = useAPITShirtColors({
    fallbackData: initial,
  })

  const requestReload = (expectedResult: TShirtColorComplete[]) => {
    mutate(expectedResult)
  }

  return (
    <section>
      <div className="container-fluid">
        <div className="row gx-3">
          <div className="col-lg-10 pb-2">
            <TShirtColorsTable data={data} reload={requestReload} />
          </div>
        </div>
      </div>
    </section>
  )
}
