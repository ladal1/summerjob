import { withPermissions } from 'lib/auth/auth'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'
import CreatePost from 'lib/components/post/CreatePost'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { Permission } from 'lib/types/auth'

export const dynamic = 'force-dynamic'

export default async function CreatePostPage() {
  const summerJobEvent = await cache_getActiveSummerJobEvent()
   
  const { startDate, endDate } = summerJobEvent!

  const allDates = dateSelectionMaker(startDate.toJSON(), endDate.toJSON())

  const isAdvancedAccessAllowed = await withPermissions([Permission.POSTS])

  return (
    <>
      {isAdvancedAccessAllowed.success ? (
        <CreatePost allDates={allDates} />
      ) : (
        <AccessDeniedPage />
      )}
    </>
  )
}
