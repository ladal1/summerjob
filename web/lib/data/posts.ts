import prisma from 'lib/prisma/connection'
import { PostComplete, PostCreateData, PostUpdateData } from 'lib/types/post'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import { PhotoCreateData } from 'lib/types/photo'

export async function getPosts(): Promise<PostComplete[]> {
  const posts = await prisma.post.findMany({
    where: {
      forEvent: { isActive: true },
    },
    include: {
      participants: {
        select: {
          workerId: true,
        },
      },
    },
    orderBy: [
      {
        madeIn: 'asc',
      },
    ],
  })
  return posts
}

export async function getPostById(id: string): Promise<PostComplete | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const post = await prisma.post.findUnique({
    where: {
      id,
    },
    include: {
      participants: {
        select: {
          workerId: true,
        },
      },
    },
  })
  if (!post) {
    return null
  }
  return post
}

export async function getPostPhotoById(
  id: string
): Promise<PhotoCreateData | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const post = await prisma.post.findUnique({
    where: {
      id: id,
    },
    select: {
      photoPath: true,
    },
  })
  return post
}

export async function updatePost(id: string, postData: PostUpdateData) {
  const { participateChange, ...rest } = postData
  const post = await prisma.$transaction(async tx => {
    if (participateChange !== undefined && !participateChange.isEnrolled) {
      await tx.participant.delete({
        where: {
          workerId_postId: { workerId: participateChange.workerId, postId: id },
        },
      })
    }
    return await tx.post.update({
      where: {
        id,
      },
      data: {
        participants: {
          ...(participateChange?.isEnrolled && {
            create: {
              worker: {
                connect: {
                  id: participateChange.workerId,
                },
              },
            },
          }),
        },
        ...rest,
      },
    })
  })
  return post
}

export async function createPost(data: PostCreateData) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const post = await prisma.post.create({
    data: { ...data, forEventId: activeEventId },
  })
  return post
}

export async function deletePost(id: string) {
  await prisma.$transaction(async tx => {
    await tx.participant.deleteMany({
      where: {
        postId: id,
      },
    })
    await tx.post.delete({
      where: {
        id,
      },
    })
  })
}
