'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIPosts } from 'lib/fetcher/post'
import { datesBetween, normalizeString } from 'lib/helpers/helpers'
import { deserializePosts, PostComplete } from 'lib/types/post'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { Filters } from '../filters/Filters'
import { PostBubble } from './PostBubble'
import PostType from './PostType'
import { Sort, SortObject, SortPostsBy } from './SortPostsBy'

const sorts: Sort[] = [
  {
    id: 'default',
    icon: 'fas fa-arrows-up-down',
    label: '',
    content: [{ id: 'default', label: 'Defaultní' }],
  },
  {
    id: 'sort-name',
    icon: 'fas fa-t',
    label: 'Název',
    content: [
      { id: 'name-a-z', label: 'A - Z' },
      { id: 'name-z-a', label: 'Z - A' },
    ],
  },
  {
    id: 'sort-address',
    icon: 'fas fa-map',
    label: 'Adresa',
    content: [
      { id: 'address-a-z', label: 'A - Z' },
      { id: 'address-z-a', label: 'Z - A' },
    ],
  },
  {
    id: 'sort-date',
    icon: 'fas fa-calendar',
    label: 'Datum',
    content: [
      { id: 'date-new-old', label: 'nejnovější - nejstarší' },
      { id: 'date-old-new', label: 'nejstarší - nejnovější' },
    ],
  },
  {
    id: 'sort-time',
    icon: 'fas fa-clock',
    label: 'Čas',
    content: [
      { id: 'time-new-old', label: 'nejnovější - nejstarší' },
      { id: 'time-old-new', label: 'nejstarší - nejnovější' },
    ],
  },
]

interface PostsClientPageProps {
  sPosts: Serialized
  startDate: string
  endDate: string
  advancedAccess: boolean
}

export default function PostsClientPage({
  sPosts,
  startDate,
  endDate,
  advancedAccess,
}: PostsClientPageProps) {
  const inititalPosts = deserializePosts(sPosts)
  const { data, error, mutate } = useAPIPosts({
    fallbackData: inititalPosts,
  })

  const firstDay = new Date(startDate)
  const lastDay = new Date(endDate)
  const days = datesBetween(firstDay, lastDay)

  // get query parameters
  const searchParams = useSearchParams()
  const searchQ = searchParams?.get('search')
  const selectedDayQ = searchParams?.get('day' ?? '')
  const selectedSortQ = searchParams?.get('sort')

  const [search, setSearch] = useState(searchQ ?? '')
  const [selectedDay, setSelectedDay] = useState(
    days.find(
      day => typeof selectedDayQ === 'string' && day === new Date(selectedDayQ)
    ) || days[0]
  )

  const [selectedSort, setSelectedSort] = useState(
    safelyParseSortJSON(
      selectedSortQ ?? "{ id: 'default', label: 'Defaultní' }"
    ) ?? { id: 'default', label: 'Defaultní' }
  )

  const onDaySelected = (day: Date) => {
    setSelectedDay(days.find(d => d.getTime() === day.getTime()) || days[0])
  }

  // replace url with new query parameters
  const router = useRouter()
  useEffect(() => {
    router.replace(
      `?${new URLSearchParams({
        search: search,
        //day: selectedDay.toJSON(),
        sort: JSON.stringify(selectedSort),
      })}`,
      {
        scroll: false,
      }
    )
  }, [search, selectedSort, selectedDay, router])

  const [pinnedPosts, otherPosts] = useMemo(() => {
    const { pinned, other } = data!.reduce(
      (acc, post) => {
        if (post.isPinned) {
          acc.pinned.push(post)
        } else {
          acc.other.push(post)
        }
        return acc
      },
      { pinned: [], other: [] } as {
        pinned: Array<PostComplete>
        other: Array<PostComplete>
      }
    )

    return [pinned, other]
  }, [data])

  const fulltextData = useMemo(() => getFulltextData(otherPosts), [otherPosts])

  const filteredData = useMemo(() => {
    const sortedOtherPosts =
      selectedSort.id === 'default'
        ? otherPosts
        : sortPosts(selectedSort, otherPosts)
    return filterPosts(
      normalizeString(search).trimEnd(),
      selectedDay,
      fulltextData,
      sortedOtherPosts
    )
  }, [fulltextData, search, selectedSort, selectedDay, otherPosts])

  const [regularPosts, timePosts] = useMemo(() => {
    const { regular, time } = filteredData!.reduce(
      (acc, post) => {
        if (post.timeFrom && post.timeTo) {
          acc.time.push(post)
        } else {
          acc.regular.push(post)
        }
        return acc
      },
      { regular: [], time: [] } as {
        regular: Array<PostComplete>
        time: Array<PostComplete>
      }
    )

    return [regular, time]
  }, [filteredData])

  if (error && !data) {
    return <ErrorPage error={error} />
  }

  return (
    <>
      <PageHeader title="Nástěnka">
        {advancedAccess && (
          <Link href={`/posts/new`}>
            <button className="btn btn-primary btn-with-icon" type="button">
              <i className="fas fa-message"></i>
              <span>Přidat příspěvek</span>
            </button>
          </Link>
        )}
      </PageHeader>
      <div className="m-3">
        {pinnedPosts.map((item, index) => (
          <React.Fragment key={index}>
            <PostBubble
              item={item}
              advancedAccess={advancedAccess}
              onUpdated={mutate}
            />
          </React.Fragment>
        ))}
        <div className="mt-3">
          <div className="d-flex flex-wrap justify-content-between allign-items-baseline gap-3">
            <Filters search={search} onSearchChanged={setSearch} />
            <div className="row">
              <div className="col-auto">
                <SortPostsBy
                  sorts={sorts}
                  selected={selectedSort}
                  onSelected={setSelectedSort}
                />
              </div>
              <div className="col-auto">
                <div className="ms-2">{'bbbbb'}</div>
              </div>
            </div>
          </div>
        </div>
        <PostType title="Obecné">
          {regularPosts.map((item, index) => (
            <PostBubble
              key={index}
              item={item}
              advancedAccess={advancedAccess}
              onUpdated={mutate}
            />
          ))}
        </PostType>
        <PostType title="Časové">
          {timePosts.map((item, index) => (
            <React.Fragment key={`time-${index}`}>
              <div className="row align-items-center justify-content-between">
                <div className="col-sm-1 me-2">
                  {item.timeFrom && item.timeTo && (
                    <div className="fw-bold text-center">
                      <div>{formateTime(item.timeFrom)}</div>
                      {' - '}
                      <div>{formateTime(item.timeTo)}</div>
                    </div>
                  )}
                </div>
                <div className="col">
                  <PostBubble
                    key={index}
                    item={item}
                    advancedAccess={advancedAccess}
                    onUpdated={mutate}
                    showTime={false}
                  />
                </div>
              </div>
            </React.Fragment>
          ))}
        </PostType>
      </div>
    </>
  )
}

