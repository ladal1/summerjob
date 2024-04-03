import { deserializePostsDates, PostComplete } from 'lib/types/post'
import { PostBubble } from '../post/PostBubble'
import EditBox from '../forms/EditBox'
import { FormHeader } from '../forms/FormHeader'
import { compareDates, compareTimes } from 'lib/helpers/helpers'
import { useMemo } from 'react'

interface MyEventsProps {
  date: Date
  events: PostComplete[]
  userId: string
}

export const MyEvents = ({ date, events, userId }: MyEventsProps) => {
  const eventsWithNewDatesAndSorted = useMemo(() => {
    return sortEvents(events.map(item => deserializePostsDates(item)))
  }, [events])

  const filteredEvents = useMemo(() => {
    return filterEvents(date, eventsWithNewDatesAndSorted)
  }, [date, eventsWithNewDatesAndSorted])
  return (
    <>
      <section>
        <EditBox>
          <FormHeader label="Moje události" />
          {filteredEvents.map(event => (
            <div key={event.id}>
              <PostBubble item={event} userId={userId} />
            </div>
          ))}
        </EditBox>
      </section>
    </>
  )
}

function filterEvents(selectedDay: Date, posts: PostComplete[]) {
  if (!posts) return []
  return posts.filter(post => {
    return (
      (post.availability &&
        post.availability.some(availDay => {
          return selectedDay && availDay.getTime() === selectedDay.getTime()
        })) ||
      post.availability === undefined ||
      post.availability.length === 0
    )
  })
}
function sortEvents(posts: PostComplete[]) {
  return [...posts].sort((a, b) => {
    const compareDatesResult = compareDates(a.availability, b.availability)
    if (compareDatesResult === 0) return compareTimes(a.timeFrom, b.timeFrom)
    return compareDatesResult
  })
}
