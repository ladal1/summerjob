import { SkillBrings } from 'lib/prisma/client'

export const skillBringsMapping: Record<SkillBrings, string> = {
  [SkillBrings.AXE]: 'Sekera',
  [SkillBrings.SHOVEL]: 'Lopata',
  [SkillBrings.SAW]: 'Pila',
  [SkillBrings.POWERTOOLS]: 'Elektrické nářadí',
  [SkillBrings.LADDER]: 'Žebřík',
  [SkillBrings.OTHER]: 'Jiné',
}
