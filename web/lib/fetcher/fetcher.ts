import useSWR, { Key } from 'swr'
import useSWRMutation from 'swr/mutation'
import { resultResolver } from './fetcher-res-resolver'

const send = (method: string) => async (url: string) => {
  const res = await fetch(url, { method: method })
  return resultResolver(res, 'An error occurred during this request.')
}

const sendData3 =
  (method: string) =>
  async (url: string, { arg }: { arg: any }) => {
    const formData = new FormData();
    Object.keys(arg).forEach(key => {
      formData.append(key, arg[key]);
    })
    console.log(arg)
    console.log(formData)
    const res = await fetch(url, {
      method: method,
      body: formData,
    })
    return resultResolver(res, 'An error occurred while submitting the data.')
  }

const sendData =
  (method: string) =>
  async (url: string, { arg }: { arg: any }) => {
    const formData = new FormData()

    let jsonFile = ""
    let first = true
    const convertData = (key: string, value: any) => {
      if (value instanceof File) {
        formData.append(key, value)
      } 
      else {
        jsonFile += (first ? '{' : ',') + '"' + key + '"' + ':' + (JSON.stringify(value))
        first = false
      }
    }
    Object.entries(arg).forEach(([key, value]) => {
      convertData(key, value)
    })
    jsonFile += '}'

    formData.append('jsonFile', new Blob([jsonFile], { type: 'application/json' })) // JSON.stringify(arg) could be used here, but among arg can be file too

    const res = await fetch(url, {
      method: method,
      body: formData,
    })
    return resultResolver(res, 'An error occurred while submitting the data.')
  }



const sendData2 =
  (method: string) =>
  async (url: string, { arg }: { arg: any }) => {
    console.log(arg)
    console.log(JSON.stringify(arg))
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
const post = sendData2('POST')
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
