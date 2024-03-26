'use client'
import { useAPIMyEvents, useAPIMyPlans } from 'lib/fetcher/my-plan'
import { deserializeMyPlans } from 'lib/types/my-plan'
import { deserializePosts } from 'lib/types/post'
import { Serialized } from 'lib/types/serialize'
import MyPlanBrowser from './MyPlanBrowser'
import MyPlanEmpty from './MyPlanEmpty'

interface MyPlanProps {
  sPlan: Serialized
  sEvents: Serialized
  userId: string
}

export default function MyPlanClientPage({
  sPlan,
  sEvents,
  userId,
}: MyPlanProps) {
  const plans = deserializeMyPlans(sPlan)
  const events = deserializePosts(sEvents)
  const { data, error, isLoading } = useAPIMyPlans({
    fallbackData: plans,
  })

  const { data: dataEvents } = useAPIMyEvents({
    fallbackData: events,
  })

  return (
    <>
      {(!data || data.length === 0) &&
        (!dataEvents || dataEvents?.length === 0) && <MyPlanEmpty />}
      <MyPlanBrowser plans={data!} events={dataEvents!} userId={userId} />
    </>
  )
}
