import { ColorTag } from 'lib/prisma/client'

export interface ColorTagInfo {
  label: string
  color: string
}

// Fixed, shared palette used for tagging both jobs and workers.
// Keys must match the ColorTag enum in prisma/schema.prisma.
export const colorTagMapping: Record<ColorTag, ColorTagInfo> = {
  YELLOW: { label: 'Žlutá', color: '#ffd43b' },
  GREEN: { label: 'Zelená', color: '#51cf66' },
  RED: { label: 'Červená', color: '#ff6b6b' },
  PURPLE: { label: 'Fialová', color: '#cc5de8' },
  BLUE: { label: 'Modrá', color: '#339af0' },
  ORANGE: { label: 'Oranžová', color: '#ff922b' },
}

// Stable order for rendering the picker/palette. Derived from the mapping so a
// new ColorTag value can't silently drop out of the picker (object key order is
// insertion order for string keys).
export const colorTagOrder = Object.keys(colorTagMapping) as ColorTag[]
