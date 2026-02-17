import { z } from 'zod'
import { Serialized } from './serialize'
import { FoodAllergySchema } from 'lib/prisma/zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'

useZodOpenApi

export const FoodAllergyCompleteSchema = FoodAllergySchema

export type FoodAllergyComplete = z.infer<typeof FoodAllergyCompleteSchema>

export function serializeFoodAllergies(
  foodAllergies: FoodAllergyComplete[]
): Serialized {
  return {
    data: JSON.stringify(foodAllergies),
  }
}

export function deserializeFoodAllergies(
  foodAllergies: Serialized
): FoodAllergyComplete[] {
  return JSON.parse(foodAllergies.data)
}

const FoodAllergyBasicSchema = z
  .object({
    name: z
      .string({ message: err.emptyName })
      .min(1, { message: err.emptyName })
      .trim(),
  })
  .strict()

export const FoodAllergyCreateSchema = FoodAllergyBasicSchema
export type FoodAllergyCreateData = z.infer<typeof FoodAllergyCreateSchema>

export const FoodAllergyUpdateSchema =
  FoodAllergyCreateSchema.partial().strict()
export type FoodAllergyUpdateData = z.infer<typeof FoodAllergyUpdateSchema>
