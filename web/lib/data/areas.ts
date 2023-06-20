import prisma from 'lib/prisma/connection'
import { AreaComplete, AreaCreateData, AreaUpdateData } from 'lib/types/area'

export async function getAreaById(id: string): Promise<AreaComplete | null> {
  return await prisma.area.findUnique({
    where: {
      id,
    },
    include: {
      jobs: true,
    },
  })
}

export async function getAreas() {
  return await prisma.area.findMany({
    where: {
      summerJobEvent: {
        isActive: true,
      },
    },
  })
}

export async function deleteArea(id: string) {
  await prisma.area.delete({
    where: {
      id,
    },
  })
}

export async function createArea(area: AreaCreateData) {
  const createdArea = await prisma.area.create({
    data: area,
  })
  return createdArea
}

export async function updateArea(id: string, data: AreaUpdateData) {
  await prisma.area.update({
    where: {
      id,
    },
    data,
  })
}
