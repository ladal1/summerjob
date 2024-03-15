import dynamic from 'next/dynamic'
import { MapProps } from './Map'
import { ComponentType } from 'react'

/**
 * This fix is neccassary because Map will otherwise try server side rendering where window dosn't exists.
 * So this basically disables server side rendering ssr.
 * For functional Map component it is neccasary use Map as directory Map and not the file Map.tsx inside of it.
 */
const Map: ComponentType<MapProps> = dynamic(
  () => import('./Map').then(module => module.Map),
  {
    ssr: false,
  }
)

export default Map
