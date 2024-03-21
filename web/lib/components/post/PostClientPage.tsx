'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { Serialized } from 'lib/types/serialize'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Filters } from '../filters/Filters'
import { deserializePosts } from 'lib/types/post'
import { useAPIPosts } from 'lib/fetcher/post'

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

      <section></section>
    </>
  )
}
