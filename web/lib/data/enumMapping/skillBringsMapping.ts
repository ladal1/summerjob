import { SkillBrings } from 'lib/types/enums'

export const skillBringsMapping: Record<SkillBrings, string> = {
  [SkillBrings.AXE]: 'Sekera',
  [SkillBrings.SHOVEL]: 'Lopata',
  [SkillBrings.SAW]: 'Pila',
  [SkillBrings.POWERTOOLS]: 'Elektrické nářadí',
  [SkillBrings.LADDER]: 'Žebřík',
  [SkillBrings.OTHER]: 'Jiné',
}
