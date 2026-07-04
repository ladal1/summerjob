'use client'
import { ColorTag } from 'lib/prisma/client'
import { useAPIWorkerUpdate } from 'lib/fetcher/worker'
import { ColorTagCell } from '../table/ColorTagCell'

interface WorkerColorTagProps {
  workerId: string
  colorTags: ColorTag[]
  onUpdated: () => void
}

// Wraps ColorTagCell with the worker update hook so worker color tags can be
// edited from anywhere a worker row is rendered (worker list, plan, etc.).
export function WorkerColorTag({
  workerId,
  colorTags,
  onUpdated,
}: WorkerColorTagProps) {
  const { trigger } = useAPIWorkerUpdate(workerId, { onSuccess: onUpdated })
  return (
    <ColorTagCell
      tags={colorTags}
      onChange={tags => trigger({ colorTags: tags })}
    />
  )
}
