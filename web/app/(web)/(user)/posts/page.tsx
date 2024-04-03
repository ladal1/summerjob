import { getSMJSession, withPermissions } from 'lib/auth/auth'
import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'
import PostsClientPage from 'lib/components/post/PostsClientPage'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getPosts } from 'lib/data/posts'
import { Permission } from 'lib/types/auth'
import { serializePosts } from 'lib/types/post'

export const metadata = {
  title: 'Nástěnka',
}

export const dynamic = 'force-dynamic'

export default async function PostsPage() {
  const posts = await getPosts()
  const sPosts = serializePosts(posts)

  const isAdvancedAccessAllowed = await withPermissions([Permission.POSTS])
  const summerJobEvent = await cache_getActiveSummerJobEvent()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { startDate, endDate } = summerJobEvent!

  const allDates = dateSelectionMaker(startDate.toJSON(), endDate.toJSON())
  const session = await getSMJSession()
  return (
    <PostsClientPage
      sPosts={sPosts}
      startDate={startDate.toJSON()}
      endDate={endDate.toJSON()}
      allDates={allDates}
      advancedAccess={isAdvancedAccessAllowed.success}
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userId={session!.userID}
    />
  )
}
