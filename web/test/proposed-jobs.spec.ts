/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, describe, expect, it } from 'vitest'
import {
  Id,
  Tools,
  api,
  createProposedJobData,
  getFileNameAndType,
  isEmpty,
} from './common.js'
import { statSync } from 'fs'
import path from 'path'

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
        expect(resp.status).toBe(200)
      }
    })

    it('should not be accessible without permission', async function () {
      // given
      const perms = [Id.CARS, Id.WORKERS, Id.POSTS, '']
      for (const perm of perms) {
        // when
        const resp = await api.get('/api/proposed-jobs', perm)
        // then
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
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
      expect(resp.status).toBe(404)
    })

    it('creates a proposed job', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      // when
      const resp = await api.post('/api/proposed-jobs', Id.JOBS, body)
      // then
      expect(resp.status).toBe(201)
      expect(resp.body && typeof resp.body).toBe('object')
      expect(resp.body).toHaveProperty('id')
      // clean
      await api.deleteArea(area.id)
    })

    it('returns a list of proposedJobs', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      await api.post('/api/proposed-jobs', Id.JOBS, body)
      // when
      const resp = await api.get('/api/proposed-jobs', Id.JOBS)
      // then
      expect(resp.status).toBe(200)
      expect(Array.isArray(resp.body)).toBe(true)
      expect(resp.body).toHaveLength(1)
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
      expect(resp.status).toBe(200)
      expect(resp.body && typeof resp.body).toBe('object')
      expect(resp.body).toHaveProperty('id')
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
      expect(patch.status).toBe(204)
      const resp = await api.get(
        `/api/proposed-jobs/${selectedProposedJob.id}`,
        Id.JOBS
      )
      expect(resp.body && typeof resp.body).toBe('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body.name).toBe(payload.name)
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
      expect(patch.status).toBe(400)
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
      expect(proposedJobsAfterAdding.body).toHaveLength(
        proposedJobsBeforeAdding.body.length + 1
      )
      expect((proposedJobsAfterAdding.body as any[]).map(w => w.id)).toContain(
        proposedJobId
      )
      // when
      const resp = await api.del(`/api/proposed-jobs/${proposedJobId}`, Id.JOBS) // Delete the proposedJob
      expect(resp.status).toBe(204)
      // then
      // Check that the proposed job was deleted
      const proposedJobsAfterRemoving = await api.get(
        '/api/proposed-jobs',
        Id.JOBS
      )
      expect(proposedJobsAfterRemoving.body).toHaveLength(
        proposedJobsBeforeAdding.body.length
      )
      expect(
        (proposedJobsAfterRemoving.body as any[]).map(w => w.id)
      ).not.toContain(proposedJobId)
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
        const file = path.normalize(`${__dirname}/resources/favicon.ico`)
        // when
        const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [file])
        // then
        expect(resp.status).toBe(201)
        expect(resp.body && typeof resp.body).toBe('object')
        expect(resp.body).toHaveProperty('id')
        // verify existence of photos
        const proposedJob = await api.get(
          `/api/proposed-jobs/${resp.body.id}`,
          Id.JOBS
        )
        expect(Array.isArray(proposedJob.body.photos)).toBe(true)
        expect(proposedJob.body.photos).toHaveLength(1)
        // verify naming of file
        const { fileName, fileType } = getFileNameAndType(
          proposedJob.body.photos.at(0).photoPath
        )
        expect(fileName).toBe(proposedJob.body.photos.at(0).id)
        expect(fileType).toBe('.ico')
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          path.join(
            api.getUploadDirForImagesForCurrentEvent(),
            `/proposed-jobs/${resp.body.id}`
          )
        )
        expect(numOfFiles).toBe(1)
      })

      it('creates proposed-job with multiple valid photos', async function () {
        // given
        const area = await api.createArea()
        const body = createProposedJobData(area.id)
        const file0 = path.normalize(
          `${__dirname}/resources/logo-smj-yellow.png`
        )
        const file1 = path.normalize(`${__dirname}/resources/favicon.ico`)
        // when
        const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [
          file0,
          file1,
        ])
        // then
        expect(resp.status).toBe(201)
        expect(resp.body && typeof resp.body).toBe('object')
        expect(resp.body).toHaveProperty('id')
        const proposedJob = await api.get(
          `/api/proposed-jobs/${resp.body.id}`,
          Id.JOBS
        )
        // verify existence of photos
        expect(Array.isArray(proposedJob.body.photos)).toBe(true)
        expect(proposedJob.body.photos).toHaveLength(2)
        expect(proposedJob.body.photos.at(0)).toHaveProperty('photoPath')
        // verify that uploaded photos should hold its order and should be named as {photoId}.{formerType}
        const { fileName: fileName0, fileType: fileType0 } = getFileNameAndType(
          proposedJob.body.photos.at(0).photoPath
        )
        expect(fileName0).toBe(proposedJob.body.photos.at(0).id)
        expect(fileType0).toBe('.png')

        const { fileName: fileName1, fileType: fileType1 } = getFileNameAndType(
          proposedJob.body.photos.at(1).photoPath
        )
        expect(fileName1).toBe(proposedJob.body.photos.at(1).id)
        expect(fileType1).toBe('.ico')
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          path.join(
            api.getUploadDirForImagesForCurrentEvent(),
            `/proposed-jobs/${resp.body.id}`
          )
        )
        expect(numOfFiles).toBe(2)
      })

      it('creates proposed-job with invalid photo', async function () {
        // given
        const area = await api.createArea()
        const body = createProposedJobData(area.id)
        const file = path.normalize(`${__dirname}/resources/invalidPhoto.ts`)
        // when
        const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [file])
        // then
        expect(resp.status).toBe(400)
        // verify non-existence of /proposed-jobs/{id} folder
        expect(
          api.pathExists(
            path.join(
              api.getUploadDirForImagesForCurrentEvent(),
              `/proposed-jobs/${resp.body.id}`
            )
          )
        ).toBe(false)
      })

      it('creates proposed-job with valid and one invalid photos', async function () {
        // given
        const area = await api.createArea()
        const body = createProposedJobData(area.id)
        const file0 = path.normalize(
          `${__dirname}/resources/logo-smj-yellow.png`
        )
        const file1 = path.normalize(`${__dirname}/resources/invalidPhoto.ts`)
        // when
        const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [
          file0,
          file1,
        ])
        // then
        expect(resp.status).toBe(400)
        // verify non-existence of /proposed-jobs/{id} folder
        expect(
          api.pathExists(
            path.join(
              api.getUploadDirForImagesForCurrentEvent(),
              `/proposed-jobs/${resp.body.id}`
            )
          )
        ).toBe(false)
      })
    })

    it('create proposed-job with too many photos', async function () {
      // given
      const file = path.normalize(`${__dirname}/resources/favicon.ico`)
      const files: string[] = Array(11).fill(file)
      // when
      const created = await api.createProposedJobWithPhotos(files)
      // then
      expect(created.status).toBe(413)
    })

    //#endregion

    //#region Update
    describe('##update', function () {
      it('updates proposed-job with valid photo', async function () {
        // given
        const created = await api.createProposedJobWithPhotos([])
        expect(created.status).toBe(201)
        const file = path.normalize(`${__dirname}/resources/favicon.ico`)
        // when
        const patch = await api.patch(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS,
          {},
          [file]
        )
        //then
        expect(patch.status).toBe(204)
        const proposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        expect(Array.isArray(proposedJob.body.photos)).toBe(true)
        expect(proposedJob.body.photos).toHaveLength(1)
        // verify naming of file
        const { fileName, fileType } = getFileNameAndType(
          proposedJob.body.photos.at(0).photoPath
        )
        expect(fileName).toBe(proposedJob.body.photos.at(0).id)
        expect(fileType).toBe('.ico')
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          path.join(
            api.getUploadDirForImagesForCurrentEvent(),
            `/proposed-jobs/${created.body.id}`
          )
        )
        expect(numOfFiles).toBe(1)
      })

      it('updates proposed-job with existing photos with valid photo', async function () {
        // given
        const created = await api.createProposedJobWithPhotos([
          path.normalize(`${__dirname}/resources/logo-smj-yellow.png`),
          path.normalize(`${__dirname}/resources/logo-smj-yellow.png`),
        ])
        expect(created.status).toBe(201)
        const file = path.normalize(`${__dirname}/resources/favicon.ico`)
        // when
        const patch = await api.patch(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS,
          {},
          [file]
        )
        //then
        expect(patch.status).toBe(204)
        const proposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        expect(Array.isArray(proposedJob.body.photos)).toBe(true)
        expect(proposedJob.body.photos).toHaveLength(3)
        // verify naming of file
        const { fileName, fileType } = getFileNameAndType(
          proposedJob.body.photos.at(2).photoPath
        )
        expect(fileName).toBe(proposedJob.body.photos.at(2).id)
        expect(fileType).toBe('.ico')
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          path.join(
            api.getUploadDirForImagesForCurrentEvent(),
            `/proposed-jobs/${created.body.id}`
          )
        )
        expect(numOfFiles).toBe(3)
      })
    })

    it('updates proposed-job with multiple valid photos', async function () {
      // given
      const created = await api.createProposedJobWithPhotos([])
      expect(created.status).toBe(201)
      const file0 = path.normalize(`${__dirname}/resources/logo-smj-yellow.png`)
      const file1 = path.normalize(`${__dirname}/resources/favicon.ico`)
      // when
      const patch = await api.patch(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS,
        {},
        [file0, file1]
      )
      //then
      expect(patch.status).toBe(204)
      const proposedJob = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      expect(Array.isArray(proposedJob.body.photos)).toBe(true)
      expect(proposedJob.body.photos).toHaveLength(2)
      // verify that uploaded photos should hold its order and should be named as {photoId}.{formerType}
      const { fileName: fileName0, fileType: fileType0 } = getFileNameAndType(
        proposedJob.body.photos.at(0).photoPath
      )
      expect(fileName0).toBe(proposedJob.body.photos.at(0).id)
      expect(fileType0).toBe('.png')

      const { fileName: fileName1, fileType: fileType1 } = getFileNameAndType(
        proposedJob.body.photos.at(1).photoPath
      )
      expect(fileName1).toBe(proposedJob.body.photos.at(1).id)
      expect(fileType1).toBe('.ico')

      // verify number of files in /proposed-jobs/{id} folder
      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(
          api.getUploadDirForImagesForCurrentEvent(),
          `/proposed-jobs/${created.body.id}`
        )
      )
      expect(numOfFiles).toBe(2)
    })

    it('updates proposed-job with invalid photo', async function () {
      // given
      const created = await api.createProposedJobWithPhotos([])
      expect(created.status).toBe(201)
      const file = path.normalize(`${__dirname}/resources/invalidPhoto.ts`)
      // when
      const patch = await api.patch(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS,
        {},
        [file]
      )
      //then
      expect(patch.status).toBe(400)
      // verify non-existence of /proposed-jobs/{id} folder
      expect(
        api.pathExists(
          path.join(
            api.getUploadDirForImagesForCurrentEvent(),
            `/proposed-jobs/${created.body.id}`
          )
        )
      ).toBe(false)
    })

    it('updates proposed-job including photo with invalid photo', async function () {
      // given
      const createdFile = path.normalize(
        `${__dirname}/resources/logo-smj-yellow.png`
      )
      const created = await api.createProposedJobWithPhotos([createdFile])
      expect(created.status).toBe(201)
      const file = path.normalize(`${__dirname}/resources/invalidPhoto.ts`)
      // when
      const patch = await api.patch(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS,
        {},
        [file]
      )
      //then
      expect(patch.status).toBe(400)
      // verify existence of /proposed-jobs/{id} folder
      expect(
        api.pathExists(
          path.join(
            api.getUploadDirForImagesForCurrentEvent(),
            `/proposed-jobs/${created.body.id}`
          )
        )
      ).toBe(true)

      const numOfFiles = await api.numberOfFilesInsideDirectory(
        path.join(
          api.getUploadDirForImagesForCurrentEvent(),
          `/proposed-jobs/${created.body.id}`
        )
      )
      expect(numOfFiles).toBe(1)
    })
    //#endregion

    //#region Delete
    describe('##delete', function () {
      it("delete proposed-job's only photo", async function () {
        // given
        const created = await api.createProposedJobWithPhotos([
          path.normalize(`${__dirname}/resources/favicon.ico`),
        ])
        expect(created.status).toBe(201)
        const createdProposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        expect(Array.isArray(createdProposedJob.body.photos)).toBe(true)
        expect(createdProposedJob.body.photos).toHaveLength(1)
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
        expect(resp.body && typeof resp.body).toBe('object')
        const proposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        // verify exmpitness of photos
        expect(Array.isArray(proposedJob.body.photos)).toBe(true)
        expect(proposedJob.body.photos).toHaveLength(0)
        // verify non-existence of /proposed-jobs/{id} folder
        expect(
          api.pathExists(
            path.join(
              api.getUploadDirForImagesForCurrentEvent(),
              `/proposed-jobs/${resp.body.id}`
            )
          )
        ).toBe(false)
      })

      it("delete proposed-job's non-only photo", async function () {
        // given
        const created = await api.createProposedJobWithPhotos([
          path.normalize(`${__dirname}/resources/favicon.ico`),
          path.normalize(`${__dirname}/resources/logo-smj-yellow.png`),
        ])
        expect(created.status).toBe(201)
        const createdProposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        expect(Array.isArray(createdProposedJob.body.photos)).toBe(true)
        expect(createdProposedJob.body.photos).toHaveLength(2)
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
        expect(resp.body && typeof resp.body).toBe('object')
        const proposedJob = await api.get(
          `/api/proposed-jobs/${created.body.id}`,
          Id.JOBS
        )
        // verify number of photos
        expect(Array.isArray(proposedJob.body.photos)).toBe(true)
        expect(proposedJob.body.photos).toHaveLength(1)
        // verify naming of file
        const { fileName, fileType } = getFileNameAndType(
          proposedJob.body.photos.at(0).photoPath
        )
        expect(fileName).toBe(proposedJob.body.photos.at(0).id)
        expect(fileType).toBe('.png')
        // verify existence of /proposed-jobs/{id} folder
        expect(
          api.pathExists(
            path.join(
              api.getUploadDirForImagesForCurrentEvent(),
              `/proposed-jobs/${created.body.id}`
            )
          )
        ).toBe(true)
        // verify number of files in /proposed-jobs/{id} folder
        const numOfFiles = await api.numberOfFilesInsideDirectory(
          path.join(
            api.getUploadDirForImagesForCurrentEvent(),
            `/proposed-jobs/${created.body.id}`
          )
        )
        expect(numOfFiles).toBe(1)
      })
    })
    //#endregion
  })

  it('deletation of proposed-job will delete all his photos and upload directory', async function () {
    // given
    const created = await api.createProposedJobWithPhotos([
      path.normalize(`${__dirname}/resources/favicon.ico`),
      path.normalize(`${__dirname}/resources/logo-smj-yellow.png`),
    ])
    expect(created.status).toBe(201)
    const createdProposedJob = await api.get(
      `/api/proposed-jobs/${created.body.id}`,
      Id.JOBS
    )
    expect(Array.isArray(createdProposedJob.body.photos)).toBe(true)
    expect(createdProposedJob.body.photos).toHaveLength(2)
    // when
    const resp = await api.del(`/api/proposed-jobs/${created.body.id}`, Id.JOBS)
    // then
    expect(resp.status).toBe(204)
    // verify non-existence of /proposed-jobs/{id} folder
    const dir = api.getUploadDirForImagesForCurrentEvent()
    expect(api.pathExists(dir + '/proposed-jobs/' + created.body.id)).toBe(
      false
    )
    // verify of non-existence of each file
    createdProposedJob.body.photos.forEach(photo => {
      expect(api.pathExists(dir + photo.photoPath)).toBe(false)
    })
  })

  //#region Get
  describe('##get', function () {
    it("get proposed-job's photo", async function () {
      //given
      const file = path.normalize(`${__dirname}/resources/favicon.ico`)
      const created = await api.createProposedJobWithPhotos([file])
      expect(created.status).toBe(201)
      const createdProposedJob = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      expect(Array.isArray(createdProposedJob.body.photos)).toBe(true)
      expect(createdProposedJob.body.photos).toHaveLength(1)
      expect(createdProposedJob.body.photos.at(0)).toHaveProperty('id')
      const photoId = createdProposedJob.body.photos.at(0).id
      // when
      const resp = await api.get(
        `/api/proposed-jobs/${created.body.id}/photos/${photoId}`,
        Id.JOBS
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

    it("returns 404 when proposed job's photo does not exist", async function () {
      // given
      const created = await api.createProposedJobWithPhotos([])
      // when
      const resp = await api.get(
        `/api/proposed-jobs/${created.body.id}/photos/invalid`,
        Id.JOBS
      )
      // then
      expect(resp.status).toBe(404)
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
      expect(resp.status).toBe(201)
      expect(resp.body && typeof resp.body).toBe('object')
      expect(resp.body).toHaveProperty('id')
      const get = await api.get(`/api/proposed-jobs/${resp.body.id}`, Id.JOBS)
      expect(get.status).toBe(200)
      expect(get.body && typeof get.body).toBe('object')
      expect(get.body).toHaveProperty('toolsToTakeWith')
      expect(Array.isArray(get.body.toolsToTakeWith)).toBe(true)
      expect(get.body.toolsToTakeWith).toHaveLength(1)
      expect(
        get.body.toolsToTakeWith.at(0) && typeof get.body.toolsToTakeWith.at(0)
      ).toBe('object')
      expect(get.body.toolsToTakeWith.at(0)).toHaveProperty('tool')
      expect(get.body.toolsToTakeWith.at(0)).toHaveProperty('amount')
      expect(get.body.toolsToTakeWith.at(0).tool).toBe(tool.tool)
      expect(get.body.toolsToTakeWith.at(0).amount).toBe(tool.amount)
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
      expect(resp.status).toBe(400)
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
      expect(resp.status).toBe(204)
      const get = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      expect(get.status).toBe(200)
      expect(get.body && typeof get.body).toBe('object')
      expect(get.body).toHaveProperty('toolsToTakeWith')
      expect(Array.isArray(get.body.toolsToTakeWith)).toBe(true)
      expect(get.body.toolsToTakeWith).toHaveLength(1)
      expect(
        get.body.toolsToTakeWith.at(0) && typeof get.body.toolsToTakeWith.at(0)
      ).toBe('object')
      expect(get.body.toolsToTakeWith.at(0)).toHaveProperty('tool')
      expect(get.body.toolsToTakeWith.at(0)).toHaveProperty('amount')
      expect(get.body.toolsToTakeWith.at(0).tool).toBe(toolUpload.tool)
      expect(get.body.toolsToTakeWith.at(0).amount).toBe(toolUpload.amount)
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
      expect(resp.status).toBe(204)
      const get = await api.get(
        `/api/proposed-jobs/${created.body.id}`,
        Id.JOBS
      )
      expect(get.status).toBe(200)
      expect(get.body && typeof get.body).toBe('object')
      expect(get.body).toHaveProperty('toolsToTakeWith')
      expect(Array.isArray(get.body.toolsToTakeWith)).toBe(true)
      expect(get.body.toolsToTakeWith).toHaveLength(0)
      // clean
      await api.deleteArea(area.id)
    })
  })
  //#endregion

  afterAll(api.afterTestBlock)
})

//#endregion
