'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { JobsTable } from 'lib/components/jobs/JobsTable'
import {
  deserializeProposedJobs,
  ProposedJobComplete,
} from 'lib/types/proposed-job'
import { useMemo, useState } from 'react'
import { JobsFilters } from 'lib/components/jobs/JobsFilters'
import { useAPIProposedJobs } from 'lib/fetcher/proposed-job'
import { datesBetween, filterUniqueById } from 'lib/helpers/helpers'
import Link from 'next/link'
import { Serialized } from 'lib/types/serialize'

interface ProposedJobsClientPage {
  initialData: Serialized<ProposedJobComplete[]>
  startDate: string
  endDate: string
}

export default function ProposedJobsClientPage({
  initialData,
  startDate,
  endDate,
}: ProposedJobsClientPage) {
  const deserializedData = deserializeProposedJobs(initialData)
  const { data, error, mutate } = useAPIProposedJobs({
    fallbackData: deserializedData,
  })
  const reload = () => mutate()

  //#region Filtering areas
  const areas = getAvailableAreas(data)
  const [selectedArea, setSelectedArea] = useState(areas[0])

  const onAreaSelected = (id: string) => {
    setSelectedArea(areas.find(a => a.id === id) || areas[0])
  }
  //#endregion

  //#region Filtering days
  const firstDay = new Date(startDate)
  const lastDay = new Date(endDate)
  const days = getDays(firstDay, lastDay)
  const [selectedDay, setSelectedDay] = useState(days[0])

  const onDaySelected = (day: Date) => {
    setSelectedDay(days.find(d => d.day.getTime() === day.getTime()) || days[0])
  }
  //#endregion

  const [filter, setFilter] = useState('')

  const fulltextData = useMemo(() => getFulltextData(data), [data])

  function shouldShowJob(job: ProposedJobComplete) {
    const area =
      selectedArea.id === areas[0].id || job.area.id === selectedArea.id
    const fulltext =
      fulltextData.get(job.id)?.includes(filter.toLowerCase()) ?? false
    const day =
      selectedDay.id === days[0].id ||
      job.availability.map(d => d.getTime()).includes(selectedDay.day.getTime())
    return area && fulltext && day
  }

  if (error && !data) {
    return <ErrorPage error={error} />
  }

  return (
    <>
      <PageHeader title="Dostupné joby">
        <Link href="/jobs/new">
          <button className="btn btn-primary btn-with-icon" type="button">
            <i className="fas fa-briefcase"></i>
            <span>Nový job</span>
          </button>
        </Link>
      </PageHeader>

      <section>
        <div className="container-fluid">
          <div className="row gx-3">
            <div className="col">
              <JobsFilters
                search={filter}
                onSearchChanged={setFilter}
                areas={areas}
                selectedArea={selectedArea}
                onAreaSelected={onAreaSelected}
                days={days}
                selectedDay={selectedDay}
                onDaySelected={onDaySelected}
              />
            </div>
          </div>
          <div className="row gx-3">
            <div className="col-12">
              <JobsTable
                data={data || []}
                shouldShowJob={shouldShowJob}
                reload={reload}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function getAvailableAreas(jobs?: ProposedJobComplete[]) {
  const ALL_AREAS = { id: 'all', name: 'Vyberte oblast' }
  const areas = filterUniqueById(
    jobs?.map(job => ({ id: job.area.id, name: job.area.name })) || []
  )
  areas.sort((a, b) => a.name.localeCompare(b.name))
  areas.unshift(ALL_AREAS)
  return areas
}

function getDays(firstDay: Date, lastDay: Date) {
  const ALL_DAYS = { id: 'all', day: new Date() }
  const days = datesBetween(firstDay, lastDay).map(date => ({
    id: date.toJSON(),
    day: date,
  }))
  days.unshift(ALL_DAYS)
  return days
}

function getFulltextData(jobs?: ProposedJobComplete[]) {
  const map = new Map<string, string>()
  jobs?.forEach(job => {
    map.set(
      job.id,
      (
        job.name +
        job.area.name +
        job.address +
        job.contact +
        job.publicDescription +
        job.privateDescription
      ).toLocaleLowerCase()
    )
  })
  return map
}
