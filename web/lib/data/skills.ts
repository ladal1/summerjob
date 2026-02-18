import prisma from 'lib/prisma/connection'
import {
  SkillHasComplete,
  SkillHasCreateData,
  SkillHasUpdateData,
} from 'lib/types/skill'

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
  const skills = await prisma.skillHas.findMany()
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
  const skill = await prisma.skillHas.create({
    data: {
      name: skillData.name,
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
