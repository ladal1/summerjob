import GenericErrorPage from './GenericErrorPage'

export default function NoActiveEventPage() {
  return (
    <GenericErrorPage
      title="Nastavte aktivní ročník"
      message="V systému není nastaven aktivní ročník. Nastavte ho v administraci."
    />
  )
}
