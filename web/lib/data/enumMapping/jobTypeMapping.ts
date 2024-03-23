import { JobType } from '../../prisma/client'
import { EnumMapping } from './enumMapping'

export const jobTypeMapping: EnumMapping<keyof typeof JobType> = {
  WOOD      : 'Dřevo',
  PAINTING  : 'Malování',
  HOUSEWORK : 'Pomoc doma',
  GARDEN    : 'Práce na zahradě',
  OTHER     : 'Ostatní',
}
