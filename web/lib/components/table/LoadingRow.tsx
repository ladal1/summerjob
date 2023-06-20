import { MessageRow } from './MessageRow'

interface RowProps {
  colspan: number
}

export function LoadingRow({ colspan }: RowProps) {
  return <MessageRow message={'Načítání...'} colspan={colspan} />
}
