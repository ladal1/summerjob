import prisma from 'lib/prisma/connection'
import {
  WorkAllergyComplete,
  WorkAllergyCreateData,
  WorkAllergyUpdateData,
} from 'lib/types/work-allergy'
import { reorderByIds } from './reorder-utils'

export async function getWorkAllergyById(
  id: string
): Promise<WorkAllergyComplete | null> {
  const workAllergy = await prisma.workAllergy.findFirst({
    where: {
      id,
    },
  })
  return workAllergy
}

export async function getWorkAllergies() {
  const workAllergies = await prisma.workAllergy.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
  return workAllergies
}

export async function updateWorkAllergy(
  workAllergyId: string,
  workAllergy: WorkAllergyUpdateData
) {
  await prisma.workAllergy.update({
    where: {
      id: workAllergyId,
    },
    data: {
      name: workAllergy.name,
    },
  })
}

export async function createWorkAllergy(
  workAllergyData: WorkAllergyCreateData
) {
  const last = await prisma.workAllergy.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const workAllergy = await prisma.workAllergy.create({
    data: {
      name: workAllergyData.name,
      order: last ? last.order + 1 : 0,
    },
  })
  return workAllergy
}

export async function deleteWorkAllergy(workAllergyId: string) {
  await prisma.workAllergy.delete({
    where: {
      id: workAllergyId,
    },
  })
}

export async function reorderWorkAllergies(orderedIds: string[]) {
  await reorderByIds(
    prisma.workAllergy,
    orderedIds,
    'Pracovní alergie neexistuje.'
  )
}
