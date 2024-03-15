import { useMap } from 'react-leaflet'

interface ChangeViewProps {
  center: [number, number]
}

export function ChangeView({ center }: ChangeViewProps) {
  const map = useMap()
  map.panTo(center)
  return null
}
