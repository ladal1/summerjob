import { Skill } from '../../prisma/client'
import { EnumMapping } from './enumMapping'

export const skillMapping: EnumMapping<keyof typeof Skill> = {
  LUMBERJACK: 'Práce se sekerou',
  ARTIST: 'Umělec',
  GARDENER: 'Zahradník',
  DANGER: 'Práce s nebezpečnými nástroji',
  ELECTRICIAN: 'Elektrikář',
  HEIGHTS: 'Práce ve výškách',
  STRONG: 'Silák',
}
