import { getSMJSession } from 'lib/auth/auth'
import { redirect } from 'next/navigation'

export default async function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSMJSession()
  if (!session) {
    return redirect('/auth/signIn')
  }
  return <>{children}</>
}
