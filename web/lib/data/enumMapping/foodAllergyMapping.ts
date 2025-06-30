import { FoodAllergy } from 'lib/prisma/client'

export const foodAllergyMapping: Record<FoodAllergy, string> = {
  [FoodAllergy.LACTOSE]: 'Laktóza',
  [FoodAllergy.GLUTEN]: 'Lepek',
  [FoodAllergy.NUTS]: 'Ořechy',
  [FoodAllergy.SEAFOOD]: 'Mořské plody',
  [FoodAllergy.EGG]: 'Vejce',
  [FoodAllergy.VEGETARIAN]: 'Vegetarián',
  [FoodAllergy.VEGAN]: 'Veganský',
  [FoodAllergy.OTHER]: 'Jiné',
}
