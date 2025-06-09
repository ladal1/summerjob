import { WorkAllergy } from 'lib/prisma/client'

export const workAllergyMapping: Record<WorkAllergy, string> = {
  [WorkAllergy.DUST]: 'Prach',
  [WorkAllergy.ANIMALS]: 'Zvířata',
  [WorkAllergy.HAY]: 'Seno',
  [WorkAllergy.POLLEN]: 'Pyl',
  [WorkAllergy.MITES]: 'Roztoči',
  [WorkAllergy.CHEMICALS]: 'Chemikálie',
  [WorkAllergy.OTHER]: 'Jiné',
}
