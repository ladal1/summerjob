'use client'

import ErrorPage from 'lib/components/error-page/ErrorPage'

export default function ErrorHandler({ error }: { error: Error }) {
  if (process.env.NODE_ENV === 'development') {
    throw error
  }
  return <ErrorPage error={error} />
}
