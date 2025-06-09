import { SkillHas } from 'lib/prisma/client'

export const skillHasMapping: Record<SkillHas, string> = {
  [SkillHas.LUMBERJACK]: 'Dřevorubec',
  [SkillHas.ARTIST]: 'Umělec',
  [SkillHas.GARDENER]: 'Zahradník',
  [SkillHas.DANGER]: 'Nebezpečné práce',
  [SkillHas.ELECTRICIAN]: 'Elektrikář',
  [SkillHas.HEIGHTS]: 'Práce ve výškách',
  [SkillHas.MASON]: 'Zedník',
  [SkillHas.OTHER]: 'Jiné',
}
