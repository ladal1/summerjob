'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIPosts } from 'lib/fetcher/post'
import { deserializePosts } from 'lib/types/post'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import React, { useState } from 'react'
import { PostBubble } from './PostBubble'

interface PostsClientPageProps {
  sPosts: Serialized
  advancedAccess: boolean
}

export default function PostsClientPage({
  sPosts,
  advancedAccess,
}: PostsClientPageProps) {
  const inititalPosts = deserializePosts(sPosts)
  const { data, error, mutate } = useAPIPosts({
    fallbackData: inititalPosts,
  })

  const [postPhotoURL, setPostPhotoURL] = useState<string | null>(null)

  if (error && !data) {
    return <ErrorPage error={error} />
  }

  return (
    <div className="ps-5 pe-5">
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
      {data?.map((item, index) => (
        <React.Fragment key={index}>
          <PostBubble item={item} />
        </React.Fragment>
      ))}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Made In</th>
            <th>Availability</th>
            <th>Time From</th>
            {/* Add more table headers as needed */}
            <th>Is Pinned</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((item, index) => (
            <tr key={index}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.madeIn.toString()}</td>
              <td>{item.availability.join(', ')}</td>
              <td>{item.timeFrom}</td>
              {/* Add more table cells as needed */}
              <td>{item.isPinned ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
