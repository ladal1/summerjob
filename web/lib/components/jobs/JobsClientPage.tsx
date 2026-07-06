'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { JobsTable } from 'lib/components/jobs/JobsTable'
import {
  deserializeProposedJobs,
  ProposedJobComplete,
} from 'lib/types/proposed-job'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAPIProposedJobs } from 'lib/fetcher/proposed-job'
import {
  datesBetween,
  filterUniqueById,
  normalizeString,
} from 'lib/helpers/helpers'
import Link from 'next/link'
import { Serialized } from 'lib/types/serialize'
import { Filters } from '../filters/Filters'
import { useRouter, useSearchParams } from 'next/navigation'
import { JobsStatistics } from './JobsStatistics'

interface ProposedJobsClientPage {
  initialData: Serialized
  startDate: string
  endDate: string
  workerId: string
}

export default function ProposedJobsClientPage({
  initialData,
  startDate,
  endDate,
  workerId,
}: ProposedJobsClientPage) {
  const deserializedData = deserializeProposedJobs(initialData)
  const { data, error, mutate } = useAPIProposedJobs({
    fallbackData: deserializedData,
  })
  const reload = () => mutate()

  // get query parameters
  const searchParams = useSearchParams()
  const areaIdsQ = searchParams?.get('area')
  const dayIdsQ = searchParams?.get('day')
  const searchQ = searchParams?.get('search')
  const selectedAreaIds = areaIdsQ ? areaIdsQ.split(',') : []
  const selectedDayIds = dayIdsQ ? dayIdsQ.split(',') : []

  //#region Filtering areas
  const areas = getAvailableAreas(data)
  const [selectedAreas, setSelectedAreas] = useState(
    areas.filter(a => selectedAreaIds.includes(a.id) && a.id !== 'all')
  )

  const onAreasSelected = (ids: string[]) => {
    setSelectedAreas(areas.filter(a => ids.includes(a.id) && a.id !== 'all'))
  }
  //#endregion

  //#region Filtering days
  const firstDay = new Date(startDate)
  const lastDay = new Date(endDate)
  const days = getDays(firstDay, lastDay)
  const [selectedDays, setSelectedDays] = useState(
    days.filter(d => selectedDayIds.includes(d.id) && d.id !== 'all')
  )

  const onDaysSelected = (dayValues: Date[]) => {
    setSelectedDays(
      days.filter(
        d =>
          d.id !== 'all' && dayValues.some(v => v.getTime() === d.day.getTime())
      )
    )
  }
  //#endregion

  const [filter, setFilter] = useState(searchQ ?? '')

  // replace url with new query parameters
  const router = useRouter()
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedAreas.length > 0) {
      params.set('area', selectedAreas.map(a => a.id).join(','))
    }
    if (selectedDays.length > 0) {
      params.set('day', selectedDays.map(d => d.id).join(','))
    }
    if (filter) {
      params.set('search', filter)
    }
    router.replace(`?${params}`, {
      scroll: false,
    })
  }, [selectedAreas, selectedDays, filter, router])

  const fulltextData = useMemo(() => getFulltextData(data), [data])

  const shouldShowJob = useCallback(
    (job: ProposedJobComplete) => {
      const area =
        selectedAreas.length === 0 ||
        selectedAreas.some(a => a.id === job.area?.id)
      const fulltext =
        fulltextData.get(job.id)?.includes(normalizeString(filter).trimEnd()) ??
        false
      const day =
        selectedDays.length === 0 ||
        selectedDays.some(d =>
          job.availability.map(x => x.getTime()).includes(d.day.getTime())
        )
      return area && fulltext && day
    },
    [filter, fulltextData, selectedAreas, selectedDays]
  )

  const filteredJobs = useMemo(() => {
    if (!data) return []
    return data.filter(job => {
      return shouldShowJob(job)
    })
  }, [data, shouldShowJob])

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
              <Filters
                search={filter}
                onSearchChanged={setFilter}
                multiSelects={[
                  {
                    id: 'area',
                    options: areas.slice(1),
                    selected: selectedAreas,
                    onSelectChanged: onAreasSelected,
                    placeholder: 'Oblast',
                  },
                ]}
                multiSelectsDays={[
                  {
                    id: 'day',
                    options: days.slice(1),
                    selected: selectedDays,
                    onSelectChanged: onDaysSelected,
                    placeholder: 'Dny',
                  },
                ]}
              />
            </div>
          </div>
          <div className="row gx-3">
            <div className="col-lg-10 pb-2">
              <JobsTable
                data={data || []}
                shouldShowJob={shouldShowJob}
                reload={reload}
                workerId={workerId}
              />
            </div>
            <div className="col-sm-12 col-lg-2">
              <JobsStatistics data={filteredJobs} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function getAvailableAreas(jobs?: ProposedJobComplete[]) {
  const ALL_AREAS = { id: 'all', name: 'Vyberte oblast' }
  const UNKNOWN_AREA = { id: 'unknown', name: 'Neznámá oblast' }
  const areas = filterUniqueById(
    jobs?.map(job =>
      job.area ? { id: job.area.id, name: job.area.name } : UNKNOWN_AREA
    ) || []
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
      normalizeString(
        job.name +
          job.area?.name +
          job.address +
          job.contact +
          job.publicDescription +
          job.privateDescription
      )
    )
  })
  return map
}
