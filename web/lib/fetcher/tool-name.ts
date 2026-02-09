import {
  ToolNamesAPIGetResponse,
  ToolNamesAPIPostData,
} from 'pages/api/tool-names'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataDeleteDynamic,
  useDataPartialUpdate,
} from './fetcher'
import { ToolNameUpdateData } from 'lib/types/tool-name'

export function useAPIToolNames(options?: any) {
  return useData<ToolNamesAPIGetResponse>('/api/tool-names', options)
}

export function useAPIToolNameUpdate(toolNameId: string, options?: any) {
  return useDataPartialUpdate<ToolNameUpdateData>(
    `/api/tool-names/${toolNameId}`,
    options
  )
}

export function useAPIToolNameCreate(options?: any) {
  return useDataCreate<ToolNamesAPIPostData>('/api/tool-names', options)
}

export function useAPIToolNameDelete(id: string, options?: any) {
  return useDataDelete(`/api/tool-names/${id}`, options)
}

export function useAPIToolNameDeleteDynamic(
  toolNameId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = toolNameId()
    if (!id) return undefined
    return `/api/tool-names/${id}`
  }
  return useDataDeleteDynamic(url, options)
}
