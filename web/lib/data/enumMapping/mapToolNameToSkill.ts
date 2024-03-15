import { Skill } from 'lib/prisma/client'

const toolToSkillMapping: Record<string, (keyof typeof Skill)[]> = {
  AXE: ['LUMBERJACK'],
  BOW_SAW: ['LUMBERJACK'],
  LADDER: ['HEIGHTS'],
  PAINT: ['ARTIST'],
  PAINT_ROLLER: ['ARTIST'],
  COVER_SHEET: ['ARTIST'],
  MASKING_TAPE: ['ARTIST'],
  PAINT_BRUSH: ['ARTIST'],
  SCRAPER_GRID: ['ARTIST'],
  PAINTER_SPATULA: ['ARTIST'],
  JAPANESE_SPATULA: ['ARTIST'],
  GYPSUM: ['ARTIST'],
  SAW: ['DANGER'],
  BRUSHCUTTER: ['GARDENER'],
  CHAINSAW: ['DANGER'],
  CIRCULAR_SAW: ['DANGER'],
}

export const mapToolNameToSkill = (id: string) => {
  return toolToSkillMapping[id] || []
}
