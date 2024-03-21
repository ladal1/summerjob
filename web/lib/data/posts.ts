import prisma from 'lib/prisma/connection'
import { PostComplete, PostCreateData, PostUpdateData } from 'lib/types/post'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'

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

export async function updatePost(id: string, postData: PostUpdateData) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  const post = await prisma.post.update({
    where: {
      id,
    },
    data: {
      ...postData,
    },
  })
  return post
}

export async function createPost(data: PostCreateData) {
  const post = await prisma.post.create({
    data: data,
  })
  return post
}
