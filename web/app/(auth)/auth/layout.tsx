import 'styles/bootstrap/css/bootstrap.min.css'
import 'styles/custom.css'
import 'styles/auth.css'

export const metadata = {
  title: 'Přihlášení',
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <main>{children}</main>
    </>
  )
}
