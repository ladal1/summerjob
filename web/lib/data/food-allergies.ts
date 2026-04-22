import prisma from 'lib/prisma/connection'
import {
  FoodAllergyComplete,
  FoodAllergyCreateData,
  FoodAllergyUpdateData,
} from 'lib/types/food-allergy'
import { reorderByIds } from './reorder-utils'

export async function getFoodAllergyById(
  id: string
): Promise<FoodAllergyComplete | null> {
  const foodAllergy = await prisma.foodAllergy.findFirst({
    where: {
      id,
    },
  })
  return foodAllergy
}

export async function getFoodAllergies() {
  const foodAllergies = await prisma.foodAllergy.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
  return foodAllergies
}

export async function updateFoodAllergy(
  foodAllergyId: string,
  foodAllergy: FoodAllergyUpdateData
) {
  await prisma.foodAllergy.update({
    where: {
      id: foodAllergyId,
    },
    data: {
      name: foodAllergy.name,
    },
  })
}

export async function createFoodAllergy(
  foodAllergyData: FoodAllergyCreateData
) {
  const last = await prisma.foodAllergy.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const foodAllergy = await prisma.foodAllergy.create({
    data: {
      name: foodAllergyData.name,
      order: last ? last.order + 1 : 0,
    },
  })
  return foodAllergy
}

export async function deleteFoodAllergy(foodAllergyId: string) {
  await prisma.foodAllergy.delete({
    where: {
      id: foodAllergyId,
    },
  })
}

export async function reorderFoodAllergies(orderedIds: string[]) {
  await reorderByIds(prisma.foodAllergy, orderedIds, 'Alergie neexistuje.')
}
