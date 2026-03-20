import { api, createJobTypeData, Id, isEmpty } from './common'

type JobType = { id: string; name: string }

describe('Job types', function () {
  //#region Access
  describe('#access', function () {
    it('should not be able to create without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      for (const perm of perms) {
        const body = createJobTypeData()
        const resp = await api.post('/api/job-types', perm, body)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }
    })

    it('should be able to create with permission', async function () {
      const body = createJobTypeData()
      const resp = await api.post('/api/job-types', Id.ADMIN, body)
      expect(resp.status).toBe(201)
    })

    it('should not be able to delete without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createJobTypeData()
      const jobType = await api.post('/api/job-types', Id.ADMIN, body)
      const id = jobType.body.id

      for (const perm of perms) {
        const resp = await api.del(`/api/job-types/${id}`, perm)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterDelete = await api.get('/api/job-types', '')
      expect((afterDelete.body as JobType[]).map(jt => jt.id)).toContain(id)
    })

    it('should not be able to update without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createJobTypeData()
      const jobType = await api.post('/api/job-types', Id.ADMIN, body)
      const id = jobType.body.id
      const name = jobType.body.name

      const newName = 'New name'
      for (const perm of perms) {
        const resp = await api.patch(`/api/job-types/${id}`, perm, {
          name: newName,
        })
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterPatch = await api.get(`/api/job-types/${id}`, '')
      expect(afterPatch.body.name).toBe(name)
    })

    it('should be accessible without permission', async function () {
      const resp = await api.get('/api/job-types', '')
      expect(resp.status).toBe(200)
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('creates a job type', async function () {
      const body = createJobTypeData()
      const resp = await api.post('/api/job-types', Id.ADMIN, body)
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
    })

    it('returns 404 when job type doesnt exist', async function () {
      const resp = await api.get('/api/job-types/1', '')
      expect(resp.status).toBe(404)
    })

    it('returns a list of job types', async function () {
      const resp = await api.get('/api/job-types', '')
      expect(resp.status).toBe(200)
      expect(Array.isArray(resp.body)).toBe(true)
      // 4 jobTypes created in previous tests
      expect(resp.body).toHaveLength(4)
    })

    it('returns a job type by id', async function () {
      const body = createJobTypeData()
      await api.post('/api/job-types', Id.ADMIN, body)
      const jobTypes = await api.get('/api/job-types', '')
      const selectedJobType = jobTypes.body[0]
      const resp = await api.get(`/api/job-types/${selectedJobType.id}`, '')
      expect(resp.status).toBe(200)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body).toEqual(selectedJobType)
    })

    it('updates a job type', async function () {
      const jobTypes = await api.get('/api/job-types', '')
      const selectedJobType = jobTypes.body[0]

      const body = {
        name: 'Updated name',
      }
      const patch = await api.patch(
        `/api/job-types/${selectedJobType.id}`,
        Id.ADMIN,
        body
      )
      expect(patch.status).toBe(204)
      expect(isEmpty(patch.body)).toBe(true)

      const resp = await api.get(`/api/job-types/${selectedJobType.id}`, '')
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body.name).toBe(body.name)
    })

    it('deletes a job type', async function () {
      // Add a new jobType
      const jobTypesBeforeAdding = await api.get('/api/job-types', '')
      const body = createJobTypeData()
      const jobType = await api.post('/api/job-types', Id.ADMIN, body)
      const jobTypeId = jobType.body.id
      // Check that the job type was added
      const jobTypesAfterAdding = await api.get('/api/job-types', Id.ADMIN)
      expect(jobTypesAfterAdding.body).toHaveLength(
        jobTypesBeforeAdding.body.length + 1
      )
      expect(
        (jobTypesAfterAdding.body as JobType[]).map(jt => jt.id)
      ).toContain(jobTypeId)
      // Delete the jobType
      const resp = await api.del(`/api/job-types/${jobTypeId}`, Id.ADMIN)
      expect(resp.status).toBe(204)
      // Check that the jobType was deleted
      const jobTypesAfterRemoving = await api.get('/api/job-types', '')
      expect(jobTypesAfterRemoving.body).toHaveLength(
        jobTypesBeforeAdding.body.length
      )
      expect(
        (jobTypesAfterRemoving.body as JobType[]).map(jt => jt.id)
      ).not.toContain(jobTypeId)
    })
  })
  //#endregion
  afterAll(api.afterTestBlock)
})
