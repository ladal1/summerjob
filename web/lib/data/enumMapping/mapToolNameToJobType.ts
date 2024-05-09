import { JobType } from 'lib/prisma/client'

const toolToJobTypeMapping: Record<string, (keyof typeof JobType)[]> = {
  AXE: ['WOOD'],
  BOW_SAW: ['WOOD'],
  LADDER: ['GARDEN', 'HOUSEWORK', 'PAINTING'],
  PAINT: ['PAINTING'],
  PAINT_ROLLER: ['PAINTING'],
  COVER_SHEET: ['PAINTING'],
  MASKING_TAPE: ['PAINTING'],
  PAINT_BRUSH: ['PAINTING'],
  SCRAPER_GRID: ['PAINTING'],
  PAINTER_SPATULA: ['PAINTING'],
  JAPANESE_SPATULA: ['PAINTING'],
  GYPSUM: ['PAINTING'],
  BUCKET: ['HOUSEWORK'],
  RAG: ['HOUSEWORK'],
  BROOM: ['HOUSEWORK'],
  SAW: ['WOOD'],
  BRUSHCUTTER: ['GARDEN'],
  GLOVES: ['GARDEN', 'HOUSEWORK', 'WOOD'],
  RESPIRATOR: ['HOUSEWORK', 'PAINTING', 'WOOD'],
  HEADPHONES: ['GARDEN', 'WOOD'],
  CHAINSAW: ['WOOD'],
  CIRCULAR_SAW: ['WOOD'],
  PITCHFORK: ['GARDEN'],
  RAKE: ['GARDEN'],
  SHOVEL: ['GARDEN', 'HOUSEWORK'],
}

export const mapToolNameToJobType = (id: string) => {
  return toolToJobTypeMapping[id] || ['OTHER']
}
