import { Allergy } from '../../prisma/client'
import { EnumMapping } from './enumMapping'

export const allergyMapping: EnumMapping<keyof typeof Allergy> = {
  DUST: 'Prach',
  ANIMALS: 'Zvířata',
  HAY: 'Seno',
  POLLEN: 'Pyl',
  MITES: 'Roztoči',
}
