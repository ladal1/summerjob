import prisma from 'lib/prisma/connection'

export async function getFoodAllergies() {
  const foodAllergies = await prisma.foodAllergy.findMany()
  return foodAllergies
}
