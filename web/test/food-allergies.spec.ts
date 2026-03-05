import { api, createFoodAllergyData, Id, isEmpty } from './common'

type FoodAllergy = { id: string; name: string }

describe('Food allergies', function () {
  //#region Access
  describe('#access', function () {
    it('should not be able to create without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      for (const perm of perms) {
        const body = createFoodAllergyData()
        const resp = await api.post('/api/food-allergies', perm, body)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }
    })

    it('should be able to create with permission', async function () {
      const body = createFoodAllergyData()
      const resp = await api.post('/api/food-allergies', Id.ADMIN, body)
      expect(resp.status).toBe(201)
    })

    it('should not be able to delete without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createFoodAllergyData()
      const foodAllergy = await api.post('/api/food-allergies', Id.ADMIN, body)
      const id = foodAllergy.body.id

      for (const perm of perms) {
        const resp = await api.del(`/api/food-allergies/${id}`, perm)
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterDelete = await api.get('/api/food-allergies', '')
      expect((afterDelete.body as FoodAllergy[]).map(fa => fa.id)).toContain(id)
    })

    it('should not be able to update without permission', async function () {
      const perms = [Id.CARS, Id.JOBS, Id.POSTS, '']
      const body = createFoodAllergyData()
      const foodAllergy = await api.post('/api/food-allergies', Id.ADMIN, body)
      const id = foodAllergy.body.id
      const name = foodAllergy.body.name

      const newName = 'New name'
      for (const perm of perms) {
        const resp = await api.patch(`/api/food-allergies/${id}`, perm, {
          name: newName,
        })
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }

      const afterPatch = await api.get(`/api/food-allergies/${id}`, '')
      expect(afterPatch.body.name).toBe(name)
    })

    it('should be accessible without permission', async function () {
      const resp = await api.get('/api/food-allergies', '')
      expect(resp.status).toBe(200)
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('create a food allergy', async function () {
      const body = createFoodAllergyData()
      const resp = await api.post('/api/food-allergies', Id.ADMIN, body)
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
    })

    it('return 404 when food allergy doesnt exist', async function () {
      const resp = await api.get('/api/food-allergies/1', '')
      expect(resp.status).toBe(404)
    })

    it('returns a list of food allergies', async function () {
      const resp = await api.get('/api/food-allergies', '')
      expect(resp.status).toBe(200)
      expect(Array.isArray(resp.body)).toBe(true)
      // 4 food allegies created in previous tests
      expect(resp.body).toHaveLength(4)
    })

    it('returns a food allergy by id', async function () {
      const foodAllergies = await api.get('/api/food-allergies', '')
      const selectedFoodAllergy = foodAllergies.body[0]
      const resp = await api.get(
        `/api/food-allergies/${selectedFoodAllergy.id}`,
        ''
      )
      expect(resp.status).toBe(200)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body).toEqual(selectedFoodAllergy)
    })

    it('updates a food allergy', async function () {
      const foodAllergies = await api.get('/api/food-allergies', '')
      const selectedFoodAllergy = foodAllergies.body[0]

      const body = {
        name: 'Updated name',
      }
      const patch = await api.patch(
        `/api/food-allergies/${selectedFoodAllergy.id}`,
        Id.ADMIN,
        body
      )
      expect(patch.status).toBe(204)
      const resp = await api.get(
        `/api/food-allergies/${selectedFoodAllergy.id}`,
        ''
      )
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
      expect(resp.body.name).toBe(body.name)
    })

    it('deletes a food allergy', async function () {
      // Add a new food allergy
      const allergiesBeforeAdding = await api.get('/api/food-allergies', '')
      const body = createFoodAllergyData()
      const foodAllergy = await api.post('/api/food-allergies', Id.ADMIN, body)
      const foodAllergyId = foodAllergy.body.id
      // Check that the food allergy was added
      const foodAllergiesAfterAdding = await api.get(
        '/api/food-allergies',
        Id.ADMIN
      )
      console.log(JSON.stringify(foodAllergy, null, 2))
      expect(foodAllergiesAfterAdding.body).toHaveLength(
        allergiesBeforeAdding.body.length + 1
      )
      expect(
        (foodAllergiesAfterAdding.body as FoodAllergy[]).map(fa => fa.id)
      ).toContain(foodAllergyId)
      // Delete the food allergy
      const resp = await api.del(
        `/api/food-allergies/${foodAllergyId}`,
        Id.ADMIN
      )
      expect(resp.status).toBe(204)
      // Check that the food allergy was deleted
      const foodAllergiesAfterRemoving = await api.get(
        '/api/food-allergies',
        ''
      )
      expect(foodAllergiesAfterRemoving.body).toHaveLength(
        allergiesBeforeAdding.body.length
      )
      expect(
        (foodAllergiesAfterRemoving.body as FoodAllergy[]).map(fa => fa.id)
      ).not.toContain(foodAllergyId)
    })
  })
  //#endregion
  afterAll(api.afterTestBlock)
})
