import { JobInfo } from 'app/(print)/print-plan/[id]/page'
import PostType from 'lib/components/post/PostType'
import AdorationSlotTable from 'lib/components/status-page/AdorationSlotTable'
import AutoRefresh from 'lib/components/status-page/AutoRefresh'
import AutoScroll from 'lib/components/status-page/AutoScroll'
import PostCard from 'lib/components/status-page/PostCard'
import { getFreeUpcomingAdorationSlots } from 'lib/data/adoration'
import { getPlanByDate } from 'lib/data/plans'
import { getPostsByDate } from 'lib/data/posts'
import { compareTimes, formatDateLong } from 'lib/helpers/helpers'
import { AdorationSlotWithWorkerIds } from 'lib/types/adoration'
import { PostComplete } from 'lib/types/post'

export default async function StatusPage() {
  const date = getPlanDate()

  const todayMidnight = getDateMidnight(new Date())
  const posts = await getPostsByDate(todayMidnight)
  const timePosts =
    posts
      ?.filter(post => post.timeFrom !== null && post.timeTo !== null)
      .sort(comparePosts) ?? []
  const generalPosts =
    posts?.filter(post => post.timeFrom === null || post.timeTo === null) ?? []

  const adorationSlots = await getFreeUpcomingAdorationSlots(20)
  const groupedAdorationSlots = groupAdorationSlotsByDay(adorationSlots)

  const plan = await getPlanByDate(date)

  return (
    <div className="mb-5">
      <AutoRefresh seconds={15} />
      <AutoScroll intervalMs={20} stepPx={2}>
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
          <h2 className="mb-4 fs-1">Nejbližší volné adorační sloty</h2>
          {adorationSlots !== null && groupedAdorationSlots !== null ? (
            <ol className="list-unstyled">
              {Array.from(groupedAdorationSlots.entries()).map(
                ([key, slots]) => {
                  return (
                    <li key={key}>
                      <AdorationSlotTable label={key} slots={slots} />
                    </li>
                  )
                }
              )}
            </ol>
          ) : (
            <span>Žádné volné adorační sloty</span>
          )}
        </section>

        <hr />
        <section>
          {plan !== null ? (
            <>
              <h2 className="fs-1 mb-4">
                Plán - {formatDateLong(plan.day, false)}
              </h2>
              <ol className="list-unstyled w-75">
                {plan.jobs.map(job => {
                  return (
                    <li key={job.id}>
                      <JobInfo job={job} jobs={plan.jobs}></JobInfo>
                    </li>
                  )
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
      </AutoScroll>
    </div>
  )
}

function getPlanDate() {
  // Show today's plan if it is before 15:00, show tomorrow's plan otherwise
  const date = new Date()
  if (date.getHours() + 1 >= 15) {
    date.setDate(date.getDate() + 1)
  }
  return getDateMidnight(date)
}

function getDateMidnight(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

// Function for sorting time posts
function comparePosts(a: PostComplete, b: PostComplete) {
  return compareTimes(a.timeFrom, b.timeFrom)
}

function groupAdorationSlotsByDay(
  slots: AdorationSlotWithWorkerIds[]
): Map<string, AdorationSlotWithWorkerIds[]> | null {
  if (slots === null || slots.length === 0) {
    return null
  }
  const map = new Map<string, AdorationSlotWithWorkerIds[]>()
  slots.forEach(slot => {
    const key = formatDateLong(slot.dateStart)
    if (map.has(key)) {
      map.get(key)?.push(slot)
    } else {
      map.set(key, [slot])
    }
  })
  return map
}
