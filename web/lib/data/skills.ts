import prisma from 'lib/prisma/connection'
import {
  SkillHasComplete,
  SkillHasCreateData,
  SkillHasUpdateData,
} from 'lib/types/skill'
import { reorderByIds } from './reorder-utils'

export async function getSkillById(
  id: string
): Promise<SkillHasComplete | null> {
  const skill = await prisma.skillHas.findFirst({
    where: {
      id,
    },
  })
  return skill
}

export async function getSkills() {
  const skills = await prisma.skillHas.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
  return skills
}

export async function updateSkill(skillId: string, skill: SkillHasUpdateData) {
  await prisma.skillHas.update({
    where: {
      id: skillId,
    },
    data: {
      name: skill.name,
    },
  })
}

export async function createSkill(skillData: SkillHasCreateData) {
  const last = await prisma.skillHas.findFirst({
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const skill = await prisma.skillHas.create({
    data: {
      name: skillData.name,
      order: last ? last.order + 1 : 0,
    },
  })
  return skill
}

export async function deleteSkill(skillId: string) {
  await prisma.skillHas.delete({
    where: {
      id: skillId,
    },
  })
}

export async function reorderSkills(orderedIds: string[]) {
  await reorderByIds(prisma.skillHas, orderedIds, 'Dovednost neexistuje.')
}
