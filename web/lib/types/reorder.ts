import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

export const ReorderSchema = z
  .object({
    ids: z.array(z.string().uuid()).min(1),
  })
  .strict()

export type ReorderData = z.infer<typeof ReorderSchema>
