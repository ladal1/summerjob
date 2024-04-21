import chai from 'chai'
import {
  Id,
  Tools,
  api,
  createProposedJobData,
  getFileNameAndType,
} from './common'
import { statSync } from 'fs'

chai.should()

describe('Proposed Jobs', function () {
  //#region Access
  describe('#access', function () {
    it('should be accessible with permission', async function () {
      // given
      const perms = [Id.JOBS, Id.ADMIN, Id.PLANS]
      for (const perm of perms) {
        // when
        const resp = await api.get('/api/proposed-jobs', perm)
        // then
        resp.status.should.equal(200)
      }
    })

    it('should not be accessible without permission', async function () {
      // given
      const perms = [Id.CARS, Id.WORKERS, Id.POSTS, '']
      for (const perm of perms) {
        // when
        const resp = await api.get('/api/proposed-jobs', perm)
        // then
        resp.status.should.equal(403)
        resp.body.should.be.empty
      }
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('returns 404 when proposed job does not exist', async function () {
      // when
      const resp = await api.get('/api/proposed-jobs/1', Id.JOBS)
      // then
      resp.status.should.equal(404)
    })

    it('creates a proposed job', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      // when
      const resp = await api.post('/api/proposed-jobs', Id.JOBS, body)
      // then
      resp.status.should.equal(201)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      // clean
      await api.deleteArea(area.id)
    })

    it('returns a list of proposedJobs', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const job = await api.post('/api/proposed-jobs', Id.JOBS, body)
      // when
      const resp = await api.get('/api/proposed-jobs', Id.JOBS)
      // then
      resp.status.should.equal(200)
      resp.body.should.be.an('array')
      resp.body.should.have.lengthOf(1)
      // clean
      await api.deleteArea(area.id)
    })

    it('returns a proposed job by id', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const job = await api.post('/api/proposed-jobs', Id.JOBS, body)
      // when
      const resp = await api.get(`/api/proposed-jobs/${job.body.id}`, Id.JOBS)
      // then
      resp.status.should.equal(200)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      // clean
      await api.deleteArea(area.id)
    })

    it('updates a proposed job', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const job = await api.post('/api/proposed-jobs', Id.JOBS, body)
      const selectedProposedJob = job.body

      const payload = {
        name: 'New job name',
      }
      // when
      const patch = await api.patch(
        `/api/proposed-jobs/${selectedProposedJob.id}`,
        Id.JOBS,
        payload
      )
      // then
      patch.status.should.equal(204)
      const resp = await api.get(
        `/api/proposed-jobs/${selectedProposedJob.id}`,
        Id.JOBS
      )
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      resp.body.name.should.equal(payload.name)
      // clean
      await api.deleteArea(area.id)
    })

    it("can't update a proposed-job - wrong parameter", async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const job = await api.post('/api/proposed-jobs', Id.JOBS, body)
      const selectedProposedJob = job.body
      const payload = {
        wrongParameter: 'New job name',
      }
      // when
      const patch = await api.patch(
        `/api/proposed-jobs/${selectedProposedJob.id}`,
        Id.JOBS,
        payload
      )
      // then
      patch.status.should.equal(400)
      // clean
      await api.deleteArea(area.id)
    })

    it('deletes a proposed job', async function () {
      // given
      const area = await api.createArea()
      // Add a new proposedJob
      const proposedJobsBeforeAdding = await api.get(
        '/api/proposed-jobs',
        Id.JOBS
      )
      const body = createProposedJobData(area.id)
      const proposedJob = await api.post('/api/proposed-jobs', Id.JOBS, body)
      const proposedJobId = proposedJob.body.id
      // Check that the proposed job was added
      const proposedJobsAfterAdding = await api.get(
        '/api/proposed-jobs',
        Id.JOBS
      )
      proposedJobsAfterAdding.body.should.have.lengthOf(
        proposedJobsBeforeAdding.body.length + 1
      )
      ;(proposedJobsAfterAdding.body as any[])
        .map(w => w.id)
        .should.include(proposedJobId)
      // when
      const resp = await api.del(`/api/proposed-jobs/${proposedJobId}`, Id.JOBS) // Delete the proposedJob
      resp.status.should.equal(204)
      // then
      // Check that the proposed job was deleted
      const proposedJobsAfterRemoving = await api.get(
        '/api/proposed-jobs',
        Id.JOBS
      )
      proposedJobsAfterRemoving.body.should.have.lengthOf(
        proposedJobsBeforeAdding.body.length
      )
      ;(proposedJobsAfterRemoving.body as any[])
        .map(w => w.id)
        .should.not.include(proposedJobId)
      // clean
      await api.deleteArea(area.id)
    })
  })
  //#endregion

  //#region Photos
  describe('#photos', function () {
    //#region Create
    describe('##create', function () {
      it('creates proposed-job with valid photo', async function () {
        // given
        const area = await api.createArea()
        const body = createProposedJobData(area.id)
        const file = `${__dirname}/resources/favicon.ico`
        // when
        const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [file])
        // then
        resp.status.should.equal(201)
        resp.body.should.be.an('object')
        resp.body.should.have.property('id')
        // verify existence of photos
        const proposedJob = await api.get(
          `/api/proposed-jobs/${resp.body.id}`,
          Id.JOBS
        )
        proposedJob.body.photos.should.be.an('array')
        proposedJob.body.photos.should.have.lengthOf(1)
        // verify naming of file
        const { fileName, fileType } = getFileNameAndType(
          proposedJob.body.photos.at(0).photoPath
        )
        fileName.should.equal(proposedJob.body.photos.at(0).id)
        fileType.should.equal('.ico')
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          api.getUploadDirForImagesForCurrentEvent() +
            `/proposed-jobs/${resp.body.id}`
        )
        numOfFiles.should.equal(1)
      })

      it('creates proposed-job with multiple valid photos', async function () {
        // given
        const area = await api.createArea()
        const body = createProposedJobData(area.id)
        const file0 = `${__dirname}/resources/logo-smj-yellow.png`
        const file1 = `${__dirname}/resources/favicon.ico`
        // when
        const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [
          file0,
          file1,
        ])
        // then
        resp.status.should.equal(201)
        resp.body.should.be.an('object')
        resp.body.should.have.property('id')
        const proposedJob = await api.get(
          `/api/proposed-jobs/${resp.body.id}`,
          Id.JOBS
        )
        // verify existence of photos
        proposedJob.body.photos.should.be.an('array')
        proposedJob.body.photos.should.have.lengthOf(2)
        proposedJob.body.photos.at(0).should.have.property('photoPath')
        // verify that uploaded photos should hold its order and should be named as {photoId}.{formerType}
        const { fileName: fileName0, fileType: fileType0 } = getFileNameAndType(
          proposedJob.body.photos.at(0).photoPath
        )
        fileName0.should.equal(proposedJob.body.photos.at(0).id)
        fileType0.should.equal('.png')

        const { fileName: fileName1, fileType: fileType1 } = getFileNameAndType(
          proposedJob.body.photos.at(1).photoPath
        )
        fileName1.should.equal(proposedJob.body.photos.at(1).id)
        fileType1.should.equal('.ico')
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          api.getUploadDirForImagesForCurrentEvent() +
            `/proposed-jobs/${resp.body.id}`
        )
        numOfFiles.should.equal(2)
      })

      it('creates proposed-job with invalid photo', async function () {
        // given
        const area = await api.createArea()
        const body = createProposedJobData(area.id)
        const file = `${__dirname}/resources/invalidPhoto.ts`
        // when
        const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [file])
        // then
        resp.status.should.equal(400)
        // verify non-existence of /proposed-jobs/{id} folder
        api
          .pathExists(
            api.getUploadDirForImagesForCurrentEvent() +
              `/proposed-jobs/${resp.body.id}`
          )
          .should.equal(false)
      })

      it('creates proposed-job with valid and one invalid photos', async function () {
        // given
        const area = await api.createArea()
        const body = createProposedJobData(area.id)
        const file0 = `${__dirname}/resources/logo-smj-yellow.png`
        const file1 = `${__dirname}/resources/invalidPhoto.ts`
        // when
        const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [
          file0,
          file1,
        ])
        // then
        resp.status.should.equal(400)
        // verify non-existence of /proposed-jobs/{id} folder
        api
          .pathExists(
            api.getUploadDirForImagesForCurrentEvent() +
              `/proposed-jobs/${resp.body.id}`
          )
          .should.equal(false)
      })
    })

    it('create proposed-job with too many photos', async function () {
      // given
      const file = `${__dirname}/resources/favicon.ico`
      const files: string[] = Array(11).fill(file)
      // when
      const created = await api.createProposedJobWithPhotos(files)
      // then
      created.status.should.equal(413)
    })

    //#endregion

    //#region Update
    describe('##update', function () {
      it('updates proposed-job with valid photo', async function () {
        // given
        const created = await api.createProposedJobWithPhotos([])
        created.status.should.equal(201)
        const file = `${__dirname}/resources/favicon.ico`
        // when
        const patch = await api.patch(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS,
          {},
          [file]
        )
        //then
        patch.status.should.equal(204)
        const proposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        proposedJob.body.photos.should.be.an('array')
        proposedJob.body.photos.should.have.lengthOf(1)
        // verify naming of file
        const { fileName, fileType } = getFileNameAndType(
          proposedJob.body.photos.at(0).photoPath
        )
        fileName.should.equal(proposedJob.body.photos.at(0).id)
        fileType.should.equal('.ico')
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          api.getUploadDirForImagesForCurrentEvent() +
            `/proposed-jobs/${created.body.id}`
        )
        numOfFiles.should.equal(1)
      })

      it('updates proposed-job with existing photos with valid photo', async function () {
        // given
        const created = await api.createProposedJobWithPhotos([
          `${__dirname}/resources/logo-smj-yellow.png`,
          `${__dirname}/resources/logo-smj-yellow.png`,
        ])
        created.status.should.equal(201)
        const file = `${__dirname}/resources/favicon.ico`
        // when
        const patch = await api.patch(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS,
          {},
          [file]
        )
        //then
        patch.status.should.equal(204)
        const proposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        proposedJob.body.photos.should.be.an('array')
        proposedJob.body.photos.should.have.lengthOf(3)
        // verify naming of file
        const { fileName, fileType } = getFileNameAndType(
          proposedJob.body.photos.at(2).photoPath
        )
        fileName.should.equal(proposedJob.body.photos.at(2).id)
        fileType.should.equal('.ico')
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          api.getUploadDirForImagesForCurrentEvent() +
            `/proposed-jobs/${created.body.id}`
        )
        numOfFiles.should.equal(3)
      })
    })

    it('updates proposed-job with multiple valid photos', async function () {
      // given
      const created = await api.createProposedJobWithPhotos([])
      created.status.should.equal(201)
      const file0 = `${__dirname}/resources/logo-smj-yellow.png`
      const file1 = `${__dirname}/resources/favicon.ico`
      // when
      const patch = await api.patch(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS,
        {},
        [file0, file1]
      )
      //then
      patch.status.should.equal(204)
      const proposedJob = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      proposedJob.body.photos.should.be.an('array')
      proposedJob.body.photos.should.have.lengthOf(2)
      // verify that uploaded photos should hold its order and should be named as {photoId}.{formerType}
      const { fileName: fileName0, fileType: fileType0 } = getFileNameAndType(
        proposedJob.body.photos.at(0).photoPath
      )
      fileName0.should.equal(proposedJob.body.photos.at(0).id)
      fileType0.should.equal('.png')

      const { fileName: fileName1, fileType: fileType1 } = getFileNameAndType(
        proposedJob.body.photos.at(1).photoPath
      )
      fileName1.should.equal(proposedJob.body.photos.at(1).id)
      fileType1.should.equal('.ico')

      // verify number of files in /proposed-jobs/{id} folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() +
          `/proposed-jobs/${created.body.id}`
      )
      numOfFiles.should.equal(2)
    })

    it('updates proposed-job with invalid photo', async function () {
      // given
      const created = await api.createProposedJobWithPhotos([])
      created.status.should.equal(201)
      const file = `${__dirname}/resources/invalidPhoto.ts`
      // when
      const patch = await api.patch(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS,
        {},
        [file]
      )
      //then
      patch.status.should.equal(400)
      // verify non-existence of /proposed-jobs/{id} folder
      api
        .pathExists(
          api.getUploadDirForImagesForCurrentEvent() +
            `/proposed-jobs/${created.body.id}`
        )
        .should.equal(false)
    })

    it('updates proposed-job including photo with invalid photo', async function () {
      // given
      const createdFile = `${__dirname}/resources/logo-smj-yellow.png`
      const created = await api.createProposedJobWithPhotos([createdFile])
      created.status.should.equal(201)
      const file = `${__dirname}/resources/invalidPhoto.ts`
      // when
      const patch = await api.patch(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS,
        {},
        [file]
      )
      //then
      patch.status.should.equal(400)
      // verify existence of /proposed-jobs/{id} folder
      api
        .pathExists(
          api.getUploadDirForImagesForCurrentEvent() +
            `/proposed-jobs/${created.body.id}`
        )
        .should.equal(true)

      const numOfFiles = await api.numberOfFilesInsideDirectory(
        api.getUploadDirForImagesForCurrentEvent() +
          `/proposed-jobs/${created.body.id}`
      )
      numOfFiles.should.equal(1)
    })
    //#endregion

    //#region Delete
    describe('##delete', function () {
      it("delete proposed-job's only photo", async function () {
        // given
        const created = await api.createProposedJobWithPhotos([
          `${__dirname}/resources/favicon.ico`,
        ])
        created.status.should.equal(201)
        const createdProposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        createdProposedJob.body.photos.should.be.an('array')
        createdProposedJob.body.photos.should.have.lengthOf(1)
        const photoId = createdProposedJob.body.photos.at(0).id
        const payload = {
          photoIdsDeleted: [photoId],
        }
        // when
        const resp = await api.patch(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS,
          payload
        )
        // then
        resp.body.should.be.an('object')
        const proposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        // verify exmpitness of photos
        proposedJob.body.photos.should.be.an('array')
        proposedJob.body.photos.should.have.lengthOf(0)
        // verify non-existence of /proposed-jobs/{id} folder
        api
          .pathExists(
            api.getUploadDirForImagesForCurrentEvent() +
              `/proposed-jobs/${resp.body.id}`
          )
          .should.equal(false)
      })

      it("delete proposed-job's non-only photo", async function () {
        // given
        const created = await api.createProposedJobWithPhotos([
          `${__dirname}/resources/favicon.ico`,
          `${__dirname}/resources/logo-smj-yellow.png`,
        ])
        created.status.should.equal(201)
        const createdProposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        createdProposedJob.body.photos.should.be.an('array')
        createdProposedJob.body.photos.should.have.lengthOf(2)
        const photoId = createdProposedJob.body.photos.at(0).id // delete ico file
        const payload = {
          photoIdsDeleted: [photoId],
        }
        // when
        const resp = await api.patch(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS,
          payload
        )
        // then
        resp.body.should.be.an('object')
        const proposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        // verify number of photos
        proposedJob.body.photos.should.be.an('array')
        proposedJob.body.photos.should.have.lengthOf(1)
        // verify naming of file
        const { fileName, fileType } = getFileNameAndType(
          proposedJob.body.photos.at(0).photoPath
        )
        fileName.should.equal(proposedJob.body.photos.at(0).id)
        fileType.should.equal('.png')
        // verify existence of /proposed-jobs/{id} folder
        api
          .pathExists(
            api.getUploadDirForImagesForCurrentEvent() +
              `/proposed-jobs/${created.body.id}`
          )
          .should.equal(true)
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          api.getUploadDirForImagesForCurrentEvent() +
            `/proposed-jobs/${created.body.id}`
        )
        numOfFiles.should.equal(1)
      })
    })
    //#endregion
  })

  it('deletation of proposed-job will delete all his photos and upload directory', async function () {
    // given
    const created = await api.createProposedJobWithPhotos([
      `${__dirname}/resources/favicon.ico`,
      `${__dirname}/resources/logo-smj-yellow.png`,
    ])
    created.status.should.equal(201)
    const createdProposedJob = await api.get(
      `/api/proposed-jobs/${created.body.id}`,
      Id.JOBS
    )
    createdProposedJob.body.photos.should.be.an('array')
    createdProposedJob.body.photos.should.have.lengthOf(2)
    // when
    const resp = await api.del(`/api/proposed-jobs/${created.body.id}`, Id.JOBS)
    // then
    resp.status.should.equal(204)
    // verify non-existence of /proposed-jobs/{id} folder
    const dir = api.getUploadDirForImagesForCurrentEvent()
    api
      .pathExists(dir + '/proposed-jobs/' + created.body.id)
      .should.equal(false)
    // verify of non-existence of each file
    createdProposedJob.body.photos.forEach(photo => {
      api.pathExists(dir + photo.photoPath).should.equal(false)
    })
  })

  //#region Get
  describe('##get', function () {
    it("get proposed-job's photo", async function () {
      //given
      const file = `${__dirname}/resources/favicon.ico`
      const created = await api.createProposedJobWithPhotos([file])
      created.status.should.equal(201)
      const createdProposedJob = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      createdProposedJob.body.photos.should.be.an('array')
      createdProposedJob.body.photos.should.have.lengthOf(1)
      createdProposedJob.body.photos.at(0).should.have.property('id')
      const photoId = createdProposedJob.body.photos.at(0).id
      // when
      const resp = await api.get(
        `/api/proposed-jobs/${created.body.id}/photos/${photoId}`,
        Id.JOBS
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

    it("returns 404 when proposed job's photo does not exist", async function () {
      // given
      const created = await api.createProposedJobWithPhotos([])
      // when
      const resp = await api.get(
        `/api/proposed-jobs/${created.body.id}/photos/invalid`,
        Id.JOBS
      )
      // then
      resp.status.should.equal(404)
    })
  })
  //#endregion

  //#region Tools
  describe('#tools', function () {
    it('create proposed-job with tools to take with', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const tool = { tool: Tools.AXE, amount: 5 }
      const payload = {
        ...body,
        toolsToTakeWith: { tools: [tool] },
      }
      // when
      const resp = await api.post('/api/proposed-jobs', Id.JOBS, payload)
      // then
      resp.status.should.equal(201)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      const get = await api.get(`/api/proposed-jobs/${resp.body.id}`, Id.JOBS)
      get.status.should.equal(200)
      get.body.should.be.an('object')
      get.body.should.have.property('toolsToTakeWith')
      get.body.toolsToTakeWith.should.be.an('array')
      get.body.toolsToTakeWith.should.have.lengthOf(1)
      get.body.toolsToTakeWith.at(0).should.be.an('object')
      get.body.toolsToTakeWith.at(0).should.have.property('tool')
      get.body.toolsToTakeWith.at(0).should.have.property('amount')
      get.body.toolsToTakeWith.at(0).tool.should.equal(tool.tool)
      get.body.toolsToTakeWith.at(0).amount.should.equal(tool.amount)
      // clean
      await api.deleteArea(area.id)
    })

    it('create proposed-job with invalid tool to take with', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const tool = { tool: 'NON_EXISTENT', amount: 5 }
      const payload = {
        ...body,
        toolsToTakeWith: { tools: [tool] },
      }
      const resp = await api.post('/api/proposed-jobs', Id.JOBS, payload)
      // then
      resp.status.should.equal(400)
      // clean
      await api.deleteArea(area.id)
    })

    it('update proposed-job tools to take with', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const tool = { tool: Tools.AXE, amount: 5 }
      const payload = {
        ...body,
        toolsToTakeWith: { tools: [tool] },
      }
      const created = await api.post('/api/proposed-jobs', Id.JOBS, payload)
      const getCreated = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      const toolUpload = {
        id: getCreated.body.toolsToTakeWith.at(0).id,
        tool: Tools.AXE,
        amount: 4,
      }
      const payloadUpload = {
        toolsToTakeWithUpdated: { tools: [toolUpload] },
      }
      // when
      const resp = await api.patch(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS,
        payloadUpload
      )
      // then
      resp.status.should.equal(204)
      const get = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      get.status.should.equal(200)
      get.body.should.be.an('object')
      get.body.should.have.property('toolsToTakeWith')
      get.body.toolsToTakeWith.should.be.an('array')
      get.body.toolsToTakeWith.should.have.lengthOf(1)
      get.body.toolsToTakeWith.at(0).should.be.an('object')
      get.body.toolsToTakeWith.at(0).should.have.property('tool')
      get.body.toolsToTakeWith.at(0).should.have.property('amount')
      get.body.toolsToTakeWith.at(0).tool.should.equal(toolUpload.tool)
      get.body.toolsToTakeWith.at(0).amount.should.equal(toolUpload.amount)
      // clean
      await api.deleteArea(area.id)
    })

    it('delete proposed-job tools to take with', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const tool = { tool: Tools.AXE, amount: 5 }
      const payload = {
        ...body,
        toolsToTakeWith: { tools: [tool] },
      }
      const created = await api.post('/api/proposed-jobs', Id.JOBS, payload)
      const getCreated = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      const payloadUpload = {
        toolsToTakeWithIdsDeleted: [getCreated.body.toolsToTakeWith.at(0).id],
      }
      // when
      const resp = await api.patch(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS,
        payloadUpload
      )
      // then
      resp.status.should.equal(204)
      const get = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      get.status.should.equal(200)
      get.body.should.be.an('object')
      get.body.should.have.property('toolsToTakeWith')
      get.body.toolsToTakeWith.should.be.an('array')
      get.body.toolsToTakeWith.should.have.lengthOf(0)
      // clean
      await api.deleteArea(area.id)
    })
  })
  //#endregion

  this.afterAll(api.afterTestBlock)
})

//#endregion
