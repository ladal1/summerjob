import useZodOpenApi from 'lib/api/useZodOpenApi'
import { customErrorMessages as err } from 'lib/lang/error-messages'
import { z } from 'zod'

useZodOpenApi

export const EmailSchema = z
  .object({
    email: z
      .string({ message: err.emptyEmail })
      .min(1, { message: err.emptyEmail })
      .email({ message: err.invalidEmail })
      .trim(),
  })
  .strict()

export type EmailData = z.infer<typeof EmailSchema>
