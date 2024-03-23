'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIPosts } from 'lib/fetcher/post'
import { deserializePosts } from 'lib/types/post'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import React from 'react'
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
      {data?.map((item, index) => (
        <React.Fragment key={index}>
          <PostBubble
            item={item}
            advancedAccess={advancedAccess}
            onUpdated={mutate}
          />
        </React.Fragment>
      ))}
    </>
  )
}
