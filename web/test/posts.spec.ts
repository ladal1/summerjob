import chai, { expect } from 'chai'
import chaiExclude from 'chai-exclude'
import { api, createPostData, getFileNameAndType, Id } from './common'
import { statSync } from 'fs'
import path from 'path'

chai.use(chaiExclude)
chai.should()

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
        resp.status.should.equal(200)
      }
    })

    it('should not be accessible without permission', async function () {
      // given
      const perms = [Id.CARS, Id.WORKERS, Id.JOBS, Id.PLANS, '']
      for (const perm of perms) {
        // when
        const resp = await api.get('/api/posts', perm)
        // then
        resp.status.should.equal(403)
        resp.body.should.be.empty
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
      resp.status.should.equal(404)
    })

    it('creates a proposed post', async function () {
      // given
      const body = createPostData()
      // when
      const resp = await api.post('/api/posts', Id.POSTS, body)
      // then
      resp.status.should.equal(201)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
    })
  })

  it('returns a list of posts', async function () {
    // given
    const body = createPostData()
    await api.post('/api/posts', Id.POSTS, body)
    // when
    const resp = await api.get('/api/posts', Id.POSTS)
    // then
    resp.status.should.equal(200)
    resp.body.should.be.an('array')
    resp.body.should.have.lengthOf(1)
  })

  it('returns a proposed post by id', async function () {
    // given
    const body = createPostData()
    const post = await api.post('/api/posts', Id.POSTS, body)
    // when
    const resp = await api.get(`/api/posts/${post.body.id}`, Id.POSTS)
    // then
    resp.status.should.equal(200)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
    resp.body.id.should.equal(post.body.id)
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
    patch.status.should.equal(204)
    const resp = await api.get(`/api/posts/${selectedPost.id}`, Id.POSTS)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
    resp.body.tags.should.have.members(body.tags)
    resp.body.name.should.equal(body.name)
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
    patch.status.should.equal(400)
    const updatedPost = await api.get(`/api/posts/${selectedPost.id}`, Id.POSTS)
    // verify no changes were made
    expect(updatedPost.body).to.deep.equal(selectedPost)
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
    postsAfterAdding.body.should.have.lengthOf(
      postsBeforeAdding.body.length + 1
    )
    ;(postsAfterAdding.body as any[]).map(w => w.id).should.include(postId)
    // when
    // Delete the post
    const resp = await api.del(`/api/posts/${postId}`, Id.POSTS)
    // then
    resp.status.should.equal(204)
    // Check that the post was deleted
    const postsAfterRemoving = await api.get('/api/posts', Id.POSTS)
    postsAfterRemoving.body.should.have.lengthOf(postsBeforeAdding.body.length)
    ;(postsAfterRemoving.body as any[])
      .map(w => w.id)
      .should.not.include(postId)
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
      numOfFilesBef.should.equal(0)
      const resp = await api.post('/api/posts', Id.POSTS, body, [filePath])
      // then
      resp.status.should.equal(201)
      resp.body.should.be.an('object')
      // verify exitence of photo path
      resp.body.should.have.property('photoPath')
      resp.body.photoPath.should.not.be.empty
      const absolutePath = api.getAbsolutePath(resp.body.photoPath)
      api.pathExists(absolutePath).should.equal(true)
      // verify content by reading the image file
      const fileStat = statSync(filePath)
      const expectedSize = fileStat.size
      const fileStatUploaded = statSync(absolutePath)
      const uploadedSize = fileStatUploaded.size
      expectedSize.should.equal(uploadedSize)
      // verify naming of file
      const { fileName, fileType } = getFileNameAndType(resp.body.photoPath)
      fileName.should.equal(resp.body.id)
      fileType.should.equal('.ico')
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      numOfFiles.should.equal(1)
    })

    it('creates post with invalid photo file', async function () {
      // given
      const body = createPostData()
      const file = path.normalize(`${__dirname}/resources/invalidPhoto.ts`)
      // when
      const resp = await api.post('/api/posts', Id.POSTS, body, [file])
      // then
      resp.status.should.equal(400)
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      numOfFiles.should.equal(1) // one because prev test
    })

    it('creates post with too many photos', async function () {
      // given
      const body = createPostData()
      const file = path.normalize(`${__dirname}/resources/favicon.ico`)
      // when
      const resp = await api.post('/api/posts', Id.POSTS, body, [file, file])
      // then
      resp.status.should.equal(413)
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      numOfFiles.should.equal(1) // one because prev test
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
      numOfFilesBef.should.equal(1)
      const patch = await api.patch(
        `/api/posts/${selectedPost.body.id}`,
        Id.POSTS,
        {},
        [filePath]
      )
      // then
      patch.status.should.equal(204)
      const resp = await api.get(`/api/posts/${selectedPost.body.id}`, Id.POSTS)
      resp.body.should.be.an('object')
      // verify existence of photo path
      resp.body.should.have.property('photoPath')
      resp.body.photoPath.should.not.be.empty
      // verify content by reading the image file
      const absolutePath = api.getAbsolutePath(resp.body.photoPath)
      const fileStat = statSync(filePath)
      const expectedSize = fileStat.size
      const fileStatUploaded = statSync(absolutePath)
      const uploadedSize = fileStatUploaded.size
      expectedSize.should.equal(uploadedSize)
      // verify naming of file
      const { fileName, fileType } = getFileNameAndType(resp.body.photoPath)
      fileName.should.equal(resp.body.id)
      fileName.should.equal(selectedPost.body.id)
      fileType.should.equal('.png')
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      numOfFiles.should.equal(2) // this and other test before
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
      numOfFilesBef.should.equal(3)
      // when
      const patch = await api.patch(
        `/api/posts/${newPostRes.body.id}`,
        Id.POSTS,
        body
      )
      // then
      patch.status.should.equal(204)
      const resp = await api.get(`/api/posts/${newPostRes.body.id}`, Id.POSTS)
      resp.body.should.be.an('object')
      // verify emptiness of photo path
      resp.body.should.have.property('photoPath')
      resp.body.photoPath.should.be.empty
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      numOfFiles.should.equal(2)
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
      resp.status.should.equal(200)

      // verify content type
      resp.headers['content-type'].should.include('image')

      // verify content length
      resp.headers['content-length'].should.exist

      // verify cache control headers
      resp.headers['cache-control'].should.include('public')
      resp.headers['cache-control'].should.include('max-age=5')
      resp.headers['cache-control'].should.include('must-revalidate')

      // verify content by reading the image file
      const fileStat = statSync(file)
      const expectedSize = fileStat.size
      parseInt(resp.headers['content-length']).should.equal(expectedSize)
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
      resp.status.should.equal(404)
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
      numOfFilesBef.should.equal(4)
      // when
      const del = await api.del(`/api/posts/${newPostRes.body.id}`, Id.POSTS)
      // then
      del.status.should.equal(204)
      const resp = await api.get(`/api/posts/${newPostRes.body.id}`, Id.POSTS)
      resp.status.should.equal(404)
      // verify number of files in /posts folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/posts')
      )
      numOfFiles.should.equal(3)
    })
  })
  //#endregion
  this.afterAll(api.afterTestBlock)
})
