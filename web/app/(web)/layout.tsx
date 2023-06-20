import { NavbarServer } from '../../lib/components/navbar/NavbarServer'
import 'styles/bootstrap/css/bootstrap.min.css'
import 'styles/custom.css'
import { getSMJSession } from 'lib/auth/auth'
import { redirect } from 'next/navigation'

export default async function WebLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSMJSession()
  if (!session) {
    return redirect('/auth/signIn')
  }
  return (
    <>
      <NavbarServer session={session} />
      <main>{children}</main>
    </>
  )
}
