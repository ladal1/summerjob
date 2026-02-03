import { JobType } from 'lib/types/enums'

const toolToJobTypeMapping: Record<string, JobType[]> = {
  AXE: [JobType.WOOD],
  BOW_SAW: [JobType.WOOD],
  LADDER: [JobType.GARDEN, JobType.HOUSEWORK, JobType.PAINTING],
  PAINT: [JobType.PAINTING],
  PAINT_ROLLER: [JobType.PAINTING],
  COVER_SHEET: [JobType.PAINTING],
  MASKING_TAPE: [JobType.PAINTING],
  PAINT_BRUSH: [JobType.PAINTING],
  SCRAPER_GRID: [JobType.PAINTING],
  PAINTER_SPATULA: [JobType.PAINTING],
  JAPANESE_SPATULA: [JobType.PAINTING],
  GYPSUM: [JobType.PAINTING],
  BUCKET: [JobType.HOUSEWORK],
  RAG: [JobType.HOUSEWORK],
  BROOM: [JobType.HOUSEWORK],
  SAW: [JobType.WOOD],
  BRUSHCUTTER: [JobType.GARDEN],
  GLOVES: [JobType.GARDEN, JobType.HOUSEWORK, JobType.WOOD],
  RESPIRATOR: [JobType.HOUSEWORK, JobType.PAINTING, JobType.WOOD],
  HEADPHONES: [JobType.GARDEN, JobType.WOOD],
  CHAINSAW: [JobType.WOOD],
  CIRCULAR_SAW: [JobType.WOOD],
  PITCHFORK: [JobType.GARDEN],
  RAKE: [JobType.GARDEN],
  SHOVEL: [JobType.GARDEN, JobType.HOUSEWORK],
  HEDGE_TRIMMER: [JobType.GARDEN, JobType.WOOD],
  STRING_TRIMMER: [JobType.GARDEN],
}

export const mapToolNameToJobType = (id: string): JobType[] => {
  return toolToJobTypeMapping[id] || [JobType.OTHER]
}
