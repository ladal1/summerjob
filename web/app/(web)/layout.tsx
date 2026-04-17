import { NavbarServer } from '../../lib/components/navbar/NavbarServer'
import 'styles/bootstrap/css/bootstrap.min.css'
import 'styles/custom.css'
import { getSMJSession } from 'lib/auth/auth'
import { redirect } from 'next/navigation'
import PushNotificationManagerBar from 'lib/components/notifications/PushNotificationManagerBar'

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
      <PushNotificationManagerBar />
      <main>{children}</main>
    </>
  )
}