function formateTime(time: string) {
  const [hours, minutes] = time.split(':').map(part => parseInt(part))

  const formattedHours = hours < 10 ? '0' + hours : hours.toString()
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes.toString()

  return `${formattedHours}:${formattedMinutes}`
}

function getFulltextData(posts?: PostComplete[]) {
  const map = new Map<string, string>()
  posts?.forEach(post => {
    map.set(
      post.id,
      normalizeString(
        post.name + post.shortDescription + post.longDescription + post.address
      )
    )
  })
  return map
}

function filterPosts(
  text: string,
  selectedDay: Date,
  searchable: Map<string, string>,
  posts?: PostComplete[]
) {
  if (!posts) return []
  return posts.filter(post => {
    if (text.length > 0) {
      return searchable.get(post.id)?.includes(text.toLowerCase()) ?? true
    }
    return true
  })
}

function sortPosts(selectedSort: SortObject, posts: PostComplete[]) {
  return [...posts].sort((a, b) => {
    switch (selectedSort.id) {
      case 'name-a-z':
        return a.name.localeCompare(b.name)
      case 'name-z-a':
        return b.name.localeCompare(a.name)
      case 'address-a-z':
        return compareAddresses(a.address, b.address)
      case 'address-z-a':
        return compareAddresses(b.address, a.address)
      case 'date-new-old':
        return compareDates(a.availability, b.availability)
      case 'date-old-new':
        return compareDates(b.availability, a.availability)
      case 'time-new-old':
        return compareTimes(a.timeFrom, b.timeFrom)
      case 'time-old-new':
        return compareTimes(b.timeFrom, a.timeFrom)
      default:
        return 0
    }
  })
}

function compareAddresses(addressA: string | null, addressB: string | null) {
  if (!addressA && !addressB) return 0
  if (!addressA) return 1
  if (!addressB) return -1
  return addressA.localeCompare(addressB)
}

function compareDates(dateA: Date[], dateB: Date[]) {
  if (!dateA && !dateB) return 0
  if (!dateA) return 1
  if (!dateB) return -1

  const firstDateA = dateA[0]
  const firstDateB = dateB[0]

  if (!firstDateA && !firstDateB) return 0
  if (!firstDateA) return 1
  if (!firstDateB) return -1
  if (!(firstDateA instanceof Date) || !(firstDateB instanceof Date)) {
    return 0 // Pokud první datum není instancí Date, vrátí 0
  }
  console.log(dateA)
  console.log(firstDateA)
  const string = firstDateA.toLocaleDateString()
  console.log(string)

  return 1
}

function compareTimes(timeA: string | null, timeB: string | null) {
  if (!timeA && !timeB) return 0
  if (!timeA) return 1
  if (!timeB) return -1
  return formateTime(timeA).localeCompare(formateTime(timeB))
}

function safelyParseSortJSON(json: string): SortObject {
  let parsed

  try {
    parsed = JSON.parse(json)
    if (!parsed.id || !parsed.label) {
      throw new Error('Invalid sort object format')
    }
  } catch (e) {
    return { id: 'default', label: 'Defaultní' }
  }

  return parsed
}

function getDays(firstDay: Date, lastDay: Date) {
  const days = datesBetween(firstDay, lastDay).map(date => ({
    id: date.toJSON(),
    day: date,
  }))
  const ALL_DAYS = { id: 'all', day: new Date() }
  days.unshift(ALL_DAYS)
  const NO_DAYS = { id: 'none', day: new Date() }
  days.unshift(NO_DAYS)
  return days
}
