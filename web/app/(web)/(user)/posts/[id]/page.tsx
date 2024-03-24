import { withPermissions } from 'lib/auth/auth'
import ErrorPage404 from 'lib/components/404/404'
import AccessDeniedPage from 'lib/components/error-page/AccessDeniedPage'
import dateSelectionMaker from 'lib/components/forms/dateSelectionMaker'
import EditPost from 'lib/components/post/EditPost'
import { cache_getActiveSummerJobEvent } from 'lib/data/cache'
import { getPostById } from 'lib/data/posts'
import { Permission } from 'lib/types/auth'
import { serializePost } from 'lib/types/post'

type Params = {
  params: {
    id: string
  }
}

export default async function EditPostPage({ params }: Params) {
  const post = await getPostById(params.id)
  if (!post) {
    console.log('problem')
    return <ErrorPage404 message="Příspěvek nenalezen." />
  }
  const serializedPost = serializePost(post)
  const summerJobEvent = await cache_getActiveSummerJobEvent()
  const { startDate, endDate } = summerJobEvent!

  const allDates = dateSelectionMaker(startDate.toJSON(), endDate.toJSON())

  const isAdvancedAccessAllowed = await withPermissions([Permission.POSTS])

  return (
    <>
      {isAdvancedAccessAllowed.success ? (
        <section className="mb-3">
          <EditPost serializedPost={serializedPost} allDates={allDates} />
        </section>
      ) : (
        <AccessDeniedPage />
      )}
    </>
  )
}
