/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, describe, expect, it } from 'vitest'
import {
  Id,
  api,
  createWorkerData,
  getFileNameAndType,
  isEmpty,
} from './common.js'
import { statSync } from 'fs'
import path from 'path'

describe('Workers', function () {
  //#region Access
  describe('#access', function () {
    it('should not be accessible without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      for (const perm of perms) {
        const resp = await api.get('/api/workers', perm)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }
    })

    it('should be accessible with permission', async function () {
      const perms = [Id.WORKERS, Id.ADMIN]
      for (const perm of perms) {
        const resp = await api.get('/api/workers', perm)
        expect(resp.status).toBe(200)
      }
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('returns 404 when worker does not exist', async function () {
      const resp = await api.get('/api/workers/1', Id.WORKERS)
      expect(resp.status).toBe(404)
    })

    it('creates a worker', async function () {
      const body = createWorkerData()
      const resp = await api.post('/api/workers/new', Id.WORKERS, body)
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
    })

    it('creates multiple workers', async function () {
      const body = {
        workers: [createWorkerData(), createWorkerData(), createWorkerData()],
      }
      const resp = await api.post('/api/workers', Id.WORKERS, body)
      expect(resp.status).toBe(201)
      expect(Array.isArray(resp.body)).toBe(true)
      expect(resp.body).toHaveLength(3)
    })

    it('returns a list of workers', async function () {
      const resp = await api.get('/api/workers', Id.WORKERS)
      expect(resp.status).toBe(200)
      expect(Array.isArray(resp.body)).toBe(true)
      // admin + 1 worker created in previous test + 3 workers created in previous test
      expect(resp.body).toHaveLength(5)
    })

    it('returns a worker by id', async function () {
      const workers = await api.get('/api/workers', Id.WORKERS)
      const selectedWorker = workers.body[0]
      const resp = await api.get(
        `/api/workers/${selectedWorker.id}`,
        Id.WORKERS
      )
      expect(resp.status).toBe(200)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body).toEqual(selectedWorker)
    })

    it('updates a worker', async function () {
      const workers = await api.get('/api/workers', Id.WORKERS)
      const selectedWorker = workers.body[0]

      const body = {
        firstName: 'Jane',
        phone: '000111222',
      }
      const patch = await api.patch(
        `/api/workers/${selectedWorker.id}`,
        Id.WORKERS,
        body
      )
      expect(patch.status).toBe(204)
      const resp = await api.get(
        `/api/workers/${selectedWorker.id}`,
        Id.WORKERS
      )
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body.firstName).toBe(body.firstName)
      expect(resp.body.phone).toBe(body.phone)
    })

    it("can't update a worker - wrong parameter", async function () {
      const workers = await api.get('/api/workers', Id.WORKERS)
      const selectedWorker = workers.body[0]

      const body = {
        wrongParameter: 'Jane',
      }
      const patch = await api.patch(
        `/api/workers/${selectedWorker.id}`,
        Id.WORKERS,
        body
      )
      expect(patch.status).toBe(400)
    })

    it('deletes a worker', async function () {
      // Add a new worker
      const workersBeforeAdding = await api.get('/api/workers', Id.WORKERS)
      const body = createWorkerData()
      const worker = await api.post('/api/workers/new', Id.WORKERS, body)
      const workerId = worker.body.id
      // Check that the worker was added
      const workersAfterAdding = await api.get('/api/workers', Id.WORKERS)
      expect(workersAfterAdding.body).toHaveLength(
        workersBeforeAdding.body.length + 1
      )
      expect((workersAfterAdding.body as any[]).map(w => w.id)).toContain(
        workerId
      )
      // Delete the worker
      const resp = await api.del(`/api/workers/${workerId}`, Id.WORKERS)
      expect(resp.status).toBe(204)
      // Check that the worker was deleted
      const workersAfterRemoving = await api.get('/api/workers', Id.WORKERS)
      // admin + 1 worker created in previous test + 3 workers created in previous test - 1 deleted worker
      expect(workersAfterRemoving.body).toHaveLength(
        workersBeforeAdding.body.length
      )
      expect((workersAfterRemoving.body as any[]).map(w => w.id)).not.toContain(
        workerId
      )
    })
  })
  //#endregion

  //#region Photo
  describe('#photo', () => {
    it('creates worker with valid photo', async function () {
      // given
      const body = createWorkerData()
      const filePath = path.normalize(`${__dirname}/resources/favicon.ico`)
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent() + '/workers')
      )
      expect(numOfFilesBef).toBe(0)
      // when
      const resp = await api.post('/api/workers/new', Id.WORKERS, body, [
        filePath,
      ])
      // then
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
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
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFiles).toBe(1)
    })

    it('creates worker with invalid photo file', async function () {
      // given
      const body = createWorkerData()
      const file = path.normalize(`${__dirname}/resources/invalidPhoto.ts`)
      // when
      const resp = await api.post('/api/workers/new', Id.WORKERS, body, [file])
      // then
      expect(resp.status).toBe(400)
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFiles).toBe(1) // one because prev test
    })

    it('creates worker with too many photos', async function () {
      // given
      const body = createWorkerData()
      const file = path.normalize(`${__dirname}/resources/favicon.ico`)
      // when
      const resp = await api.post('/api/workers/new', Id.WORKERS, body, [
        file,
        file,
      ])
      // then
      expect(resp.status).toBe(413)
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFiles).toBe(1) // one because prev test
    })

    it('update photo of worker', async function () {
      // given
      const body = createWorkerData()
      const selectedWorker = await api.post(
        '/api/workers/new',
        Id.WORKERS,
        body
      )
      const filePath = path.normalize(
        `${__dirname}/resources/logo-smj-yellow.png`
      )
      // when
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFilesBef).toBe(1)
      const patch = await api.patch(
        `/api/workers/${selectedWorker.body.id}`,
        Id.WORKERS,
        {},
        [filePath]
      )
      // then
      expect(patch.status).toBe(204)
      const resp = await api.get(
        `/api/workers/${selectedWorker.body.id}`,
        Id.WORKERS
      )
      expect(resp.body).toBeTypeOf('object')
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
      expect(fileName).toBe(selectedWorker.body.id)
      expect(fileType).toBe('.png')
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFiles).toBe(2) // this and other test before
    })

    it('remove photo of worker', async function () {
      // given
      const bodyOfNewWorker = createWorkerData()
      const fileOfNewWorker = path.normalize(
        `${__dirname}/resources/logo-smj-yellow.png`
      )
      const newWorkerRes = await api.post(
        '/api/workers/new',
        Id.WORKERS,
        bodyOfNewWorker,
        [fileOfNewWorker]
      )
      const body = {
        photoFileRemoved: true,
      }
      // when
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFilesBef).toBe(3)
      const patch = await api.patch(
        `/api/workers/${newWorkerRes.body.id}`,
        Id.WORKERS,
        body
      )
      // then
      expect(patch.status).toBe(204)
      const resp = await api.get(
        `/api/workers/${newWorkerRes.body.id}`,
        Id.WORKERS
      )
      expect(resp.body).toBeTypeOf('object')
      // verify emptiness of photo path
      expect(resp.body).toHaveProperty('photoPath')
      expect(resp.body.photoPath).toBe('')
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFiles).toBe(2)
    })

    it("get worker's photo", async function () {
      // given
      const body = createWorkerData()
      const file = path.normalize(`${__dirname}/resources/favicon.ico`)
      const createdWorker = await api.post(
        '/api/workers/new',
        Id.WORKERS,
        body,
        [file]
      )
      // when
      const resp = await api.get(
        `/api/workers/${createdWorker.body.id}/photo`,
        Id.WORKERS
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

    it("return 404 if worker doesn't have photo", async function () {
      // given
      const body = createWorkerData()
      const createdWorker = await api.post('/api/workers/new', Id.WORKERS, body)
      // when
      const resp = await api.get(
        `/api/workers/${createdWorker.body.id}/photo`,
        Id.WORKERS
      )
      // then
      expect(resp.status).toBe(404)
    })

    it('deletation of worker will delete his photo', async function () {
      // given
      const body = createWorkerData()
      const fileOfNewWorker = path.normalize(
        `${__dirname}/resources/logo-smj-yellow.png`
      )
      const newWorkerRes = await api.post(
        '/api/workers/new',
        Id.WORKERS,
        body,
        [fileOfNewWorker]
      )
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFilesBef).toBe(4)
      // when
      const del = await api.del(
        `/api/workers/${newWorkerRes.body.id}`,
        Id.WORKERS
      )
      // then
      expect(del.status).toBe(204)
      const resp = await api.get(
        `/api/workers/${newWorkerRes.body.id}`,
        Id.WORKERS
      )
      expect(resp.status).toBe(404)
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(api.getUploadDirForImagesForCurrentEvent(), '/workers')
      )
      expect(numOfFiles).toBe(3)
    })
  })
  //#endregion

  afterAll(api.afterTestBlock)
})
