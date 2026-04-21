import { z } from 'zod'
import { Serialized } from './serialize'
import { TShirtSizeSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const TShirtSizeCompleteSchema = TShirtSizeSchema

export type TShirtSizeComplete = z.infer<typeof TShirtSizeCompleteSchema>

export function serializeTShirtSizes(
  tShirtSizes: TShirtSizeComplete[]
): Serialized {
  return {
    data: JSON.stringify(tShirtSizes),
  }
}

export function deserializeTShirtSizes(
  tShirtSizes: Serialized
): TShirtSizeComplete[] {
  return JSON.parse(tShirtSizes.data)
}

const TShirtSizeBasicSchema = z
  .object({
    name: z
      .string({ message: err.emptyName })
      .min(1, { message: err.emptyName })
      .trim(),
    order: z.coerce.number().int().default(0),
  })
  .strict()

export const TShirtSizeCreateSchema = TShirtSizeBasicSchema
export type TShirtSizeCreateData = z.infer<typeof TShirtSizeCreateSchema>
export type TShirtSizeCreateDataInput = z.input<typeof TShirtSizeCreateSchema>

export const TShirtSizeUpdateSchema = TShirtSizeCreateSchema.partial().strict()
export type TShirtSizeUpdateData = z.infer<typeof TShirtSizeUpdateSchema>
export type TShirtSizeUpdateDataInput = z.input<typeof TShirtSizeUpdateSchema>

export { ReorderSchema as TShirtSizeReorderSchema } from './reorder'
export type { ReorderData as TShirtSizeReorderData } from './reorder'
