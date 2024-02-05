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
    const data = new FormData()
    data.append('file', arg)
    const res = await fetch(url, {
      method: method,
      body: data,
    })
    return resultResolver(res, 'An error occurred while submitting the data.')
}

const get = send('GET')
const post = sendData('POST')
const patch = sendData('PATCH')
const del = send('DELETE')

export function useDataFileImage<T>(url: string, options?: any) {
  return useSWR<T, Error>(url, get, options)
}

export function useDataFilePartialUpdate<T>(url: string, options?: any) {
  // Bugfix until this is solved https://github.com/vercel/swr/issues/2376
  options = { throwOnError: false, ...options }
  return useSWRMutation<any, any, Key, T>(url, patch, options)
}

export function useDataFileCreate<T>(url: string, options?: any) {
  // Bugfix until this is solved https://github.com/vercel/swr/issues/2376
  options = { throwOnError: false, ...options }
  return useSWRMutation<any, any, Key, T>(url, post, options)
}

export function useDataFileDelete(url: string, options?: any) {
  // Bugfix until this is solved
  options = { throwOnError: false, ...options }
  return useSWRMutation(url, del, options)
}