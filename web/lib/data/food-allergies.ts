import prisma from 'lib/prisma/connection'
import {
  FoodAllergyComplete,
  FoodAllergyCreateData,
  FoodAllergyUpdateData,
} from 'lib/types/food-allergy'

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
  const foodAllergies = await prisma.foodAllergy.findMany()
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
  const foodAllergy = await prisma.foodAllergy.create({
    data: {
      name: foodAllergyData.name,
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
