import { Id, api, createWorkerData } from './common'
import chai, { expect } from 'chai'
import chaiExclude from 'chai-exclude'

chai.use(chaiExclude)
chai.should()

describe('Workers', function () {
  it('returns 404 when worker does not exist', async function () {
    const resp = await api.get('/api/workers/1', Id.WORKERS)
    resp.status.should.equal(404)
  })

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
    const resp = await api.get(`/api/workers/${selectedWorker.id}`, Id.WORKERS)
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
    const resp = await api.get(`/api/workers/${selectedWorker.id}`, Id.WORKERS)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
    resp.body.firstName.should.equal('Jane')
    resp.body.phone.should.equal('000111222')
    expect(resp.body)
      .excluding(['firstName', 'phone'])
      .to.deep.equal(selectedWorker)
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
    ;(workersAfterAdding.body as any[]).map(w => w.id).should.include(workerId)
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

  it('creates worker with valid photo', async function () {
    const body = createWorkerData()
    const file = {
      fieldName: 'photoPath',
      file: `${__dirname}/../public/favicon.ico`,
    }
    const resp = await api.post('/api/workers/new', Id.WORKERS, body, [file])
    resp.status.should.equal(201)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
    resp.body.should.have.property('photoPath')
    resp.body.photoPath.should.not.be.empty
  })

  it('creates worker with non-photo file', async function () {
    const body = createWorkerData()
    const file = {
      fieldName: 'file0',
      file: `${__dirname}/workers.spec.ts`,
    }
    const resp = await api.post('/api/workers/new', Id.WORKERS, body, [file])
    resp.status.should.equal(400)
  })

  it('update photo of worker', async function () {
    const workers = await api.get('/api/workers', Id.WORKERS)
    const selectedWorker = workers.body[0]
    const file = {
      fieldName: 'file0',
      file: `${__dirname}/../public/logo-smj-yellow.png`,
    }
    const patch = await api.patch(
      `/api/workers/${selectedWorker.id}`,
      Id.WORKERS,
      {},
      [file]
    )
    patch.status.should.equal(204)
    const resp = await api.get(`/api/workers/${selectedWorker.id}`, Id.WORKERS)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
    resp.body.should.have.property('photoPath')
    resp.body.photoPath.should.not.be.empty

    const lastSlashIndex = resp.body.photoPath.lastIndexOf('/')
    const lastDotIndex = resp.body.photoPath.lastIndexOf('.')
    // there should be some / and . in name of photoPath
    lastSlashIndex.should.not.equal(-1)
    lastDotIndex.should.not.equal(-1)
    // newly created photo should be named as {worker.id}.{type}
    const fileName = resp.body.photoPath.slice(lastSlashIndex + 1, lastDotIndex)
    const fileType = resp.body.photoPath.slice(lastDotIndex)
    fileName.should.equal(resp.body.id)
    fileName.should.equal(selectedWorker.id)
    fileType.should.equal('.png')
  })

  it('remove photo of worker', async function () {
    const bodyOfNewWorker = createWorkerData()
    const fileOfNewWorker = {
      fieldName: 'file0',
      file: `${__dirname}/../public/logo-smj-yellow.png`,
    }
    const newWorkerRes = await api.post(
      '/api/workers/new',
      Id.WORKERS,
      bodyOfNewWorker,
      [fileOfNewWorker]
    )

    const body = {
      photoFileRemoved: true,
    }
    const patch = await api.patch(
      `/api/workers/${newWorkerRes.body.id}`,
      Id.WORKERS,
      body
    )
    patch.status.should.equal(204)
    const resp = await api.get(
      `/api/workers/${newWorkerRes.body.id}`,
      Id.WORKERS
    )
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
    resp.body.should.have.property('photoPath')
    resp.body.photoPath.should.be.empty
  })

  this.afterAll(api.afterTestBlock)
})
