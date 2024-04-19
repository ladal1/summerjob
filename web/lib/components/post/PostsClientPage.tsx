'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIPosts } from 'lib/fetcher/post'
import {
  compareDates,
  compareTimes,
  datesBetween,
  formateTime,
  getHourAndMinute,
  normalizeString,
  validateTimeInput,
} from 'lib/helpers/helpers'
import {
  deserializePosts,
  deserializePostsDates,
  PostComplete,
  PostFilterDataInput,
} from 'lib/types/post'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { Filters } from '../filters/Filters'
import { PostBubble } from './PostBubble'
import PostType from './PostType'
import { Sort, SortObject, SortPostsBy } from './SortPostsBy'
import { DateBool } from 'lib/data/dateSelectionType'
import { FilterPostsBy } from './FilterPostsBy'
import { PostTag } from 'lib/prisma/client'

const sorts: Sort[] = [
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

const test = [
  { id: 'name-a-z', label: 'Název (A - Z)' },
  { id: 'name-z-a', label: 'Název (Z - A)' },
  { id: 'address-a-z', label: 'Adresa (A - Z)' },
  { id: 'address-z-a', label: 'Adresa (Z - A)' },
  { id: 'date-new-old', label: 'Datum (nejnovější - nejstarší)' },
  { id: 'date-old-new', label: 'Datum (nejstarší - nejnovější)' },
  { id: 'time-new-old', label: 'Čas (nejnovější - nejstarší)' },
  { id: 'time-old-new', label: 'Čas (nejstarší - nejnovější)' },
]

interface PostsClientPageProps {
  sPosts: Serialized
  startDate: string
  endDate: string
  allDates: DateBool[][]
  advancedAccess: boolean
  userId: string
}

export default function PostsClientPage({
  sPosts,
  startDate,
  endDate,
  allDates,
  advancedAccess,
  userId,
}: PostsClientPageProps) {
  const inititalPosts = deserializePosts(sPosts)
  const { data, error, mutate } = useAPIPosts({
    fallbackData: inititalPosts,
  })

  const firstDay = new Date(startDate)
  const lastDay = new Date(endDate)
  const days = getDays(firstDay, lastDay)

  // get query parameters
  const searchParams = useSearchParams()

  //#region Search

  const searchQ = searchParams?.get('search')
  const [search, setSearch] = useState(searchQ ?? '')

  //#endregion

  //#region Sort

  const selectedSortQ = searchParams?.get('sort') ?? 'time-new-old'

  const getSelectedSortFromQuery = (): SortObject => {
    const result = test.find(t => t.id === selectedSortQ)
    return result !== undefined
      ? result
      : { id: 'time-new-old', label: 'Čas (nejnovější - nejstarší)' }
  }

  const [selectedSort, setSelectedSort] = useState(getSelectedSortFromQuery())

  //#endregion

  //#region Days

  const selectedDaysQ = searchParams?.get('days')

  const today = () => {
    const todayDate = new Date()
    const todayDay = {
      id: todayDate.toJSON(),
      day: new Date(todayDate.setHours(firstDay.getHours())),
    }
    if (days.includes(todayDay)) {
      return [todayDay]
    }
    return days
  }

  const getSelectedDaysFromQuery = () => {
    if (selectedDaysQ) {
      const daysQ = selectedDaysQ.split(';') ?? ['']
      const daysInDateQ = daysQ.map(
        dayQ => new Date(new Date(dayQ).setHours(firstDay.getHours()))
      )
      const result = days.filter(day =>
        daysInDateQ.some(dQ => dQ.toJSON() === day.id)
      )
      return result.length === 0 ? today() : result
    }
    return today()
  }

  const [selectedDays, setSelectedDays] = useState(getSelectedDaysFromQuery())

  //#endregion

  //#region Participate

  const participateQ = searchParams?.get('participate')
  const getBoolean = (value: string) => {
    switch (value) {
      case 'true':
      case '1':
      case 'ano':
      case 'yes':
        return true
      default:
        return false
    }
  }

  const [participate, setParticipate] = useState(
    participateQ ? getBoolean(participateQ) : false
  )

  //#endregion

  //#region Time

  const timeFromQ = searchParams?.get('timeFrom')
  const timeToQ = searchParams?.get('timeTo')

  const getTimeFromQuery = (time: string | null | undefined) => {
    if (time === null || time === undefined || !validateTimeInput(time)) {
      return null
    }
    return formateTime(time)
  }
  const [timeFrom, setTimeFrom] = useState<string | null>(
    getTimeFromQuery(timeFromQ)
  )
  const [timeTo, setTimeTo] = useState<string | null>(getTimeFromQuery(timeToQ))

  //#endregion

  //#region Tags

  const tagsQ = searchParams?.get('tags')

  const isValidPostTag = (tag: string) => {
    const postTags = Object.values(PostTag)
    return postTags.includes(tag as PostTag)
  }

  const [tags, setTags] = useState<PostTag[] | undefined>(
    (tagsQ?.split(';').filter(tag => isValidPostTag(tag)) as PostTag[]) ?? []
  )

  //#endregion

  //#region Filters

  const [filters, setFilters] = useState<PostFilterDataInput>({
    availability: selectedDays.map(day => day.day),
    timeFrom: timeFrom,
    timeTo: timeTo,
    tags: tags,
    participate: participate,
  })

  useMemo(() => {
    setSelectedDays(
      filters.availability.map(date => {
        const day = new Date(date)
        return {
          id: typeof date === 'string' ? date : date.toJSON(),
          day: day,
        }
      })
    )
  }, [filters.availability])

  useMemo(() => {
    setParticipate(filters.participate)
  }, [filters.participate])

  useMemo(() => {
    setTimeFrom(filters.timeFrom)
  }, [filters.timeFrom])

  useMemo(() => {
    setTimeTo(filters.timeTo)
  }, [filters.timeTo])

  useMemo(() => {
    setTags(filters.tags)
  }, [filters.tags])

  //#endregion

  // replace url with new query parameters
  const router = useRouter()
  useEffect(() => {
    router.replace(
      `?${new URLSearchParams({
        search: search,
        days: selectedDays.map(d => d.id).join(';') ?? '',
        sort: selectedSort.id,
        participate: `${participate}`,
        timeFrom: timeFrom === null ? '' : timeFrom,
        timeTo: timeTo === null ? '' : timeTo,
        tags: tags?.join(';') ?? '',
      })}`,
      {
        scroll: false,
      }
    )
  }, [
    search,
    selectedSort,
    selectedDays,
    router,
    participate,
    timeFrom,
    timeTo,
    tags,
  ])

  const [pinnedPosts, otherPosts] = useMemo(() => {
    const { pinned, other } = (data ?? [])
      .map(item => deserializePostsDates(item))
      .reduce(
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
    return filterPosts(
      normalizeString(search).trimEnd(),
      selectedDays,
      participate,
      timeFrom,
      timeTo,
      tags,
      fulltextData,
      userId,
      sortPosts(selectedSort, otherPosts)
    )
  }, [
    search,
    selectedDays,
    participate,
    timeFrom,
    timeTo,
    tags,
    fulltextData,
    selectedSort,
    userId,
    otherPosts,
  ])

  const [regularPosts, timePosts] = useMemo(() => {
    const { regular, time } = filteredData.reduce(
      (acc, post) => {
        if (post.timeFrom) {
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
        <div className="row">
          {pinnedPosts.map((item, index) => (
            <div
              className={`col-md-${12 / Math.min(3, pinnedPosts.length)}`}
              key={index}
            >
              <PostBubble
                item={item}
                advancedAccess={advancedAccess}
                onUpdated={mutate}
                userId={userId}
              />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="d-flex flex-wrap justify-content-between allign-items-baseline ">
            <div className="me-2">
              <Filters search={search} onSearchChanged={setSearch} />
            </div>
            <div className="row">
              <div className="col-auto mb-2">
                <SortPostsBy
                  sorts={sorts}
                  selected={selectedSort}
                  onSelected={setSelectedSort}
                />
              </div>
              <div className="col-auto">
                <FilterPostsBy
                  filters={filters}
                  setFilters={setFilters}
                  allDates={allDates}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            <PostType title="Obecné">
              {regularPosts.map((item, index) => (
                <div key={index} className="pb-1">
                  <PostBubble
                    item={item}
                    advancedAccess={advancedAccess}
                    onUpdated={mutate}
                    userId={userId}
                  />
                </div>
              ))}
            </PostType>
          </div>
          <div className="col">
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
                        userId={userId}
                      />
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </PostType>
          </div>
        </div>
      </div>
    </>
  )
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
  selectedDays: Day[],
  participate: boolean,
  timeFrom: string | null,
  timeTo: string | null,
  tags: PostTag[] | undefined,
  searchable: Map<string, string>,
  userId: string,
  posts?: PostComplete[]
) {
  if (!posts) return []
  return posts
    .filter(post => {
      if (text.length > 0) {
        return searchable.get(post.id)?.includes(text.toLowerCase()) ?? true
      }
      return true
    })
    .filter(post => {
      if (selectedDays.length === 0) {
        return post.availability === undefined || post.availability.length === 0
      } else {
        return selectedDays.some(selected => {
          return (
            post.availability &&
            post.availability.some(availDay => {
              return selected.day.getTime() === availDay.getTime()
            })
          )
        })
      }
    })
    .filter(post => {
      if (participate) {
        return (
          post.isMandatory ||
          (post.isOpenForParticipants &&
            post.participants.some(participant => {
              return participant.workerId === userId
            }))
        )
      }
      return true
    })
    .filter(post => {
      if (timeFrom !== null && post.timeFrom !== null) {
        const [postHour, postMinute] = getHourAndMinute(post.timeFrom)
        const [filterHour, filterMinute] = getHourAndMinute(timeFrom)
        return (
          postHour > filterHour ||
          (postHour === filterHour && postMinute >= filterMinute)
        )
      }
      return true
    })
    .filter(post => {
      if (timeTo !== null && post.timeTo !== null) {
        const [postHour, postMinute] = getHourAndMinute(post.timeTo)
        const [filterHour, filterMinute] = getHourAndMinute(timeTo)
        return (
          postHour < filterHour ||
          (postHour === filterHour && postMinute <= filterMinute)
        )
      }
      return true
    })
    .filter(post => {
      if (tags === undefined || tags.length === 0) {
        return true
      }
      return tags.some(tag => {
        return (
          post.tags &&
          post.tags.some(postTag => {
            return postTag === tag
          })
        )
      })
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

export interface Day {
  id: string
  day: Date
}

function getDays(firstDay: Date, lastDay: Date) {
  const days: Day[] = datesBetween(firstDay, lastDay).map(date => ({
    id: date.toJSON(),
    day: date,
  }))
  return days
}
