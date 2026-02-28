import { JobInfo } from 'app/(print)/print-plan/[id]/page'
import { toZonedTime } from 'date-fns-tz'
import AdorationSlotTable from 'lib/components/status-page/AdorationSlotTable'
import AutoRefresh from 'lib/components/status-page/AutoRefresh'
import AutoScroll from 'lib/components/status-page/AutoScroll'
import PostCard from 'lib/components/status-page/PostCard'
import { getFreeUpcomingAdorationSlots } from 'lib/data/adoration'
import { getPlanByDate } from 'lib/data/plans'
import { getGeneralPostsByDate, getTimePostsByDate } from 'lib/data/posts'
import { formatDateLong, getDateMidnight } from 'lib/helpers/helpers'
import { AdorationSlotWithWorkerIds } from 'lib/types/adoration'
import { sortJobsByAreaAndId } from 'lib/types/plan'
import { PostComplete } from 'lib/types/post'
import { add } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function StatusPage() {
  const date = getPlanDate()
  const now = new Date()
  const todayMidnight = getDateMidnight(now)
  const tomorrowMidnight = add(todayMidnight, { days: 1 })

  const generalPosts = await getGeneralPostsByDate(todayMidnight)
  const todayTimePosts = filterTodayPosts(
    await getTimePostsByDate(todayMidnight)
  )
  const tomorrowTimePosts = await getTimePostsByDate(tomorrowMidnight)

  const adorationSlots = await getFreeUpcomingAdorationSlots(10)
  const groupedAdorationSlots = groupAdorationSlotsByDay(adorationSlots)

  const plan = await getPlanByDate(date)
  const sortedJobs = plan ? sortJobsByAreaAndId(plan.jobs) : []

  return (
    <div className="mb-5">
      <AutoRefresh seconds={15} />
      <AutoScroll intervalMs={20} stepPx={2}>
        <section>
          <h2 className="mb-4 fs-1">Nadcházející události</h2>
          <section className="">
            <h4>Dnešní</h4>
            {generalPosts && generalPosts.length > 0 ? (
              <>
                <section className="flex-grow-1">
                  <ol className="list-unstyled d-flex flex-wrap gap-2">
                    {generalPosts.map(post => {
                      return (
                        <li key={post.id}>
                          <PostCard post={post} />
                        </li>
                      )
                    })}
                  </ol>
                </section>
              </>
            ) : (
              <span>Žádné události</span>
            )}
          </section>

          {todayTimePosts && todayTimePosts.length > 0 && (
            <div className="mb-5">
              <ol className="list-unstyled d-flex flex-wrap gap-2">
                {todayTimePosts?.map(post => {
                  return (
                    <li key={post.id}>
                      <PostCard post={post} />
                    </li>
                  )
                })}
              </ol>
            </div>
          )}
          {tomorrowTimePosts && tomorrowTimePosts.length > 0 && (
            <>
              <h4>Zítřejší</h4>
              <ol className="list-unstyled d-flex flex-wrap gap-2">
                {tomorrowTimePosts?.map(post => {
                  return (
                    <li key={post.id}>
                      <PostCard post={post} />
                    </li>
                  )
                })}
              </ol>
            </>
          )}
          {!todayTimePosts && !tomorrowTimePosts && <span>Žádné události</span>}
        </section>

        <hr></hr>
        <section className="mb-5">
          <h2 className="mb-4 fs-1">Nejbližší volné adorační sloty</h2>
          {adorationSlots !== null && groupedAdorationSlots !== null ? (
            <ol className="list-unstyled d-flex flex-wrap gap-4">
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
              <ol className="list-unstyled d-flex flex-wrap">
                {sortedJobs.map(job => {
                  return (
                    <li key={job.id} className="w-50">
                      <JobInfo
                        job={job}
                        jobs={plan.jobs}
                        isPrintPage={false}
                      ></JobInfo>
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
  const now = toZonedTime(new Date(), 'Europe/Prague')
  if (now.getHours() >= 15) {
    now.setDate(now.getDate() + 1)
  }
  return getDateMidnight(now)
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

function postTimeToDate(time: string): Date {
  const split = time.split(':')
  const hrs = Number(split[0])
  const min = Number(split[1])

  const res = toZonedTime(new Date(), 'Europe/Prague')
  res.setHours(hrs, min, 0, 0)
  return res
}

function filterTodayPosts(posts: PostComplete[]) {
  const now = toZonedTime(new Date(), 'Europe/Prague')
  return posts.filter(post => {
    const postDate = postTimeToDate(post.timeFrom!)
    return postDate > now
  })
}
