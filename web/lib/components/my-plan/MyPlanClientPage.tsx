'use client'
import { useAPIMyEvents, useAPIMyPlans } from 'lib/fetcher/my-plan'
import { compareDates, compareTimes, formatDateLong } from 'lib/helpers/helpers'
import { deserializeMyPlans } from 'lib/types/my-plan'
import {
  deserializePosts,
  deserializePostsDates,
  PostComplete,
} from 'lib/types/post'
import { Serialized } from 'lib/types/serialize'
import { useMemo, useState } from 'react'
import SimpleDatePicker from '../date-picker/date-picker'
import PageHeader from '../page-header/PageHeader'
import { HeaderNoContent } from './HeaderNoContent'
import { MyEvents } from './MyEvents'
import MyJob from './MyJob'
interface MyPlanProps {
  sPlan: Serialized
  sEvents: Serialized
  userId: string
  startDate: string
  endDate: string
}

export default function MyPlanClientPage({
  sPlan,
  sEvents,
  userId,
  startDate,
  endDate,
}: MyPlanProps) {
  const recievedPlans = deserializeMyPlans(sPlan)
  const recievedEvents = deserializePosts(sEvents)
  const { data: plans } = useAPIMyPlans({
    fallbackData: recievedPlans,
  })

  const { data: events } = useAPIMyEvents({
    fallbackData: recievedEvents,
  })

  const firstDay = new Date(startDate)
  const lastDay = new Date(endDate)

  const [currentDate] = useState<Date>(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  })

  const determineDate = (date: Date) => {
    return firstDay.getTime() > date.getTime()
      ? firstDay
      : lastDay.getTime() < date.getTime()
      ? lastDay
      : date
  }

  // Get current day, if it is outside of smj event, pick first or last date od smj event
  const [date, setDate] = useState(determineDate(currentDate))

  const sortedPlans = useMemo(() => {
    return new Array(...(plans ?? [])).sort(
      (a, b) => a.day.getTime() - b.day.getTime()
    )
  }, [plans])

  const onDateChanged = (newDate: Date) => {
    setDate(newDate)
  }
  const selectedPlan = useMemo(() => {
    return sortedPlans.find(plan => {
      const planDate = new Date(plan.day)
      planDate.setHours(0, 0, 0, 0)
      return planDate.getTime() === date.getTime()
    })
  }, [date, sortedPlans])

  const eventsWithNewDatesAndSorted = useMemo(() => {
    return sortEvents((events ?? []).map(item => deserializePostsDates(item)))
  }, [events])

  const filteredEvents = useMemo(() => {
    return filterEvents(date, eventsWithNewDatesAndSorted)
  }, [date, eventsWithNewDatesAndSorted])

  return (
    <>
      <PageHeader title={formatDateLong(date)} isFluid={false}>
        <div className="bg-white">
          <SimpleDatePicker initialDate={date} onDateChanged={onDateChanged} />
        </div>
      </PageHeader>

      <div className="container pb-4">
        {selectedPlan === undefined ? (
          <HeaderNoContent label="Tento den nemáte naplánovanou práci." />
        ) : (
          <MyJob selectedPlan={selectedPlan} />
        )}
        {filteredEvents.length === 0 ? (
          <HeaderNoContent label="Tento den se neučástníte žádné události z nástěnky." />
        ) : (
          <MyEvents events={filteredEvents} userId={userId} date={date} />
        )}
      </div>
    </>
  )
}

function filterEvents(selectedDay: Date, posts: PostComplete[]) {
  if (!posts) return []
  const filterdPosts = posts.filter(post => {
    return (
      (post.availability &&
        post.availability.some(availDay => {
          return selectedDay && availDay.getTime() === selectedDay.getTime()
        })) ||
      post.availability === undefined ||
      post.availability.length === 0
    )
  })
  return filterdPosts
}
function sortEvents(posts: PostComplete[]) {
  return [...posts].sort((a, b) => {
    const compareDatesResult = compareDates(a.availability, b.availability)
    if (compareDatesResult === 0) return compareTimes(a.timeFrom, b.timeFrom)
    return compareDatesResult
  })
}
