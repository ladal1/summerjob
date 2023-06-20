import { Id, api, createProposedJobData } from './common'
import chai from 'chai'

chai.should()

describe('Proposed Jobs', function () {
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
    const proposedJobsAfterAdding = await api.get('/api/proposed-jobs', Id.JOBS)
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

  it('should not be accessible without permission', async function () {
    const perms = [Id.CARS, Id.WORKERS, '']
    for (const perm of perms) {
      const resp = await api.get('/api/proposed-jobs', perm)
      resp.status.should.equal(403)
      resp.body.should.be.empty
    }
  })

  this.afterAll(api.afterTestBlock)
})

export default {}
