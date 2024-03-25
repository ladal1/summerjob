import prisma from 'lib/prisma/connection'
import { getWorkerById } from './workers'
import { getPostById } from './posts'

export async function updatePostParticipantById(
  participantId: string,
  postId: string
) {
  const worker = getWorkerById(participantId)
  if (!worker) {
    return
  }
  const post = getPostById(postId)
  if (!post) {
    return
  }
  const currentParticipants = await getPostsParticipants(postId)
  const isParticipantEnrolled = currentParticipants.some(
    participant => participant.workerId === participantId
  )

  if (isParticipantEnrolled) {
    // If participant is already enrolled, remove them from the post
    await prisma.participant.deleteMany({
      where: {
        postId,
        workerId: participantId,
      },
    })
  } else {
    // If participant is not enrolled, add them to the post
    await prisma.participant.create({
      data: {
        postId,
        workerId: participantId,
      },
    })
  }
}

export async function getPostsParticipants(postId: string) {
  return await prisma.participant.findMany({
    where: {
      postId,
    },
  })
}
