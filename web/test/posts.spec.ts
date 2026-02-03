/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, describe, expect, it } from 'vitest'
import {
  api,
  createPostData,
  getFileNameAndType,
  Id,
  isEmpty,
} from './common.js'
import { statSync } from 'fs'
import path from 'path'

describe('Posts', function () {
  //#region Access
  describe('#access', function () {
    it('should be accessible with permission', async function () {
      // given
      const perms = [Id.POSTS, Id.ADMIN]
      for (const perm of perms) {
        // when
        const resp = await api.get('/api/posts', perm)
        // then
        expect(resp.status).toBe(200)
      }
    })

    it('should not be accessible without permission', async function () {
      // given
      const perms = [Id.CARS, Id.WORKERS, Id.JOBS, Id.PLANS, '']
      for (const perm of perms) {
        // when
        const resp = await api.get('/api/posts', perm)
        // then
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('returns 404 when post does not exist', async function () {
      // when
      const resp = await api.get('/api/posts/1', Id.POSTS)
      // then
      expect(resp.status).toBe(404)
    })

    it('creates a proposed post', async function () {
      // given
      const body = createPostData()
      // when
      const resp = await api.post('/api/posts', Id.POSTS, body)
      // then
      expect(resp.status).toBe(201)
      expect(resp.body && typeof resp.body).toBe('object')
      expect(resp.body).toHaveProperty('id')
    })
  })

  it('returns a list of posts', async function () {
    // given
    const body = createPostData()
    await api.post('/api/posts', Id.POSTS, body)
    // when
    const resp = await api.get('/api/posts', Id.POSTS)
    // then
    expect(resp.status).toBe(200)
    expect(Array.isArray(resp.body)).toBe(true)
    expect(resp.body).toHaveLength(1)
  })

  it('returns a proposed post by id', async function () {
    // given
    const body = createPostData()
    const post = await api.post('/api/posts', Id.POSTS, body)
    // when
    const resp = await api.get(`/api/posts/${post.body.id}`, Id.POSTS)
    // then
    expect(resp.status).toBe(200)
    expect(resp.body && typeof resp.body).toBe('object')
    expect(resp.body).toHaveProperty('id')
    expect(resp.body.id).toBe(post.body.id)
  })

  it('updates a post', async function () {
    // given
    const posts = await api.get('/api/posts', Id.POSTS)
    const selectedPost = posts.body[0]
    const body = {
      tags: ['SPORTS'],
      name: 'new name',
    }
    // when
    const patch = await api.patch(
      `/api/posts/${selectedPost.id}`,
      Id.POSTS,
      body
    )
    // then
    expect(patch.status).toBe(204)
    const resp = await api.get(`/api/posts/${selectedPost.id}`, Id.POSTS)
    expect(resp.body && typeof resp.body).toBe('object')
    expect(resp.body).toHaveProperty('id')
    expect(resp.body.tags).toEqual(expect.arrayContaining(body.tags))
    expect(resp.body.name).toBe(body.name)
  })

  it("can't update a post - wrong parameter", async function () {
    // given
    const posts = await api.get('/api/posts', Id.POSTS)
    const selectedPost = posts.body[0]
    const body = {
      wrongParameter: 'test',
    }
    // when
    const patch = await api.patch(
      `/api/posts/${selectedPost.id}`,
      Id.POSTS,
      body
    )
    // then
    expect(patch.status).toBe(400)
    const updatedPost = await api.get(`/api/posts/${selectedPost.id}`, Id.POSTS)
    // verify no changes were made
    expect(updatedPost.body).toStrictEqual(selectedPost)
  })

  it('deletes a post', async function () {
    // given
    // Add a new post
    const postsBeforeAdding = await api.get('/api/posts', Id.POSTS)
    const body = createPostData()
    const post = await api.post('/api/posts', Id.POSTS, body)
    const postId = post.body.id
    // Check that the post was added
    const postsAfterAdding = await api.get('/api/posts', Id.POSTS)
    expect(postsAfterAdding.body).toHaveLength(
      postsBeforeAdding.body.length + 1
    )
    expect((postsAfterAdding.body as any[]).map(w => w.id)).toContain(postId)
    // when
    // Delete the post
    const resp = await api.del(`/api/posts/${postId}`, Id.POSTS)
    // then
    expect(resp.status).toBe(204)
    // Check that the post was deleted
    const postsAfterRemoving = await api.get('/api/posts', Id.POSTS)
    expect(postsAfterRemoving.body).toHaveLength(postsBeforeAdding.body.length)
    expect((postsAfterRemoving.body as any[]).map(w => w.id)).not.toContain(
      postId
    )
  })

  //#region Photo
  describe('#photo', () => {
    it('creates post with valid photo', async function () {
      // given
      const body = createPostData()
      const filePath = path.normalize(`${__dirname}/resources/favicon.ico`)
      // when
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFilesBef).toBe(0)
      const resp = await api.post('/api/posts', Id.POSTS, body, [filePath])
      // then
      expect(resp.status).toBe(201)
      expect(resp.body && typeof resp.body).toBe('object')
      // verify exitence of photo path
      expect(resp.body).toHaveProperty('photoPath')
      expect(resp.body.photoPath).not.toBe('')
      const absolutePath = api.getAbsolutePath(resp.body.photoPath)
      expect(api.pathExists(absolutePath)).toBe(true)
      // verify content by reading the image file
      const fileStat = statSync(filePath)
      const expectedSize = fileStat.size
      const fileStatUploaded = statSync(absolutePath)
      const uploadedSize = fileStatUploaded.size
      expect(expectedSize).toBe(uploadedSize)
      // verify naming of file
      const { fileName, fileType } = getFileNameAndType(resp.body.photoPath)
      expect(fileName).toBe(resp.body.id)
      expect(fileType).toBe('.ico')
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFiles).toBe(1)
    })

    it('creates post with invalid photo file', async function () {
      // given
      const body = createPostData()
      const file = path.normalize(`${__dirname}/resources/invalidPhoto.ts`)
      // when
      const resp = await api.post('/api/posts', Id.POSTS, body, [file])
      // then
      expect(resp.status).toBe(400)
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFiles).toBe(1) // one because prev test
    })

    it('creates post with too many photos', async function () {
      // given
      const body = createPostData()
      const file = path.normalize(`${__dirname}/resources/favicon.ico`)
      // when
      const resp = await api.post('/api/posts', Id.POSTS, body, [file, file])
      // then
      expect(resp.status).toBe(413)
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFiles).toBe(1) // one because prev test
    })

    it('update photo of post', async function () {
      // given
      const body = createPostData()
      const selectedPost = await api.post('/api/posts', Id.POSTS, body)
      const filePath = path.normalize(
        `${__dirname}/resources/logo-smj-yellow.png`
      )
      // when
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFilesBef).toBe(1)
      const patch = await api.patch(
        `/api/posts/${selectedPost.body.id}`,
        Id.POSTS,
        {},
        [filePath]
      )
      // then
      expect(patch.status).toBe(204)
      const resp = await api.get(`/api/posts/${selectedPost.body.id}`, Id.POSTS)
      expect(resp.body && typeof resp.body).toBe('object')
      // verify existence of photo path
      expect(resp.body).toHaveProperty('photoPath')
      expect(resp.body.photoPath).not.toBe('')
      // verify content by reading the image file
      const absolutePath = api.getAbsolutePath(resp.body.photoPath)
      const fileStat = statSync(filePath)
      const expectedSize = fileStat.size
      const fileStatUploaded = statSync(absolutePath)
      const uploadedSize = fileStatUploaded.size
      expect(expectedSize).toBe(uploadedSize)
      // verify naming of file
      const { fileName, fileType } = getFileNameAndType(resp.body.photoPath)
      expect(fileName).toBe(resp.body.id)
      expect(fileName).toBe(selectedPost.body.id)
      expect(fileType).toBe('.png')
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFiles).toBe(2) // this and other test before
    })

    it('remove photo of post', async function () {
      // given
      const bodyOfNewPost = createPostData()
      const fileOfNewPost = path.normalize(
        `${__dirname}/resources/logo-smj-yellow.png`
      )
      const newPostRes = await api.post('/api/posts', Id.POSTS, bodyOfNewPost, [
        fileOfNewPost,
      ])
      const body = {
        photoFileRemoved: true,
      }
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFilesBef).toBe(3)
      // when
      const patch = await api.patch(
        `/api/posts/${newPostRes.body.id}`,
        Id.POSTS,
        body
      )
      // then
      expect(patch.status).toBe(204)
      const resp = await api.get(`/api/posts/${newPostRes.body.id}`, Id.POSTS)
      expect(resp.body && typeof resp.body).toBe('object')
      // verify emptiness of photo path
      expect(resp.body).toHaveProperty('photoPath')
      expect(resp.body.photoPath).toBe('')
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFiles).toBe(2)
    })

    it("get post's photo", async function () {
      // given
      const body = createPostData()
      const file = path.normalize(`${__dirname}/resources/favicon.ico`)
      const createdPost = await api.post('/api/posts', Id.POSTS, body, [file])
      // when
      const resp = await api.get(
        `/api/posts/${createdPost.body.id}/photo`,
        Id.POSTS
      )
      // then
      // verify status code
      expect(resp.status).toBe(200)

      // verify content type
      expect(resp.headers['content-type']).toContain('image')

      // verify content length
      expect(resp.headers['content-length']).toBeDefined()

      // verify cache control headers
      expect(resp.headers['cache-control']).toContain('public')
      expect(resp.headers['cache-control']).toContain('max-age=5')
      expect(resp.headers['cache-control']).toContain('must-revalidate')

      // verify content by reading the image file
      const fileStat = statSync(file)
      const expectedSize = fileStat.size
      expect(parseInt(resp.headers['content-length'])).toBe(expectedSize)
    })

    it("return 404 if post doesn't have photo", async function () {
      // given
      const body = createPostData()
      const createdPost = await api.post('/api/posts', Id.POSTS, body)
      // when
      const resp = await api.get(
        `/api/posts/${createdPost.body.id}/photo`,
        Id.POSTS
      )
      // then
      expect(resp.status).toBe(404)
    })

    it('deletation of post will delete his photo', async function () {
      // given
      const bodyOfNewPost = createPostData()
      const fileOfNewPost = path.normalize(
        `${__dirname}/resources/logo-smj-yellow.png`
      )
      const newPostRes = await api.post('/api/posts', Id.POSTS, bodyOfNewPost, [
        fileOfNewPost,
      ])
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFilesBef).toBe(4)
      // when
      const del = await api.del(`/api/posts/${newPostRes.body.id}`, Id.POSTS)
      // then
      expect(del.status).toBe(204)
      const resp = await api.get(`/api/posts/${newPostRes.body.id}`, Id.POSTS)
      expect(resp.status).toBe(404)
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      expect(numOfFiles).toBe(3)
    })
  })
  //#endregion
  afterAll(api.afterTestBlock)
})
