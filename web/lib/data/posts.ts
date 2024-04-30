import { PrismaClient } from '@prisma/client'
import formidable from 'formidable'
import {
  deleteFile,
  getUploadDirForImagesForCurrentEvent,
  renameFile,
  updatePhotoPathByNewFilename,
} from 'lib/api/fileManager'
import { getPhotoPath } from 'lib/api/parse-form'
import prisma from 'lib/prisma/connection'
import { PostComplete, PostCreateData, PostUpdateData } from 'lib/types/post'
import { PrismaTransactionClient } from 'lib/types/prisma'
import { cache_getActiveSummerJobEventId } from './cache'
import { NoActiveEventError } from './internal-error'
import path from 'path'

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
        availability: 'asc',
      },
      {
        timeFrom: 'asc',
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
  id: string,
  prismaClient: PrismaClient | PrismaTransactionClient = prisma
): Promise<string | null> {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }
  const post = await prismaClient.post.findUnique({
    where: {
      id: id,
    },
    select: {
      photoPath: true,
    },
  })
  if (!post || !post.photoPath) {
    return null
  }
  const uploadDirAbsolutePath = await getUploadDirForImagesForCurrentEvent()
  return path.join(uploadDirAbsolutePath, post.photoPath)
}

export async function updatePost(
  id: string,
  postData: PostUpdateData,
  file: formidable.File | formidable.File[] | undefined = undefined
) {
  return await prisma.$transaction(async tx => {
    return await internal_updatePost(id, postData, file, tx)
  })
}

export async function internal_updatePost(
  id: string,
  postData: PostUpdateData,
  file: formidable.File | formidable.File[] | undefined = undefined,
  prismaClient: PrismaTransactionClient = prisma
) {
  const { participateChange, photoFileRemoved, ...rest } = postData
  if (participateChange !== undefined && !participateChange.isEnrolled) {
    await prismaClient.participant.delete({
      where: {
        workerId_postId: { workerId: participateChange.workerId, postId: id },
      },
    })
  }

  // Get photoPath from uploaded photoFile. If there was uploaded image for this post, it will be deleted.
  if (file) {
    const photoPath = getPhotoPath(file) // update photoPath
    const postPhotoPath = await getPostPhotoById(id, prismaClient)
    if (postPhotoPath && postPhotoPath !== photoPath) {
      // if original image exists and it is named differently (meaning it wasn't replaced already by parseFormWithImages) delete it
      await deleteFile(postPhotoPath) // delete original image if necessary
    }
    // Save only relative part of photoPath
    const uploadDirAbsolutePath = await getUploadDirForImagesForCurrentEvent()
    const relativePath = path.normalize(
      photoPath.substring(uploadDirAbsolutePath.length)
    )
    rest.photoPath = relativePath
  } else if (photoFileRemoved) {
    // If original file was deleted on client and was not replaced (it is not in files) file should be deleted.
    const postPhotoPath = await getPostPhotoById(id, prismaClient)
    if (postPhotoPath) {
      await deleteFile(postPhotoPath) // delete original image if necessary
    }
    rest.photoPath = ''
  }

  return await prismaClient.post.update({
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
}

export async function createPost(
  data: PostCreateData,
  file: formidable.File | formidable.File[] | undefined = undefined
) {
  const activeEventId = await cache_getActiveSummerJobEventId()
  if (!activeEventId) {
    throw new NoActiveEventError()
  }

  const post = await prisma.$transaction(async tx => {
    const post = await tx.post.create({
      data: { ...data, forEventId: activeEventId },
    })
    // Rename photo file and update post with new photo path to it.
    if (file) {
      const temporaryPhotoPath = getPhotoPath(file) // update photoPath
      const photoPath =
        updatePhotoPathByNewFilename(temporaryPhotoPath, post.id) ?? ''
      await renameFile(temporaryPhotoPath, photoPath)
      // Save only relative part of photoPath
      const uploadDirAbsolutePath = await getUploadDirForImagesForCurrentEvent()
      const relativePath = path.normalize(
        photoPath.substring(uploadDirAbsolutePath.length)
      )
      const updatedPost = await internal_updatePost(
        post.id,
        {
          photoPath: relativePath,
        },
        undefined,
        tx
      )
      return { ...post, ...updatedPost }
    }
    return post
  })

  return post
}

export async function deletePost(id: string) {
  await prisma.$transaction(async tx => {
    const postPhotoPath = await getPostPhotoById(id, tx)
    if (postPhotoPath) {
      await deleteFile(postPhotoPath) // delete original image if it exists
    }
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
