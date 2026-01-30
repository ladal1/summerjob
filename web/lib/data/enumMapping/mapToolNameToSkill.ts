import { SkillHas } from 'lib/types/enums'

const toolToSkillMapping: Record<string, SkillHas[]> = {
  AXE: [SkillHas.LUMBERJACK],
  BOW_SAW: [SkillHas.LUMBERJACK],
  LADDER: [SkillHas.HEIGHTS],
  PAINT: [SkillHas.ARTIST],
  PAINT_ROLLER: [SkillHas.ARTIST],
  COVER_SHEET: [SkillHas.ARTIST],
  MASKING_TAPE: [SkillHas.ARTIST],
  PAINT_BRUSH: [SkillHas.ARTIST],
  SCRAPER_GRID: [SkillHas.ARTIST],
  PAINTER_SPATULA: [SkillHas.ARTIST],
  JAPANESE_SPATULA: [SkillHas.ARTIST],
  GYPSUM: [SkillHas.ARTIST],
  SAW: [SkillHas.DANGER],
  BRUSHCUTTER: [SkillHas.GARDENER],
  CHAINSAW: [SkillHas.DANGER],
  CIRCULAR_SAW: [SkillHas.DANGER],
}

export const mapToolNameToSkill = (id: string): SkillHas[] => {
  return toolToSkillMapping[id] || []
}
