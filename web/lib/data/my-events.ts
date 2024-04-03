import prisma from 'lib/prisma/connection'
import {
  NoActiveEventError,
  WorkerNotRegisteredInEventError,
} from './internal-error'
import { getActiveSummerJobEvent } from './summerjob-event'
import { PostComplete } from 'lib/types/post'

export async function getMyEvents(workerId: string): Promise<PostComplete[]> {
  const activeEvent = await getActiveSummerJobEvent()
  if (!activeEvent) {
    throw new NoActiveEventError()
  }
  if (
    !activeEvent.workerAvailability
      .map(avail => avail.workerId)
      .includes(workerId)
  ) {
    throw new WorkerNotRegisteredInEventError()
  }
  const posts = await prisma.post.findMany({
    where: {
      OR: [
        {
          isMandatory: true,
        },
        {
          isOpenForParticipants: true,
          participants: {
            some: {
              workerId: workerId,
            },
          },
        },
      ],
    },
    include: {
      participants: {
        select: {
          workerId: true,
        },
      },
    },
  })

  return posts
}
