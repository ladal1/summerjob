import GenericErrorPage from './GenericErrorPage'

export default function AccessDeniedPage() {
  return (
    <GenericErrorPage
      title="Přístup odepřen"
      message="Nemáte přístup na tuto stránku."
    />
  )
}
