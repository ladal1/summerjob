import { SkillHasAPIGetResponse, SkillHasAPIPostData } from 'pages/api/skills'
import {
  useData,
  useDataCreate,
  useDataDelete,
  useDataDeleteDynamic,
  useDataPartialUpdate,
} from './fetcher'
import { SkillHasUpdateData } from 'lib/types/skill'

export function useAPISkills(options?: any) {
  return useData<SkillHasAPIGetResponse>('/api/skills', options)
}

export function useAPISkillUpdate(skillId: string, options?: any) {
  return useDataPartialUpdate<SkillHasUpdateData>(
    `/api/skills/${skillId}`,
    options
  )
}

export function useAPISkillCreate(options?: any) {
  return useDataCreate<SkillHasAPIPostData>('/api/skills', options)
}

export function useAPISkillDelete(id: string, options?: any) {
  return useDataDelete(`/api/skills/${id}`, options)
}

export function useAPISkillDeleteDynamic(
  skillId: () => string | undefined,
  options?: any
) {
  const url = () => {
    const id = skillId()
    if (!id) return undefined
    return `/api/skills/${id}`
  }
  return useDataDeleteDynamic(url, options)
}
