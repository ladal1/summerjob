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
import AdorationBox from '../adoration/AdorationBox'

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

  const hasAdoration = data?.hasAdoration ?? false

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

  const selectedSortQ = searchParams?.get('sort') ?? 'date-new-old'

  const getSelectedSortFromQuery = (): SortObject => {
    const result = test.find(t => t.id === selectedSortQ)
    return result !== undefined
      ? result
      : { id: 'date-new-old', label: 'Čas (nejnovější - nejstarší)' }
  }

  const [selectedSort, setSelectedSort] = useState(getSelectedSortFromQuery())

  //#endregion

  //#region Days

  const selectedDaysQ = searchParams?.get('days')

  const upcomingDays = () => {
    const todayDate = new Date(
      new Date().setHours(
        firstDay.getHours(),
        firstDay.getMinutes(),
        firstDay.getSeconds(),
        firstDay.getMilliseconds()
      )
    )
    const tomorrowDate = new Date(todayDate)
    tomorrowDate.setDate(todayDate.getDate() + 1)
    
    const todayDay = {
      id: todayDate.toJSON(),
      day: new Date(todayDate),
    }
    const tomorrowDay = {
      id: tomorrowDate.toJSON(),
      day: new Date(tomorrowDate),
    }
    
    // Return only today and tomorrow if they exist in the available days
    const todayAndTomorrow = days.filter(day => 
      day.id === todayDay.id || day.id === tomorrowDay.id
    )
    
    if (todayAndTomorrow.length > 0) {
      return todayAndTomorrow
    }
    
    // Fallback to all upcoming days if today/tomorrow are not available
    if (days.some(day => day.id === todayDay.id)) {
      return days.filter(day => day.day.getTime() >= todayDay.day.getTime())
    }
    return days
  }

  const getSelectedDaysFromQuery = () => {
    if (selectedDaysQ) {
      const daysQ = selectedDaysQ.split(';') ?? ['']
      const daysInDateQ = daysQ.map(
        dayQ =>
          new Date(new Date(dayQ + 'T00:00:00').setHours(firstDay.getHours()))
      )
      const result = days.filter(day =>
        daysInDateQ.some(dQ => dQ.toJSON() === day.id)
      )
      return result.length === 0 ? upcomingDays() : result
    }
    return upcomingDays()
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

  //#region ShowAll

  const showAllQ = searchParams?.get('show')
  const [showAll, setShowAll] = useState(
    showAllQ ? getBoolean(showAllQ) : false
  )

  //#endregion

  //#region ShowPast

  const showPastQ = searchParams?.get('showPast')
  const [showPast, setShowPast] = useState(
    showPastQ ? getBoolean(showPastQ) : false
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
    showAll: showAll,
    showPast: showPast,
  })

  useEffect(() => {
    // Synchronize all state variables with filter values
    setSelectedDays(
      filters.availability.map(date => {
        const day = new Date(date)
        return {
          id: typeof date === 'string' ? date : date.toJSON(),
          day: day,
        }
      })
    )
    setParticipate(filters.participate)
    setTimeFrom(filters.timeFrom)
    setTimeTo(filters.timeTo)
    setTags(filters.tags)
    setShowAll(filters.showAll)
    setShowPast(filters.showPast)
  }, [filters])

  //#endregion

  // replace url with new query parameters
  const router = useRouter()
  useEffect(() => {
    router.replace(
      `?${new URLSearchParams({
        search: search,
        days:
          selectedDays.map(d => d.day.toISOString().split('T')[0]).join(';') ??
          '',
        sort: selectedSort.id,
        participate: `${participate}`,
        timeFrom: timeFrom === null ? '' : timeFrom,
        timeTo: timeTo === null ? '' : timeTo,
        tags: tags?.join(';') ?? '',
        showAll: `${showAll}`,
        showPast: `${showPast}`,
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
    showAll,
    showPast,
  ])
  const posts = useMemo(() => data?.posts ?? [], [data?.posts])

  const [pinnedPosts, otherPosts] = useMemo(() => {
    const { pinned, other } = (posts ?? [])
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
  }, [posts])

  const fulltextData = useMemo(() => getFulltextData(otherPosts), [otherPosts])

  const filteredData = useMemo(() => {
    return filterPosts(
      normalizeString(search).trimEnd(),
      selectedDays,
      participate,
      showAll,
      timeFrom,
      timeTo,
      tags,
      fulltextData,
      userId,
      showPast,
      sortPosts(selectedSort, otherPosts)
    )
  }, [
    search,
    selectedDays,
    participate,
    showAll,
    timeFrom,
    timeTo,
    tags,
    fulltextData,
    selectedSort,
    userId,
    showPast,
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

  const dayFormatter = new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'short',
    timeZone: 'Europe/Prague',
  })

  const formatDateToDayShort = (date: Date) => {
    const dayShort = dayFormatter.format(date)
    return dayShort.charAt(0).toUpperCase() + dayShort.slice(1)
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
        <div 
          style={{
            columnCount: 'auto',
            columnWidth: '450px',
            columnGap: '1.5rem',
            columnFill: 'balance'
          }}
        >
          {pinnedPosts.map((item, index) => (
            <div 
              key={index}
              style={{
                breakInside: 'avoid',
                marginBottom: '1rem',
                display: 'inline-block',
                width: '100%'
              }}
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
                <div
                  className="d-inline-flex align-items-baseline cursor-pointer me-2"
                  onClick={() => setShowPast(!showPast)}
                  title={showPast ? 'Skrýt dokončené akce' : 'Zobrazit dokončené akce'}
                >
                  <i className="fas fa-history me-2"></i>
                  <div className="smj-white-bubble p-2 smj-shadow-small">
                    <span className="overflow-ellipsis">
                      {showPast ? 'Skrýt dokončené' : 'Zobrazit dokončené'}
                    </span>
                  </div>
                </div>
              </div>
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
          <div className="col-lg-4">
            <PostType title="Obecné">
              {hasAdoration && (
                <div className="pb-1">
                  <AdorationBox />
                </div>
              )}
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
          <div className="col-lg">
            <PostType title="Časové">
              {timePosts.map((item, index) => (
                <React.Fragment key={`time-${index}`}>
                  <div className="row align-items-center justify-content-between">
                    <div className="col-sm-1 me-2">
                      {item.timeFrom && item.timeTo && (
                        <div className="fw-bold text-center">
                          <div>
                            {formatDateToDayShort(getMostRelevantDate(item.availability))}
                          </div>
                          {/* Mobile: single line */}
                          <div className="d-block d-sm-none">
                            {formateTime(item.timeFrom)} - {formateTime(item.timeTo)}
                          </div>
                          {/* Desktop: multi-line */}
                          <div className="d-none d-sm-block">
                            <div>{formateTime(item.timeFrom)}</div>
                            {' - '}
                            <div>{formateTime(item.timeTo)}</div>
                          </div>
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
  showAll: boolean,
  timeFrom: string | null,
  timeTo: string | null,
  tags: PostTag[] | undefined,
  searchable: Map<string, string>,
  userId: string,
  showPast: boolean,
  posts?: PostComplete[]
) {
  if (!posts) return []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return posts
    .filter(post => {
      // Filter out events that have already passed (unless showPast is true)
      if (!showPast && post.availability && post.availability.length > 0) {
        const now = new Date()
        const hasUpcomingDates = post.availability.some(date => {
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
        if (!hasUpcomingDates) {
          return false
        }
      }
      return true
    })
    .filter(post => {
      if (text.length > 0) {
        return searchable.get(post.id)?.includes(text.toLowerCase()) ?? true
      }
      return true
    })
    .filter(post => {
      if (showAll) {
        return true
      }
      if (selectedDays.length === 0) {
        return post.availability === undefined || post.availability.length === 0
      } else {
        return selectedDays.some(selected => {
          return (
            (post.availability &&
              post.availability.some(availDay => {
                return selected.day.getTime() === availDay.getTime()
              })) ||
            post.availability.length === 0
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
        return chainCompare(
          compareDates(a.availability, b.availability),
          compareTimes(a.timeFrom, b.timeFrom)
        )
      case 'date-old-new':
        return chainCompare(
          compareDates(b.availability, a.availability),
          compareTimes(b.timeFrom, a.timeFrom)
        )
      case 'time-new-old':
        return compareTimes(a.timeFrom, b.timeFrom)
      case 'time-old-new':
        return compareTimes(b.timeFrom, a.timeFrom)
      default:
        return 0
    }
  })
}

function chainCompare(...comparators: number[]) {
  for (const comparator of comparators) {
    if (comparator !== 0) {
      return comparator
    }
  }
  return 0
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

function getMostRelevantDate(availability: Date[]): Date {
  if (!availability || availability.length === 0) {
    return new Date()
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  // If today is available, show today
  const todayAvailable = availability.find(date => {
    const availDate = new Date(date)
    availDate.setHours(0, 0, 0, 0)
    return availDate.getTime() === today.getTime()
  })
  if (todayAvailable) {
    return todayAvailable
  }

  // If tomorrow is available, show tomorrow  
  const tomorrowAvailable = availability.find(date => {
    const availDate = new Date(date)
    availDate.setHours(0, 0, 0, 0)
    return availDate.getTime() === tomorrow.getTime()
  })
  if (tomorrowAvailable) {
    return tomorrowAvailable
  }

  // Find the next available date in the future
  const futureDate = availability
    .map(date => new Date(date))
    .filter(date => {
      date.setHours(0, 0, 0, 0)
      return date.getTime() >= today.getTime()
    })
    .sort((a, b) => a.getTime() - b.getTime())[0]

  if (futureDate) {
    return futureDate
  }

  // Fall back to the first date (original behavior)
  return availability[0]
}
