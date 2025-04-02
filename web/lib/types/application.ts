import { z } from 'zod'

const today = new Date()
today.setHours(0, 0, 0, 0)

const minBirthDate = new Date()
minBirthDate.setFullYear(minBirthDate.getFullYear() - 18)

export const ApplicationCreateSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'Jméno je povinné')
      .max(50, 'Jméno je příliš dlouhé'),
    lastName: z
      .string()
      .min(1, 'Příjmení je povinné')
      .max(50, 'Příjmení je příliš dlouhé'),
    birthDate: z.coerce
      .date()
      .refine(date => date <= minBirthDate, 'Musíte být starší 18 let')
      .refine(date => date <= today, 'Datum narození nemůže být v budoucnosti'),
    gender: z.enum(['Muž', 'Žena']),
    phone: z
      .string()
      .min(9, 'Telefonní číslo je povinné')
      .max(20, 'Telefonní číslo je příliš dlouhé')
      .refine(value => /^[0-9+]+$/.test(value), 'Nesprávné telefonní číslo'),
    email: z
      .string()
      .email('Neplatný email')
      .max(100, 'Email je příliš dlouhý'),
    address: z
      .string()
      .min(1, 'Adresa je povinná')
      .max(200, 'Adresa je příliš dlouhá'),
    pastParticipation: z.boolean(),
    arrivalDate: z.coerce
      .date()
      .refine(date => date >= today, 'Datum příjezdu nemůže být v minulosti'),
    departureDate: z.coerce
      .date()
      .refine(date => date >= today, 'Datum odjezdu nemůže být v minulosti'),
    foodAllergies: z
      .string()
      .max(200, 'Text je příliš dlouhý, max 200 znaků.')
      .optional(),
    workAllergies: z
      .string()
      .max(200, 'Text je příliš dlouhý, max 200 znaků.')
      .optional(),
    toolsSkills: z.string().max(300, 'Text je příliš dlouhý, max 300 znaků.'),
    toolsBringing: z.string().max(300, 'Text je příliš dlouhý, max 300 znaků.'),
    heardAboutUs: z
      .string()
      .max(300, 'Text je příliš dlouhý, max 300 znaků.')
      .optional(),
    playsInstrument: z
      .string()
      .max(150, 'Text je příliš dlouhý, max 150 znaků.')
      .optional(),
    tShirtSize: z
      .string()
      .max(30, 'Zadejte např. S, M, L... a barvu')
      .optional(),
    additionalInfo: z
      .string()
      .max(1000, 'Zpráva je příliš dlouhá, max 1000 znaků.')
      .optional(),
    accommodationPrice: z
      .string()
      .min(1, 'Cena za ubytování je povinná')
      .max(10, 'Číslo je příliš velké.'),
    ownsCar: z.boolean().default(false),
    canBeMedic: z.boolean().default(false),
    photo: z.string().optional(),
    photoFile: z
      .any()
      .refine(file => file instanceof File, 'Neplatný soubor')
      .refine(
        file => file.size <= 10 * 1024 * 1024,
        'Maximální velikost souboru je 10 MB'
      )
      .refine(
        file => file.type.startsWith('image'),
        'Pouze obrázky jsou povolené'
      )
      .nullable()
      .optional(),
    photoFileRemoved: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.departureDate < data.arrivalDate) {
      ctx.addIssue({
        path: ['departureDate'],
        code: 'custom',
        message: 'Datum odjezdu musí být po datu příjezdu',
      })
    }
  })
export type ApplicationCreateDataInput = z.infer<typeof ApplicationCreateSchema>

export const ApplicationUpdateSchema =
  ApplicationCreateSchema._def.schema.partial()

export type ApplicationUpdateDataInput = z.infer<typeof ApplicationUpdateSchema>

import { Serialized } from './serialize'

export function serializeApplication(
  application: ApplicationCreateDataInput
): Serialized {
  return { data: JSON.stringify(application) }
}

export function deserializeApplication(
  serialized: Serialized
): ApplicationCreateDataInput {
  return JSON.parse(serialized.data)
}

export function serializeApplications(
  applications: ApplicationCreateDataInput[]
): Serialized {
  return { data: JSON.stringify(applications) }
}

export function deserializeApplications(
  serialized: Serialized
): ApplicationCreateDataInput[] {
  return JSON.parse(serialized.data)
}
