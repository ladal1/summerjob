/* import { Id, api, createWorkerData, getFileNameAndType } from './common'
import chai, { expect } from 'chai'
import chaiExclude from 'chai-exclude'
import { statSync } from 'fs'

chai.use(chaiExclude)
chai.should()

describe('Workers', function () {
  //#region Access
  describe('#access', function () {
    it('should not be accessible without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      for (const perm of perms) {
        const resp = await api.get('/api/workers', perm)
        resp.status.should.equal(403)
        resp.body.should.be.empty
      }
    })

    it('should be accessible with permission', async function () {
      const perms = [Id.WORKERS, Id.ADMIN]
      for (const perm of perms) {
        const resp = await api.get('/api/workers', perm)
        resp.status.should.equal(200)
      }
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('returns 404 when worker does not exist', async function () {
      const resp = await api.get('/api/workers/1', Id.WORKERS)
      resp.status.should.equal(404)
    })

    it('creates a worker', async function () {
      const body = createWorkerData()
      const resp = await api.post('/api/workers/new', Id.WORKERS, body)
      resp.status.should.equal(201)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
    })

    it('creates multiple workers', async function () {
      const body = {
        workers: [createWorkerData(), createWorkerData(), createWorkerData()],
      }
      const resp = await api.post('/api/workers', Id.WORKERS, body)
      resp.status.should.equal(201)
      resp.body.should.be.an('array')
      resp.body.should.have.lengthOf(3)
    })

    it('returns a list of workers', async function () {
      const resp = await api.get('/api/workers', Id.WORKERS)
      resp.status.should.equal(200)
      resp.body.should.be.an('array')
      // admin + 1 worker created in previous test + 3 workers created in previous test
      resp.body.should.have.lengthOf(5)
    })

    it('returns a worker by id', async function () {
      const workers = await api.get('/api/workers', Id.WORKERS)
      const selectedWorker = workers.body[0]
      const resp = await api.get(
        `/api/workers/${selectedWorker.id}`,
        Id.WORKERS
      )
      resp.status.should.equal(200)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      resp.body.should.be.deep.equal(selectedWorker)
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
      patch.status.should.equal(204)
      const resp = await api.get(
        `/api/workers/${selectedWorker.id}`,
        Id.WORKERS
      )
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      resp.body.firstName.should.equal(body.firstName)
      resp.body.phone.should.equal(body.phone)
      expect(resp.body)
        .excluding(['firstName', 'phone'])
        .to.deep.equal(selectedWorker)
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
      patch.status.should.equal(400)
    })

    it('deletes a worker', async function () {
      // Add a new worker
      const workersBeforeAdding = await api.get('/api/workers', Id.WORKERS)
      const body = createWorkerData()
      const worker = await api.post('/api/workers/new', Id.WORKERS, body)
      const workerId = worker.body.id
      // Check that the worker was added
      const workersAfterAdding = await api.get('/api/workers', Id.WORKERS)
      workersAfterAdding.body.should.have.lengthOf(
        workersBeforeAdding.body.length + 1
      )
      ;(workersAfterAdding.body as any[])
        .map(w => w.id)
        .should.include(workerId)
      // Delete the worker
      const resp = await api.del(`/api/workers/${workerId}`, Id.WORKERS)
      resp.status.should.equal(204)
      // Check that the worker was deleted
      const workersAfterRemoving = await api.get('/api/workers', Id.WORKERS)
      // admin + 1 worker created in previous test + 3 workers created in previous test - 1 deleted worker
      workersAfterRemoving.body.should.have.lengthOf(
        workersBeforeAdding.body.length
      )
      ;(workersAfterRemoving.body as any[])
        .map(w => w.id)
        .should.not.include(workerId)
    })
  })
  //#endregion

  //#region Photo
  describe('#photo', () => {
    it('creates worker with valid photo', async function () {
      // given
      const body = createWorkerData()
      const filePath = `${__dirname}/resources/favicon.ico`
      // when
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFilesBef.should.equal(0)
      const resp = await api.post('/api/workers/new', Id.WORKERS, body, [
        filePath,
      ])
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
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFiles.should.equal(1)
    })

    it('creates worker with invalid photo file', async function () {
      // given
      const body = createWorkerData()
      const file = `${__dirname}/resources/invalidPhoto.ts`
      // when
      const resp = await api.post('/api/workers/new', Id.WORKERS, body, [file])
      // then
      resp.status.should.equal(400)
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFiles.should.equal(1) // one because prev test
    })

    it('creates worker with too many photos', async function () {
      // given
      const body = createWorkerData()
      const file = `${__dirname}/resources/favicon.ico`
      // when
      const resp = await api.post('/api/workers/new', Id.WORKERS, body, [
        file,
        file,
      ])
      // then
      resp.status.should.equal(413)
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFiles.should.equal(1) // one because prev test
    })

    it('update photo of worker', async function () {
      // given
      const body = createWorkerData()
      const selectedWorker = await api.post(
        '/api/workers/new',
        Id.WORKERS,
        body
      )
      const filePath = `${__dirname}/resources/logo-smj-yellow.png`
      // when
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFilesBef.should.equal(1)
      const patch = await api.patch(
        `/api/workers/${selectedWorker.body.id}`,
        Id.WORKERS,
        {},
        [filePath]
      )
      // then
      patch.status.should.equal(204)
      const resp = await api.get(
        `/api/workers/${selectedWorker.body.id}`,
        Id.WORKERS
      )
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
      fileName.should.equal(selectedWorker.body.id)
      fileType.should.equal('.png')
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFiles.should.equal(2) // this and other test before
    })

    it('remove photo of worker', async function () {
      // given
      const bodyOfNewWorker = createWorkerData()
      const fileOfNewWorker = `${__dirname}/resources/logo-smj-yellow.png`
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
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFilesBef.should.equal(3)
      const patch = await api.patch(
        `/api/workers/${newWorkerRes.body.id}`,
        Id.WORKERS,
        body
      )
      // then
      patch.status.should.equal(204)
      const resp = await api.get(
        `/api/workers/${newWorkerRes.body.id}`,
        Id.WORKERS
      )
      resp.body.should.be.an('object')
      // verify emptiness of photo path
      resp.body.should.have.property('photoPath')
      resp.body.photoPath.should.be.empty
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFiles.should.equal(2)
    })

    it("get worker's photo", async function () {
      // given
      const body = createWorkerData()
      const file = `${__dirname}/resources/favicon.ico`
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
      const fileStat = statSync(`${__dirname}/resources/favicon.ico`)
      const expectedSize = fileStat.size
      parseInt(resp.headers['content-length']).should.equal(expectedSize)
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
      resp.status.should.equal(404)
    })

    it('deletation of worker will delete his photo', async function () {
      // given
      const body = createWorkerData()
      const fileOfNewWorker = `${__dirname}/resources/logo-smj-yellow.png`
      const newWorkerRes = await api.post(
        '/api/workers/new',
        Id.WORKERS,
        body,
        [fileOfNewWorker]
      )
      const numOfFilesBef = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFilesBef.should.equal(4)
      // when
      const del = await api.del(
        `/api/workers/${newWorkerRes.body.id}`,
        Id.WORKERS
      )
      // then
      del.status.should.equal(204)
      const resp = await api.get(
        `/api/workers/${newWorkerRes.body.id}`,
        Id.WORKERS
      )
      resp.status.should.equal(404)
      // verify number of files in /workers folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() + '/workers'
      )
      numOfFiles.should.equal(3)
    })
  })
  //#endregion

  this.afterAll(api.afterTestBlock)
})
 */
