import NoActiveEventPage from 'lib/components/error-page/NoActiveEventPage'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    return <NoActiveEventPage />
  }
  return <>{children}</>
}
