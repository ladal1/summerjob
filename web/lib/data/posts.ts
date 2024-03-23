import prisma from 'lib/prisma/connection'
import { PostComplete, PostCreateData, PostUpdateData } from 'lib/types/post'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import { PhotoCreateData } from 'lib/types/photo'

export async function getPosts(): Promise<PostComplete[]> {
  const posts = await prisma.post.findMany({
    include: {},
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
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  const post = await prisma.post.update({
    where: {
      id,
    },
    data: postData,
  })
  return post
}

export async function createPost(data: PostCreateData) {
  const post = await prisma.post.create({
    data: data,
  })
  return post
}

export async function deletePost(id: string) {
  await prisma.post.delete({
    where: {
      id,
    },
  })
}
