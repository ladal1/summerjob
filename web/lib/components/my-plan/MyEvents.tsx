import { deserializePostsDates, PostComplete } from 'lib/types/post'
import { PostBubble } from '../post/PostBubble'
import EditBox from '../forms/EditBox'
import { FormHeader } from '../forms/FormHeader'
import { compareDates, compareTimes, getHourAndMinute } from 'lib/helpers/helpers'
import { useMemo, useState } from 'react'

interface MyEventsProps {
  date: Date
  events: PostComplete[]
  userId: string
}

export const MyEvents = ({ date, events, userId }: MyEventsProps) => {
  const [showAllToday, setShowAllToday] = useState(false)

  const eventsWithNewDatesAndSorted = useMemo(() => {
    return sortEvents(events.map(item => deserializePostsDates(item)))
  }, [events])

  const filteredEvents = useMemo(() => {
    return filterEvents(date, eventsWithNewDatesAndSorted, showAllToday)
  }, [date, eventsWithNewDatesAndSorted, showAllToday])

  return (
    <>
      <section>
        <EditBox>
          <div className="position-relative">
            <FormHeader label="Moje události" />
            <button
              className="btn btn-outline-secondary position-absolute d-flex align-items-center justify-content-center"
              style={{ 
                top: '0.25rem', 
                right: '0.25rem', 
                height: 'calc(100% - 0.5rem)',
                width: '2.5rem'
              }}
              onClick={() => setShowAllToday(!showAllToday)}
              title={showAllToday ? 'Skrýt dokončené události' : 'Zobrazit všechny dnešní události'}
            >
              <i className={`fas ${showAllToday ? 'fa-eye-slash' : 'fa-history'}`}></i>
            </button>
          </div>
          {filteredEvents.map(event => (
            <div className="pt-1" key={event.id}>
              <PostBubble item={event} userId={userId} />
            </div>
          ))}
        </EditBox>
      </section>
    </>
  )
}

export function filterEvents(selectedDay: Date, posts: PostComplete[], showAllToday: boolean = false) {
  if (!posts) return []
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const selectedDayTime = new Date(selectedDay)
  selectedDayTime.setHours(0, 0, 0, 0)
  
  const isSelectedDayToday = selectedDayTime.getTime() === today.getTime()
  
  return posts.filter(post => {
    // First filter by date availability
    const isEventOnSelectedDay = (post.availability &&
      post.availability.some(availDay => {
        return (
          selectedDay &&
          availDay.getDate() === selectedDay.getDate() &&
          availDay.getMonth() === selectedDay.getMonth() &&
          availDay.getFullYear() === selectedDay.getFullYear()
        )
      })) ||
      post.availability === undefined ||
      post.availability.length === 0

    if (!isEventOnSelectedDay) {
      return false
    }

    // If showing all today's events, don't filter by time
    if (showAllToday && isSelectedDayToday) {
      return true
    }

    // Filter out past events
    if (post.availability && post.availability.length > 0) {
      const now = new Date()
      const hasRunningOrFutureEvents = post.availability.some(date => {
        const eventDate = new Date(date)
        eventDate.setHours(0, 0, 0, 0)
        
        // If event is in the future, include it
        if (eventDate.getTime() > today.getTime()) {
          return true
        }
        
        // If event is today, check if it has ended
        if (eventDate.getTime() === today.getTime()) {
          // If no end time specified, include it (all-day event)
          if (!post.timeTo) {
            return true
          }
          
          // Check if the event has ended today
          const [endHour, endMinute] = getHourAndMinute(post.timeTo)
          const eventEndTime = new Date(eventDate)
          eventEndTime.setHours(endHour, endMinute, 0, 0)
          
          // Include if event hasn't ended yet
          return eventEndTime.getTime() > now.getTime()
        }
        
        return false
      })
      return hasRunningOrFutureEvents
    }
    
    return true
  })
}
function sortEvents(posts: PostComplete[]) {
  return [...posts].sort((a, b) => {
    const compareDatesResult = compareDates(a.availability, b.availability)
    if (compareDatesResult === 0) return compareTimes(a.timeFrom, b.timeFrom)
    return compareDatesResult
  })
}
