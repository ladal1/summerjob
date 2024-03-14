'use client'
import { useAPIMyPlans } from 'lib/fetcher/my-plan'
import { deserializeMyPlans } from 'lib/types/my-plan'
import { Serialized } from 'lib/types/serialize'
import MyPlanBrowser from './MyPlanBrowser'
import MyPlanEmpty from './MyPlanEmpty'

interface MyPlanProps {
  sPlan: Serialized
}

export default function MyPlanClientPage({ sPlan }: MyPlanProps) {
  const plans = deserializeMyPlans(sPlan)
  const { data, error, isLoading } = useAPIMyPlans({
    fallbackData: plans,
  })

  return (
    <>
      {data && data.length > 0 && <MyPlanBrowser plans={data} />}
      {(!data || data.length === 0) && <MyPlanEmpty />}
    </>
  )
}
