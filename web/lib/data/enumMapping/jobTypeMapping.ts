import { JobType } from 'lib/types/enums'
import { EnumMapping } from './enumMapping'

export const jobTypeMapping: EnumMapping<JobType> = {
  WOOD: 'Dřevo',
  PAINTING: 'Malování',
  HOUSEWORK: 'Pomoc doma',
  GARDEN: 'Práce na zahradě',
  OTHER: 'Ostatní',
}
