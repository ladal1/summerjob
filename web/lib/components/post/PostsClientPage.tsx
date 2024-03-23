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
import SimpleDatePicker from '../date-picker/date-picker'

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

  // get query parameters
  const searchParams = useSearchParams()
  const searchQ = searchParams?.get('search')
  const [search, setSearch] = useState(searchQ ?? '')
  const selectedDayQ = searchParams?.get('day' ?? '')

  const firstDay = new Date(startDate)
  const lastDay = new Date(endDate)
  const days = datesBetween(firstDay, lastDay)
  const [selectedDay, setSelectedDay] = useState(
    days.find(
      day => typeof selectedDayQ === 'string' && day === new Date(selectedDayQ)
    ) || days[0]
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
        day: selectedDay.toJSON(),
      })}`
    )
  }, [search, selectedDay, router])

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

  const filteredData = useMemo(
    () =>
      filterPosts(
        normalizeString(search).trimEnd(),
        selectedDay,
        fulltextData,
        otherPosts
      ),
    [fulltextData, search, selectedDay, otherPosts]
  )

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
          <div className="d-flex flex-wrap justify-content-between allign-items-center">
            <Filters search={search} onSearchChanged={setSearch} />
            <div className="bg-white">
              <SimpleDatePicker
                initialDate={selectedDay}
                onDateChanged={onDaySelected}
              />
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
                <div className="col-auto">
                  {item.timeFrom && item.timeTo && (
                    <div className="fw-bold text-center">
                      <div
                        className="text-truncate"
                        onClick={() => console.log(item.timeFrom)}
                      >
                        {formateTime(item.timeFrom)}
                      </div>
                      {' - '}
                      <div className="text-truncate">
                        {formateTime(item.timeTo)}
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
    const day = post.availability
      .map(d => d.getDate)
      .includes(selectedDay.getDate)
    return day
  })
}
