import useSWR, { Key } from 'swr'
import useSWRMutation from 'swr/mutation'
import { resultResolver } from './fetcher-res-resolver'

const send = (method: string) => async (url: string) => {
  const res = await fetch(url, { method: method })
  return resultResolver(res, 'An error occurred during this request.')
}

const sendData =
  (method: string) =>
  async (url: string, { arg }: { arg: any }) => {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(arg),
    })
    return resultResolver(res, 'An error occurred while submitting the data.')
  }

const get = send('GET')
const post = sendData('POST')
const patch = sendData('PATCH')
const del = send('DELETE')

export function useData<T>(url: string, options?: any) {
  return useSWR<T, Error>(url, get, options)
}

export function useDataPartialUpdate<T>(url: string, options?: any) {
  // Bugfix until this is solved https://github.com/vercel/swr/issues/2376
  options = { throwOnError: false, ...options }
  return useSWRMutation<any, any, Key, T>(url, patch, options)
}

export function useDataPartialUpdateDynamic<T>(
  getUrl: () => string | undefined,
  options?: any
) {
  // Bugfix until this is solved https://github.com/vercel/swr/issues/2376
  options = { throwOnError: false, ...options }
  return useSWRMutation<any, any, Key, T>(getUrl, patch, options)
}

export function useDataCreate<T>(url: string, options?: any) {
  // Bugfix until this is solved https://github.com/vercel/swr/issues/2376
  options = { throwOnError: false, ...options }
  return useSWRMutation<any, any, Key, T>(url, post, options)
}

export function useDataDelete(url: string, options?: any) {
  // Bugfix until this is solved
  options = { throwOnError: false, ...options }
  return useSWRMutation(url, del, options)
}

export function useDataDeleteDynamic(
  getUrl: () => string | undefined,
  options?: any
) {
  // Bugfix until this is solved https://github.com/vercel/swr/issues/2376
  options = { throwOnError: false, ...options }
  return useSWRMutation(getUrl, del, options)
}
