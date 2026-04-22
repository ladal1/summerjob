import { z } from 'zod'
import useZodOpenApi from 'lib/api/useZodOpenApi'

useZodOpenApi

export const coordinatesZod = z.array(z.number())

export const CoordinatesSchema = z.object({
  coordinates: coordinatesZod,
})
