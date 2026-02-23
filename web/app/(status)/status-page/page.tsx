import PostType from 'lib/components/post/PostType'
import AutoRefresh from 'lib/components/status-page/AutoRefresh'
import AutoScroll from 'lib/components/status-page/AutoScroll'
import PostCard from 'lib/components/status-page/PostCard'
import { getFreeUpcomingAdorationSlots } from 'lib/data/adoration'
import { getPlanByDate } from 'lib/data/plans'
import { getPostsByDate } from 'lib/data/posts'
import { PostComplete } from 'lib/types/post'

export default async function Page() {
  const todayMidnight = getDateMidnight(new Date())
  const date = getPlanDate()
  const plan = await getPlanByDate(date)
  const adorationSlots = await getFreeUpcomingAdorationSlots(20)

  const posts = await getPostsByDate(todayMidnight)
  const timePosts =
    posts
      ?.filter(post => post.timeFrom !== null && post.timeTo !== null)
      .sort(comparePosts) ?? []
  const generalPosts =
    posts?.filter(post => post.timeFrom === null || post.timeTo === null) ?? []

  return (
    <>
      <AutoRefresh seconds={60} />
      {/* <AutoScroll intervalMs={20} stepPx={1}> */}
      <section>
        <h2 className="mb-4 fs-1">Dnešní události</h2>

        {posts !== null ? (
          <div className="d-flex flex-column gap-4 flex-lg-row">
            <section className="flex-grow-1">
              <PostType title={'Obecné'}>
                <ol className="list-unstyled">
                  {generalPosts.map(post => {
                    return (
                      <li key={post.id}>
                        <PostCard post={post} />
                      </li>
                    )
                  })}
                </ol>
              </PostType>
            </section>
            <section className="flex-grow-1">
              <PostType title={'Časové'}>
                <ol className="list-unstyled">
                  {timePosts.map(post => {
                    return (
                      <li key={post.id}>
                        <PostCard post={post} />
                      </li>
                    )
                  })}
                </ol>
              </PostType>
            </section>
          </div>
        ) : (
          <span>Žádné naplánované události</span>
        )}
      </section>

      <hr></hr>
      <section className="mb-5">
        <h2 className="fs-1">Nejbližší volné adorační sloty</h2>
        {adorationSlots !== null ? (
          <ol>
            {adorationSlots.map(as => {
              return (
                <li key={as.id}>
                  {as.location} - {formatDate(as.dateStart)}:{' '}
                  {as.workers.length}/{as.capacity}
                </li>
              )
            })}
          </ol>
        ) : (
          <span>Žádné volné adorační sloty</span>
        )}
      </section>

      <hr />
      <section>
        {plan !== null ? (
          <>
            <h2 className="fs-1">
              Plán na {`${plan.day.getDate()}. ${plan.day.getMonth() + 1}. `}
            </h2>
            <ol>
              {plan.jobs.map(job => {
                return <li key={job.id}>{job.proposedJob.name}</li>
              })}
            </ol>
          </>
        ) : (
          <>
            <h2 className="fs-1">Plán</h2>
            <span>Plán zatím nebyl zveřejněn</span>
          </>
        )}
      </section>
      {/* </AutoScroll> */}
    </>
  )
}

function getPlanDate() {
  // Show today's plan if it is before 15:00, show tomorrow's plan otherwise
  const date = new Date()
  if (date.getHours() >= 16) {
    date.setDate(date.getDate() + 1)
  }
  return getDateMidnight(date)
}

function getDateMidnight(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

function formatDate(date: Date) {
  return `${date.getDate()}. ${date.getMonth()}. v ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

// Function for sorting time posts
function comparePosts(a: PostComplete, b: PostComplete) {
  const aFromSplit = a.timeFrom?.split(':')
  const aHrs = Number(aFromSplit![0])
  const aMin = Number(aFromSplit![1])

  const bFromSplit = b.timeFrom?.split(':')
  const bHrs = Number(bFromSplit![0])
  const bMin = Number(bFromSplit![1])

  if (aHrs < bHrs) return -1
  if (aHrs > bHrs) return 1
  if (aMin < bMin) return -1
  if (aMin > bMin) return 1
  return 0
}
