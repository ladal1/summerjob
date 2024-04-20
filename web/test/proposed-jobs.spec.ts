import chai from 'chai'
import { Id, api, createProposedJobData, getFileNameAndType } from './common'

chai.should()

describe('Proposed Jobs', function () {
  //#region Access
  describe('#access', function () {
    it('should be accessible with permission', async function () {
      const perms = [Id.JOBS, Id.ADMIN, Id.PLANS]
      for (const perm of perms) {
        const resp = await api.get('/api/proposed-jobs', perm)
        resp.status.should.equal(200)
      }
    })

    it('should not be accessible without permission', async function () {
      const perms = [Id.CARS, Id.WORKERS, Id.POSTS, '']
      for (const perm of perms) {
        const resp = await api.get('/api/proposed-jobs', perm)
        resp.status.should.equal(403)
        resp.body.should.be.empty
      }
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('returns 404 when proposed job does not exist', async function () {
      const resp = await api.get('/api/proposed-jobs/1', Id.JOBS)
      resp.status.should.equal(404)
    })

    it('creates a proposed job', async function () {
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const resp = await api.post('/api/proposed-jobs', Id.JOBS, body)
      resp.status.should.equal(201)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      await api.deleteArea(area.id)
    })

    it('returns a list of proposedJobs', async function () {
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const job = await api.post('/api/proposed-jobs', Id.JOBS, body)
      const resp = await api.get('/api/proposed-jobs', Id.JOBS)
      resp.status.should.equal(200)
      resp.body.should.be.an('array')
      resp.body.should.have.lengthOf(1)
      await api.deleteArea(area.id)
    })

    it('returns a proposed job by id', async function () {
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const job = await api.post('/api/proposed-jobs', Id.JOBS, body)
      const resp = await api.get(`/api/proposed-jobs/${job.body.id}`, Id.JOBS)
      resp.status.should.equal(200)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      await api.deleteArea(area.id)
    })

    it('updates a proposed job', async function () {
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const job = await api.post('/api/proposed-jobs', Id.JOBS, body)
      const selectedProposedJob = job.body

      const payload = {
        name: 'New job name',
      }
      const patch = await api.patch(
        `/api/proposed-jobs/${selectedProposedJob.id}`,
        Id.JOBS,
        payload
      )
      patch.status.should.equal(204)
      const resp = await api.get(
        `/api/proposed-jobs/${selectedProposedJob.id}`,
        Id.JOBS
      )
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      resp.body.name.should.equal(payload.name)
      await api.deleteArea(area.id)
    })

    it("can't update a proposed-job - wrong parameter", async function () {
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const job = await api.post('/api/proposed-jobs', Id.JOBS, body)
      const selectedProposedJob = job.body

      const payload = {
        wrongParameter: 'New job name',
      }
      const patch = await api.patch(
        `/api/proposed-jobs/${selectedProposedJob.id}`,
        Id.JOBS,
        payload
      )
      patch.status.should.equal(400)
      await api.deleteArea(area.id)
    })

    it('deletes a proposed job', async function () {
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
      // Delete the proposedJob
      const resp = await api.del(`/api/proposed-jobs/${proposedJobId}`, Id.JOBS)
      resp.status.should.equal(204)
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
      await api.deleteArea(area.id)
    })
  })
  //#endregion

  //#region Photos
  describe('#photos', function () {
    it('creates proposed-job with valid photo', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const file = {
        fieldName: 'file0',
        file: `${__dirname}/../public/favicon.ico`,
      }
      // when
      const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [file])
      // then
      resp.status.should.equal(201)
      resp.body.should.be.an('object')
      resp.body.should.have.property('id')
      const proposedJob = await api.get(
        `/api/proposed-jobs/${resp.body.id}`,
        Id.JOBS
      )
      proposedJob.body.photos.should.be.an('array')
      proposedJob.body.photos.should.have.lengthOf(1)
      const { fileName, fileType } = getFileNameAndType(
        proposedJob.body.photos.at(0).photoPath
      )
      fileName.should.equal(proposedJob.body.photos.at(0).id)
      fileType.should.equal('.ico')
    })

    it('creates proposed-job with multiple valid photos', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const file0 = {
        fieldName: 'file0',
        file: `${__dirname}/../public/logo-smj-yellow.png`,
      }
      const file1 = {
        fieldName: 'file1',
        file: `${__dirname}/../public/favicon.ico`,
      }
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
      proposedJob.body.photos.should.be.an('array')
      proposedJob.body.photos.should.have.lengthOf(2)
      proposedJob.body.photos.at(0).should.have.property('photoPath')
      // Uploaded photos should hold its order and should be named as {photoId}.{formerType}
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
    })

    it('creates proposed-job with invalid photo', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const file = {
        fieldName: 'file0',
        file: `${__dirname}/workers.spec.ts`,
      }
      // when
      const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [file])
      // then
      resp.status.should.equal(400)
    })

    it('creates proposed-job with valid and one invalid photos', async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const file0 = {
        fieldName: 'file0',
        file: `${__dirname}/../public/logo-smj-yellow.png`,
      }
      const file1 = {
        fieldName: 'file1',
        file: `${__dirname}/workers.spec.ts`,
      }
      // when
      const resp = await api.post('/api/proposed-jobs', Id.JOBS, body, [
        file0,
        file1,
      ])
      // then
      resp.status.should.equal(400)
    })

    it("delete proposed-job's photo", async function () {
      // given
      const area = await api.createArea()
      const body = createProposedJobData(area.id)
      const file = {
        fieldName: 'file0',
        file: `${__dirname}/../public/favicon.ico`,
      }
      const created = await api.post('/api/proposed-jobs', Id.JOBS, body, [
        file,
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
      proposedJob.body.photos.should.be.an('array')
      proposedJob.body.photos.should.have.lengthOf(0)
    })

    /* it('updates proposed-job with valid photo', async function () {
    })

    it('updates proposed-job with multiple valid photos', async function () {
    })

    it('updates proposed-job with invalid photo', async function () {})

    it('updates proposed-job with valid and one invalid photos', async function () {})

    it('deletation of proposed-job will delete all his photos and uploaded directory', async function () {})

    it("delete proposed-job's every photo", async function () {})

    it("delete proposed-job's every photo", async function () {})

    it("get proposed-job' first photo", async function () {})

    it("returns 404 when proposed job' specific photo does not exist", async function () {})*/
  })
  //#endregion

  //#region Tools
  /*  describe('#tools', function () {
    it('create proposed-job with tools to take with', async function () {})

    it('create proposed-job with invalid tool to take with', async function () {})

    it('update proposed-job tools to take with', async function () {})

    it('update proposed-job with invalid tool to take with', async function () {})

    it('delete proposed-job tools to take with', async function () {})
  }) */
  //#endregion

  this.afterAll(api.afterTestBlock)
})
