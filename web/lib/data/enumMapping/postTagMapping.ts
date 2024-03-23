import { PostTag } from 'lib/prisma/client'
import { EnumMapping, EnumMappingWithIcon } from './enumMapping'

export const postTagMappingWithIcon: EnumMappingWithIcon<keyof typeof PostTag> =
  {
    EATING: { name: 'stravovací', icon: 'fas fa-utensils' },
    SPORTS: { name: 'sportovní', icon: 'fas fa-futbol' },
    CULTURAL: { name: 'kulturní', icon: 'fas fa-landmark' },
    EDUCATIONAL: { name: 'vzdělávací', icon: 'fas fa-graduation-cap' },
    RELIGIOUS: { name: 'náboženské', icon: 'fas fa-book-bible' },
    INFORMATIVE: { name: 'informativní', icon: 'fas fa-info' },
  }

export const postTagMapping: EnumMapping<keyof typeof PostTag> = {
  EATING: 'stravovací',
  SPORTS: 'sportovní',
  CULTURAL: 'kulturní',
  EDUCATIONAL: 'vzdělávací',
  RELIGIOUS: 'náboženské',
  INFORMATIVE: 'informativní',
}
