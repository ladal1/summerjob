import {
  Application,
  FoodAllergy,
  WorkAllergy,
  SkillHas,
  SkillBrings,
} from 'lib/prisma/client'
import prisma from 'lib/prisma/connection'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval'

const foodAllergyMapping: Record<string, FoodAllergy> = {
  laktóza: FoodAllergy.LACTOSE,
  lepek: FoodAllergy.GLUTEN,
  ořechy: FoodAllergy.NUTS,
  'mořské plody': FoodAllergy.SEAFOOD,
  vejce: FoodAllergy.EGG,
}

const workAllergyMapping: Record<string, WorkAllergy> = {
  prach: WorkAllergy.DUST,
  zvířata: WorkAllergy.ANIMALS,
  seno: WorkAllergy.HAY,
  pyl: WorkAllergy.POLLEN,
  roztoči: WorkAllergy.MITES,
  chemikálie: WorkAllergy.CHEMICALS,
}

const skillHasMapping: Record<string, SkillHas> = {
  dřevorubec: SkillHas.LUMBERJACK,
  umělec: SkillHas.ARTIST,
  zahradník: SkillHas.GARDENER,
  'nebezpečné práce': SkillHas.DANGER,
  elektrikář: SkillHas.ELECTRICIAN,
  výšky: SkillHas.HEIGHTS,
  zedník: SkillHas.MASON,
}

const skillBringsMapping: Record<string, SkillBrings> = {
  sekera: SkillBrings.AXE,
  lopata: SkillBrings.SHOVEL,
  pila: SkillBrings.SAW,
  nářadí: SkillBrings.POWERTOOLS,
  žebřík: SkillBrings.LADDER,
}

function buildWorkerNote(application: Application): string {
  const noteParts: string[] = []

  if (application.foodAllergies) {
    noteParts.push(`Potravinové alergie: ${application.foodAllergies}`)
  }

  if (application.workAllergies) {
    noteParts.push(`Pracovní alergie: ${application.workAllergies}`)
  }

  if (application.toolsSkills) {
    noteParts.push(`Dovednosti (umí): ${application.toolsSkills}`)
  }

  if (application.toolsBringing) {
    noteParts.push(`Nářadí (přiveze): ${application.toolsBringing}`)
  }

  if (application.heardAboutUs) {
    noteParts.push(`Jak se dozvěděl: ${application.heardAboutUs}`)
  }

  if (application.playsInstrument) {
    noteParts.push(`Hudební nástroj: ${application.playsInstrument}`)
  }

  if (application.additionalInfo) {
    noteParts.push(`Dodatečné info: ${application.additionalInfo}`)
  }

  return noteParts.join('\n')
}

function extractMapped<T>(
  text: string | null | undefined,
  mapping: Record<string, T>
): { matched: T[]; unmatched: string[] } {
  const result: T[] = []
  const unmatched: string[] = []

  if (!text) {
    return { matched: [], unmatched: [] }
  }

  const lower = text.toLowerCase()
  const foundKeys = Object.keys(mapping).filter(k => lower.includes(k))

  for (const key of foundKeys) {
    result.push(mapping[key])
  }

  const words = text.split(/[,;\n]+/).map(s => s.trim())
  for (const word of words) {
    if (word && !foundKeys.some(k => word.toLowerCase().includes(k))) {
      unmatched.push(word)
    }
  }

  return { matched: result, unmatched }
}

function calculateAge(birthDate: Date): number {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

export async function createWorkerFromApplication(application: Application) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new Error('No active event found')
  }

  const workDays = eachDayOfInterval({
    start: new Date(application.arrivalDate),
    end: new Date(application.departureDate),
  })

  const fa = extractMapped(application.foodAllergies, foodAllergyMapping)
  const wa = extractMapped(application.workAllergies, workAllergyMapping)
  const sh = extractMapped(application.toolsSkills, skillHasMapping)
  const sb = extractMapped(application.toolsBringing, skillBringsMapping)

  const note = buildWorkerNote(application)

  const worker = await prisma.worker.create({
    data: {
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email.toLowerCase(),
      phone: application.phone,
      isStrong: false,
      isTeam: false,
      ownsCar: application.ownsCar,
      canBeMedic: application.canBeMedic,
      foodAllergies: { set: fa.matched },
      workAllergies: { set: wa.matched },
      skills: { set: sh.matched },
      tools: { set: sb.matched },
      photoPath: application.photo || undefined,
      age: calculateAge(application.birthDate),
      note,
      permissions: {
        create: {
          permissions: [],
        },
      },
      availability: {
        create: {
          workDays,
          adorationDays: [],
          event: {
            connect: { id: activeEventId },
          },
        },
      },
      application: {
        connect: { id: application.id },
      },
    },
  })

  return worker
}
