import { ToolName } from '../../prisma/client'
import { EnumMapping } from './enumMapping'

export const toolNameMapping: EnumMapping<keyof typeof ToolName> = {
  AXE: 'Sekera',
  BOW_SAW: 'Luková pila',
  LADDER: 'Žebřík',
  PAINT: 'Barva',
  PAINT_ROLLER: 'Váleček na barvu',
  COVER_SHEET: 'Zakrývací plachta',
  MASKING_TAPE: 'Malířská páska',
  PAINT_BRUSH: 'Malířská štětka',
  SCRAPER_GRID: 'Stírací mřížka',
  PAINTER_SPATULA: 'Malířská špachtle',
  JAPANESE_SPATULA: 'Japonská špachtle',
  GYPSUM: 'Sádra',
  BUCKET: 'Kbelík',
  RAG: 'Hadr',
  BROOM: 'Koště'
}
