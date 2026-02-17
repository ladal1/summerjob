import prisma from 'lib/prisma/connection'
import {
  WorkAllergyComplete,
  WorkAllergyCreateData,
  WorkAllergyUpdateData,
} from 'lib/types/work-allergy'

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
  const workAllergies = await prisma.workAllergy.findMany()
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
  const workAllergy = await prisma.workAllergy.create({
    data: {
      name: workAllergyData.name,
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
