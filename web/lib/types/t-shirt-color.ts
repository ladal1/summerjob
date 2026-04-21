import { z } from 'zod'
import { Serialized } from './serialize'
import { TShirtColorSchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const TShirtColorCompleteSchema = TShirtColorSchema

export type TShirtColorComplete = z.infer<typeof TShirtColorCompleteSchema>

export function serializeTShirtColors(
  tShirtColors: TShirtColorComplete[]
): Serialized {
  return {
    data: JSON.stringify(tShirtColors),
  }
}

export function deserializeTShirtColors(
  tShirtColors: Serialized
): TShirtColorComplete[] {
  return JSON.parse(tShirtColors.data)
}

const TShirtColorBasicSchema = z
  .object({
    name: z
      .string({ message: err.emptyName })
      .min(1, { message: err.emptyName })
      .trim(),
    order: z.coerce.number().int().default(0),
  })
  .strict()

export const TShirtColorCreateSchema = TShirtColorBasicSchema
export type TShirtColorCreateData = z.infer<typeof TShirtColorCreateSchema>
export type TShirtColorCreateDataInput = z.input<typeof TShirtColorCreateSchema>

export const TShirtColorUpdateSchema =
  TShirtColorCreateSchema.partial().strict()
export type TShirtColorUpdateData = z.infer<typeof TShirtColorUpdateSchema>
export type TShirtColorUpdateDataInput = z.input<typeof TShirtColorUpdateSchema>

export { ReorderSchema as TShirtColorReorderSchema } from './reorder'
export type { ReorderData as TShirtColorReorderData } from './reorder'
