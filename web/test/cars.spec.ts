/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, describe, expect, it } from 'vitest'
import { Id, api, createCarData, isEmpty } from './common.js'
import { faker } from '@faker-js/faker/locale/cs_CZ'

describe('Cars', function () {
  it('returns 404 when car does not exist', async function () {
    const resp = await api.get('/api/cars/1', Id.CARS)
    expect(resp.status).toBe(404)
  })

  it('creates a car', async function () {
    const owner = await api.createWorker()
    const body = createCarData(owner.id)
    const resp = await api.post('/api/cars', Id.CARS, body)
    expect(resp.status).toBe(201)
    expect(resp.body).toBeTypeOf('object')
    expect(resp.body).toHaveProperty('id')
  })

  it('returns a list of cars', async function () {
    const resp = await api.get('/api/cars', Id.CARS)
    expect(resp.status).toBe(200)
    expect(Array.isArray(resp.body)).toBe(true)
    expect(resp.body).toHaveLength(1)
  })

  it('returns a car by id', async function () {
    const cars = await api.get('/api/cars', Id.CARS)
    const selectedCar = cars.body[0]
    const resp = await api.get(`/api/cars/${selectedCar.id}`, Id.CARS)
    expect(resp.status).toBe(200)
    expect(resp.body).toBeTypeOf('object')
    expect(resp.body).toHaveProperty('id')
    expect(resp.body.id).toBe(selectedCar.id)
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
    expect(patch.status).toBe(204)
    const resp = await api.get(`/api/cars/${selectedCar.id}`, Id.CARS)
    expect(resp.body).toBeTypeOf('object')
    expect(resp.body).toHaveProperty('id')
    expect(resp.body.name).toBe(payload.name)
    expect(resp.body.seats).toBe(2)
  })

  it("update car's odometer end", async function () {
    const cars = await api.get('/api/cars', Id.CARS)
    const selectedCar = cars.body[0]

    const payload = {
      odometerEnd: 30000,
    }
    const patch = await api.patch(
      `/api/cars/${selectedCar.id}`,
      Id.CARS,
      payload
    )
    expect(patch.status).toBe(204)
    const resp = await api.get(`/api/cars/${selectedCar.id}`, Id.CARS)
    expect(resp.body).toBeTypeOf('object')
    expect(resp.body).toHaveProperty('id')
    expect(resp.body).toHaveProperty('odometerEnd')
    expect(resp.body.odometerEnd).toBe(payload.odometerEnd)
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
    expect(carsAfterAdding.body).toHaveLength(carsBeforeAdding.body.length + 1)
    expect((carsAfterAdding.body as any[]).map(w => w.id)).toContain(carId)
    // Delete the car
    const resp = await api.del(`/api/cars/${carId}`, Id.CARS)
    expect(resp.status).toBe(204)
    // Check that the car was deleted
    const carsAfterRemoving = await api.get('/api/cars', Id.CARS)
    expect(carsAfterRemoving.body).toHaveLength(carsBeforeAdding.body.length)
    expect((carsAfterRemoving.body as any[]).map(w => w.id)).not.toContain(
      carId
    )
    await api.deleteWorker(owner.id)
  })

  it('should not be accessible without permission', async function () {
    const perms = [Id.WORKERS, Id.JOBS, '']
    for (const perm of perms) {
      const resp = await api.get('/api/cars', perm)
      expect(resp.status).toBe(403)
      expect(isEmpty(resp.body)).toBe(true)
    }
  })

  it('should delete car when owner is deleted', async function () {
    const owner = await api.createWorker()
    const body = createCarData(owner.id)
    const car = await api.post('/api/cars', Id.CARS, body)
    const carsBeforeDeletingOwner = await api.get('/api/cars', Id.CARS)
    expect(carsBeforeDeletingOwner.body.map(c => c.id)).toContain(car.body.id)
    await api.deleteWorker(owner.id)
    const cars = await api.get('/api/cars', Id.CARS)
    expect(cars.body.map(c => c.id)).not.toContain(car.body.id)
  })
  afterAll(api.afterTestBlock)
})
