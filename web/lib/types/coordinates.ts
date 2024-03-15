import { z } from 'zod'

export const coordinatesZod = z.array(z.number())

export const CoordinatesSchema = z.object({
  coordinates: coordinatesZod,
})
