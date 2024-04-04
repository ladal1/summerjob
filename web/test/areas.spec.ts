import chai from 'chai'
import { Id, api, createAreaData } from './common'

chai.should()

describe('Areas', function () {
  it('creates a area', async function () {
    const eventId = api.getSummerJobEventId()
    const resp = await api.post(
      `/api/summerjob-events/${eventId}/areas`,
      Id.ADMIN,
      createAreaData()
    )
    resp.status.should.equal(201)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
  })

  it('returns a list of areas', async function () {
    const eventId = api.getSummerJobEventId()
    const resp = await api.get(
      `/api/summerjob-events/${eventId}/areas`,
      Id.ADMIN
    )
    resp.status.should.equal(200)
    resp.body.should.be.an('array')
    resp.body.should.have.lengthOf(1)
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
    patch.status.should.equal(204)
    const resp = await api.get(
      `/api/summerjob-events/${eventId}/areas`,
      Id.ADMIN
    )
    resp.body.should.be.an('array')
    const modifiedArea = (resp.body as any[]).find(
      a => a.id === selectedArea.id
    )
    modifiedArea.name.should.equal(payload.name)
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
    areasAfterAdding.body.should.have.lengthOf(
      areasBeforeAdding.body.length + 1
    )
    ;(areasAfterAdding.body as any[]).map(a => a.id).should.include(areaId)
    // Delete the area
    const resp = await api.del(
      `/api/summerjob-events/${eventId}/areas/${areaId}`,
      Id.ADMIN
    )
    resp.status.should.equal(204)
    // Check that the area was deleted
    const areasAfterRemoving = await api.get(
      `/api/summerjob-events/${eventId}/areas`,
      Id.ADMIN
    )
    areasAfterRemoving.body.should.have.lengthOf(areasBeforeAdding.body.length)
    ;(areasAfterRemoving.body as any[])
      .map(w => w.id)
      .should.not.include(areaId)
  })

  it('should not be accessible without permission', async function () {
    const eventId = api.getSummerJobEventId()
    const perms = [Id.CARS, Id.WORKERS, '']
    for (const perm of perms) {
      const resp = await api.get(`/api/summerjob-events/${eventId}/areas`, perm)
      resp.status.should.equal(403)
      resp.body.should.be.empty
    }
  })

  this.afterAll(api.afterTestBlock)
})
