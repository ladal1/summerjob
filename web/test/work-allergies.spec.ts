import { api, createWorkAllergyData, Id, isEmpty } from './common'

type WorkAllergy = { id: string; name: string }

describe('Work allergies', function () {
  //#region Access
  describe('#access', function () {
    it('should not be able to create without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      for (const perm of perms) {
        const body = createWorkAllergyData()
        const resp = await api.post('/api/work-allergies', perm, body)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }
    })

    it('should be able to create with permission', async function () {
      const body = createWorkAllergyData()
      const resp = await api.post('/api/work-allergies', Id.ADMIN, body)
      expect(resp.status).toBe(201)
    })

    it('should not be able to delete without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createWorkAllergyData()
      const workAllergy = await api.post('/api/work-allergies', Id.ADMIN, body)
      const id = workAllergy.body.id

      for (const perm of perms) {
        const resp = await api.del(`/api/work-allergies/${id}`, perm)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterDelete = await api.get('/api/work-allergies', '')
      expect((afterDelete.body as WorkAllergy[]).map(wa => wa.id)).toContain(id)
    })

    it('should not be able to update without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createWorkAllergyData()
      const workAllergy = await api.post('/api/work-allergies', Id.ADMIN, body)
      const id = workAllergy.body.id
      const name = workAllergy.body.name

      const newName = 'New name'
      for (const perm of perms) {
        const resp = await api.patch(`/api/work-allergies/${id}`, perm, {
          name: newName,
        })
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterPatch = await api.get(`/api/work-allergies/${id}`, '')
      expect(afterPatch.body.name).toBe(name)
    })

    it('should be accessible without permission', async function () {
      const resp = await api.get('/api/work-allergies', '')
      expect(resp.status).toBe(200)
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('creates a work allergy', async function () {
      const body = createWorkAllergyData()
      const resp = await api.post('/api/work-allergies', Id.ADMIN, body)
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
    })

    it('returns 404 when work allergy doesnt exist', async function () {
      const resp = await api.get('/api/work-allergies/1', '')
      expect(resp.status).toBe(404)
    })

    it('returns a list of work allergies', async function () {
      const resp = await api.get('/api/work-allergies', '')
      expect(resp.status).toBe(200)
      expect(Array.isArray(resp.body)).toBe(true)
      // 4 work allergies created in previous tests
      expect(resp.body).toHaveLength(4)
    })

    it('returns a work allergy by id', async function () {
      const body = createWorkAllergyData()
      await api.post('/api/work-allergies', Id.ADMIN, body)
      const workAllergies = await api.get('/api/work-allergies', '')
      const selectedWorkAllergy = workAllergies.body[0]
      const resp = await api.get(
        `/api/work-allergies/${selectedWorkAllergy.id}`,
        ''
      )
      expect(resp.status).toBe(200)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body).toEqual(selectedWorkAllergy)
    })

    it('updates a work allergy', async function () {
      const workAllergies = await api.get('/api/work-allergies', '')
      const selectedWorkAllergy = workAllergies.body[0]

      const body = {
        name: 'Updated name',
      }
      const patch = await api.patch(
        `/api/work-allergies/${selectedWorkAllergy.id}`,
        Id.ADMIN,
        body
      )
      expect(patch.status).toBe(204)
      expect(isEmpty(patch.body)).toBe(true)

      const resp = await api.get(
        `/api/work-allergies/${selectedWorkAllergy.id}`,
        ''
      )
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body.name).toBe(body.name)
    })

    it('deletes a work allergy', async function () {
      // Add a new work allergy
      const allergiesBeforeAdding = await api.get('/api/work-allergies', '')
      const body = createWorkAllergyData()
      const workAllergy = await api.post('/api/work-allergies', Id.ADMIN, body)
      const workAllergyId = workAllergy.body.id
      // Check that the work allergy was added
      const workAllergiesAfterAdding = await api.get(
        '/api/work-allergies',
        Id.ADMIN
      )
      expect(workAllergiesAfterAdding.body).toHaveLength(
        allergiesBeforeAdding.body.length + 1
      )
      expect(
        (workAllergiesAfterAdding.body as WorkAllergy[]).map(wa => wa.id)
      ).toContain(workAllergyId)
      // Delete the work allergy
      const resp = await api.del(
        `/api/work-allergies/${workAllergyId}`,
        Id.ADMIN
      )
      expect(resp.status).toBe(204)
      // Check that the work allergy was deleted
      const workAllergiesAfterRemoving = await api.get(
        '/api/work-allergies',
        ''
      )
      expect(workAllergiesAfterRemoving.body).toHaveLength(
        allergiesBeforeAdding.body.length
      )
      expect(
        (workAllergiesAfterRemoving.body as WorkAllergy[]).map(wa => wa.id)
      ).not.toContain(workAllergyId)
    })
  })
  //#endregion
  afterAll(api.afterTestBlock)
})
