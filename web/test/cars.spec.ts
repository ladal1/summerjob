import { Id, api, createCarData } from './common'
import chai from 'chai'
import { faker } from '@faker-js/faker/locale/cz'

chai.should()

describe('Cars', function () {
  it('returns 404 when car does not exist', async function () {
    const resp = await api.get('/api/cars/1', Id.CARS)
    resp.status.should.equal(404)
  })

  it('creates a car', async function () {
    const owner = await api.createWorker()
    const body = createCarData(owner.id)
    const resp = await api.post('/api/cars', Id.CARS, body)
    resp.status.should.equal(201)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
  })

  it('returns a list of cars', async function () {
    const resp = await api.get('/api/cars', Id.CARS)
    resp.status.should.equal(200)
    resp.body.should.be.an('array')
    resp.body.should.have.lengthOf(1)
  })

  it('returns a car by id', async function () {
    const cars = await api.get('/api/cars', Id.CARS)
    const selectedCar = cars.body[0]
    const resp = await api.get(`/api/cars/${selectedCar.id}`, Id.CARS)
    resp.status.should.equal(200)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
    resp.body.id.should.equal(selectedCar.id)
  })

  it('updates a car', async function () {
    const cars = await api.get('/api/cars', Id.CARS)
    const selectedCar = cars.body[0]

    const payload = {
      name: faker.vehicle.vehicle(),
      seats: 2,
    }
    const patch = await api.patch(
      `/api/cars/${selectedCar.id}`,
      Id.CARS,
      payload
    )
    patch.status.should.equal(204)
    const resp = await api.get(`/api/cars/${selectedCar.id}`, Id.CARS)
    resp.body.should.be.an('object')
    resp.body.should.have.property('id')
    resp.body.name.should.equal(payload.name)
    resp.body.seats.should.equal(2)
  })

  it('deletes a car', async function () {
    // Add a new car
    const carsBeforeAdding = await api.get('/api/cars', Id.CARS)
    const owner = await api.createWorker()
    const body = createCarData(owner.id)
    const car = await api.post('/api/cars', Id.CARS, body)
    const carId = car.body.id
    // Check that the car was added
    const carsAfterAdding = await api.get('/api/cars', Id.CARS)
    carsAfterAdding.body.should.have.lengthOf(carsBeforeAdding.body.length + 1)
    ;(carsAfterAdding.body as any[]).map(w => w.id).should.include(carId)
    // Delete the car
    const resp = await api.del(`/api/cars/${carId}`, Id.CARS)
    resp.status.should.equal(204)
    // Check that the car was deleted
    const carsAfterRemoving = await api.get('/api/cars', Id.CARS)
    carsAfterRemoving.body.should.have.lengthOf(carsBeforeAdding.body.length)
    ;(carsAfterRemoving.body as any[]).map(w => w.id).should.not.include(carId)
    await api.deleteWorker(owner.id)
  })

  it('should not be accessible without permission', async function () {
    const perms = [Id.WORKERS, Id.JOBS, '']
    for (const perm of perms) {
      const resp = await api.get('/api/cars', perm)
      resp.status.should.equal(403)
      resp.body.should.be.empty
    }
  })

  it('should delete car when owner is deleted', async function () {
    const owner = await api.createWorker()
    const body = createCarData(owner.id)
    const car = await api.post('/api/cars', Id.CARS, body)
    const carsBeforeDeletingOwner = await api.get('/api/cars', Id.CARS)
    carsBeforeDeletingOwner.body.map(c => c.id).should.include(car.body.id)
    await api.deleteWorker(owner.id)
    const cars = await api.get('/api/cars', Id.CARS)
    cars.body.map(c => c.id).should.not.include(car.body.id)
  })

  this.afterAll(api.afterTestBlock)
})
