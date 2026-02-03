import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Id, api, createAreaData, isEmpty } from './common.js'

describe('Areas', function () {
  beforeAll(api.beforeTestBlock)

  //#region Access
  describe('#access', function () {
    it('should be accessible with permission', async function () {
      const eventId = api.getSummerJobEventId()
      const perms = [Id.ADMIN]
      for (const perm of perms) {
        const resp = await api.get(
          `/api/summerjob-events/${eventId}/areas`,
          perm
        )
        expect(resp.status).toBe(200)
      }
    })
    it('should not be accessible without permission', async function () {
      const eventId = api.getSummerJobEventId()
      const perms = [Id.CARS, Id.WORKERS, Id.JOBS, Id.PLANS, Id.POSTS, '']
      for (const perm of perms) {
        const resp = await api.get(
          `/api/summerjob-events/${eventId}/areas`,
          perm
        )
        expect(resp.status).toBe(403)
        expect(isEmpty(resp.body)).toBe(true)
      }
    })
  })
  //#endregion

  //#region Basic
  describe('#basic', function () {
    it('creates a area', async function () {
      const eventId = api.getSummerJobEventId()
      const resp = await api.post(
        `/api/summerjob-events/${eventId}/areas`,
        Id.ADMIN,
        createAreaData()
      )
      expect(resp.status).toBe(201)
      expect(resp.body).toBeTypeOf('object')
      expect(resp.body).toHaveProperty('id')
    })

    it('returns a list of areas', async function () {
      const eventId = api.getSummerJobEventId()
      const resp = await api.get(
        `/api/summerjob-events/${eventId}/areas`,
        Id.ADMIN
      )
      expect(resp.status).toBe(200)
      expect(Array.isArray(resp.body)).toBe(true)
      expect(resp.body).toHaveLength(1)
    })

    it('updates a area', async function () {
      const eventId = api.getSummerJobEventId()
      const area = await api.post(
        `/api/summerjob-events/${eventId}/areas`,
        Id.ADMIN,
        createAreaData()
      )
      const selectedArea = area.body

      const payload = {
        name: 'New area name',
      }
      const patch = await api.patch(
        `/api/summerjob-events/${eventId}/areas/${selectedArea.id}`,
        Id.ADMIN,
        payload
      )
      expect(patch.status).toBe(204)
      const resp = await api.get(
        `/api/summerjob-events/${eventId}/areas`,
        Id.ADMIN
      )
      expect(Array.isArray(resp.body)).toBe(true)
      const modifiedArea = resp.body.find(a => a.id === selectedArea.id)
      expect(modifiedArea.name).toBe(payload.name)
    })

    it('deletes a area', async function () {
      // Add a new area
      const eventId = api.getSummerJobEventId()
      const areasBeforeAdding = await api.get(
        `/api/summerjob-events/${eventId}/areas`,
        Id.ADMIN
      )
      const body = createAreaData()
      const area = await api.post(
        `/api/summerjob-events/${eventId}/areas`,
        Id.ADMIN,
        body
      )
      const areaId = area.body.id
      // Check that the area was added
      const areasAfterAdding = await api.get(
        `/api/summerjob-events/${eventId}/areas`,
        Id.ADMIN
      )
      expect(areasAfterAdding.body).toHaveLength(
        areasBeforeAdding.body.length + 1
      )
      expect(areasAfterAdding.body.map(a => a.id)).toContain(areaId)
      // Delete the area
      const resp = await api.del(
        `/api/summerjob-events/${eventId}/areas/${areaId}`,
        Id.ADMIN
      )
      expect(resp.status).toBe(204)
      // Check that the area was deleted
      const areasAfterRemoving = await api.get(
        `/api/summerjob-events/${eventId}/areas`,
        Id.ADMIN
      )
      expect(areasAfterRemoving.body).toHaveLength(
        areasBeforeAdding.body.length
      )
      expect(areasAfterRemoving.body.map(w => w.id)).not.toContain(areaId)
    })
  })
  //#endregion

  afterAll(api.afterTestBlock)
})
