import type { Application } from 'lib/prisma/client'
import prisma from 'lib/prisma/connection'
import { cache_getActiveSummerJobEventId } from 'lib/data/cache'
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval'

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

function matchExisting(
  text: string | null | undefined,
  dbList: { name: string; id: string }[]
): { matchedNames: string[]; unmatchedNames: string[] } {
  if (!text) {
    return { matchedNames: [], unmatchedNames: [] }
  }

  const dbListNames = dbList.map(item => item.name)
  const split = text.split(/[,;\n]+/).map(s => s.trim().toLowerCase())

  const matchedNames = dbListNames.filter(name =>
    split.includes(name.toLowerCase())
  )
  const matchedNamesLower = matchedNames.map(name => name.toLowerCase())
  const unmatchedNames = split.filter(
    name => !matchedNamesLower.includes(name.toLowerCase())
  )

  // matchedNames includes names from db that are present in the application (names in db are unique)
  return { matchedNames, unmatchedNames }
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

  const foodAllergies = await prisma.foodAllergy.findMany()
  const workAllergies = await prisma.workAllergy.findMany()
  const skills = await prisma.skillHas.findMany()
  const toolNames = await prisma.toolName.findMany()

  const applicationFoodAllergies = matchExisting(
    application.foodAllergies,
    foodAllergies
  )
  const applicationWorkAllergies = matchExisting(
    application.workAllergies,
    workAllergies
  )
  const applicationSkillsHas = matchExisting(application.toolsSkills, skills)
  const applicationToolsBrings = matchExisting(
    application.toolsBringing,
    toolNames
  )

  const workDays = eachDayOfInterval({
    start: new Date(application.arrivalDate),
    end: new Date(application.departureDate),
  })

  const note = buildWorkerNote(application)

  const existingWorker = await prisma.worker.findUnique({
    where: { email: application.email.toLowerCase() },
  })

  if (existingWorker) {
    const combinedNote = [note, existingWorker.note]
      .filter(Boolean)
      .join('\n\n---\n')

    const updatedWorker = await prisma.worker.update({
      where: { email: application.email.toLowerCase() },
      data: {
        blocked: false,
        firstName: application.firstName,
        lastName: application.lastName,
        phone: application.phone,
        ownsCar: application.ownsCar,
        canBeMedic: application.canBeMedic,
        foodAllergies: {
          set: applicationFoodAllergies.matchedNames.map(name => ({ name })),
        },
        workAllergies: {
          set: applicationWorkAllergies.matchedNames.map(name => ({ name })),
        },
        skills: {
          set: applicationSkillsHas.matchedNames.map(name => ({ name })),
        },
        tools: {
          set: applicationToolsBrings.matchedNames.map(name => ({ name })),
        },
        photoPath: application.photo || undefined,
        age: calculateAge(application.birthDate),
        note: combinedNote,
        application: { connect: { id: application.id } },
      },
    })

    await prisma.workerAvailability.upsert({
      where: {
        workerId_eventId: {
          workerId: existingWorker.id,
          eventId: activeEventId,
        },
      },
      update: {
        workDays,
      },
      create: {
        worker: { connect: { id: existingWorker.id } },
        event: { connect: { id: activeEventId } },
        workDays,
      },
    })

    return updatedWorker
  }

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
      foodAllergies: {
        connect: applicationFoodAllergies.matchedNames.map(name => ({ name })),
      },
      workAllergies: {
        connect: applicationWorkAllergies.matchedNames.map(name => ({ name })),
      },
      skills: {
        connect: applicationSkillsHas.matchedNames.map(name => ({ name })),
      },
      tools: {
        connect: applicationToolsBrings.matchedNames.map(name => ({ name })),
      },
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
