/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from '@faker-js/faker'
import { describe, it, expect, afterAll } from 'vitest'
import { Id, api, createPlanData } from './common.js'

describe('Plans', function () {
  it('should show empty list of plans', async function () {
    const plans = await api.get('/api/plans', Id.PLANS)
    expect(plans.status).toBe(200)
    expect(Array.isArray(plans.body)).toBe(true)
    expect(plans.body).toHaveLength(0)
  })

  it('creates a plan', async function () {
    const firstPlan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventStart())
    )
    expect(firstPlan.status).toBe(201)
    expect(firstPlan.body).toHaveProperty('id')

    const lastPlan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventEnd())
    )
    expect(lastPlan.status).toBe(201)
    expect(lastPlan.body).toHaveProperty('id')

    // Cleanup

    await api.del(`/api/plans/${firstPlan.body.id}`, Id.PLANS)
    await api.del(`/api/plans/${lastPlan.body.id}`, Id.PLANS)
  })

  it('returns a list of plans', async function () {
    const firstPlan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventStart())
    )

    const plans = await api.get('/api/plans', Id.PLANS)
    expect(plans.status).toBe(200)
    expect(Array.isArray(plans.body)).toBe(true)
    expect(plans.body).toHaveLength(1)

    await api.del(`/api/plans/${firstPlan.body.id}`, Id.PLANS)
  })

  it('deletes a plan', async function () {
    const firstPlan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventStart())
    )
    const plans = await api.get('/api/plans', Id.PLANS)
    const deleted = await api.del(`/api/plans/${firstPlan.body.id}`, Id.PLANS)
    expect(deleted.status).toBe(204)

    const plansAfterDelete = await api.get('/api/plans', Id.PLANS)
    expect(plansAfterDelete.body).toHaveLength(plans.body.length - 1)
  })

  it('returns a plan by id', async function () {
    const created = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventEnd())
    )
    const plan = await api.get(`/api/plans/${created.body.id}`, Id.PLANS)
    expect(plan.status).toBe(200)
    expect(plan.body && typeof plan.body).toBe('object')
    expect(plan.body).toHaveProperty('id')

    await api.del(`/api/plans/${created.body.id}`, Id.PLANS)
  })

  it('adds a job to plan', async function () {
    const plan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventEnd())
    )
    const area = await api.createArea()
    const job = await api.createProposedJob(area.id)
    const payload = {
      proposedJobId: job.id,
      planId: plan.body.id,
    }
    const addToPlan = await api.post(
      `/api/plans/${plan.body.id}/active-jobs`,
      Id.PLANS,
      payload
    )
    expect(addToPlan.status).toBe(201)
    expect(addToPlan.body.planId).toBe(plan.body.id)
    expect(addToPlan.body.proposedJobId).toBe(job.id)

    const planWithJob = await api.get(`/api/plans/${plan.body.id}`, Id.PLANS)
    expect(planWithJob.body.jobs).toHaveLength(1)

    await api.del(`/api/plans/${plan.body.id}`, Id.PLANS)
  })

  it('returns a job by id', async function () {
    const { plan, job } = await api.createPlanWithJob()
    const activeJob = await api.get(
      `/api/plans/${plan.id}/active-jobs/${job.id}`,
      Id.PLANS
    )
    expect(activeJob.status).toBe(200)
    expect(activeJob.body && typeof activeJob.body).toBe('object')
    expect(activeJob.body).toHaveProperty('id')
    expect(activeJob.body).toHaveProperty('planId')
    expect(activeJob.body).toHaveProperty('proposedJobId')
    expect(activeJob.body.id).toBe(job.id)
    expect(activeJob.body.planId).toBe(plan.id)

    await api.del(`/api/plans/${plan.id}`, Id.PLANS)
  })

  it('removes a job from plan', async function () {
    const plan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventEnd())
    )
    const area = await api.createArea()
    const job = await api.createProposedJob(area.id)
    const payload = {
      proposedJobId: job.id,
      planId: plan.body.id,
    }
    const activeJob = await api.post(
      `/api/plans/${plan.body.id}/active-jobs`,
      Id.PLANS,
      payload
    )
    const removed = await api.del(
      `/api/plans/${plan.body.id}/active-jobs/${activeJob.body.id}`,
      Id.PLANS
    )
    expect(removed.status).toBe(204)

    const planWithoutJob = await api.get(`/api/plans/${plan.body.id}`, Id.PLANS)
    expect(planWithoutJob.body.jobs).toHaveLength(0)

    await api.del(`/api/plans/${plan.body.id}`, Id.PLANS)
  })

  it('updates a job in plan, adds workers', async function () {
    const { plan, job } = await api.createPlanWithJob()
    const worker = await api.createWorker()
    const payload = {
      proposedJob: {
        privateDescription: faker.lorem.paragraph(),
      },
      workerIds: [worker.id],
      responsibleWorkerId: worker.id,
    }
    const updated = await api.patch(
      `/api/plans/${plan.id}/active-jobs/${job.id}`,
      Id.PLANS,
      payload
    )
    expect(updated.status).toBe(204)
    const updatedPlan = await api.get(`/api/plans/${plan.id}`, Id.PLANS)
    const updatedActiveJob = (updatedPlan.body.jobs as any[]).find(
      j => j.id === job.id
    )
    expect(updatedActiveJob?.proposedJob.privateDescription).toBe(
      payload.proposedJob.privateDescription
    )
    expect(updatedActiveJob?.workers.map(w => w.id)).toContain(worker.id)
    expect(updatedActiveJob?.responsibleWorkerId).toBe(
      payload.responsibleWorkerId
    )

    await api.deletePlan(plan.id)
  })

  it('moves workers between jobs', async function () {
    const { plan, area, job } = await api.createPlanWithJob()
    const proposedJob = await api.createProposedJob(area.id)
    const job2 = await api.post(`/api/plans/${plan.id}/active-jobs`, Id.PLANS, {
      proposedJobId: proposedJob.id,
      planId: plan.id,
    })
    // Add worker to job 1
    const worker = await api.createWorker()
    const payload = {
      workerIds: [worker.id],
      responsibleWorkerId: worker.id,
    }
    await api.patch(
      `/api/plans/${plan.id}/active-jobs/${job.id}`,
      Id.PLANS,
      payload
    )
    // Move worker to job 2
    const moved = await api.patch(
      `/api/plans/${plan.id}/active-jobs/${job2.body.id}`,
      Id.PLANS,
      payload
    )
    expect(moved.status).toBe(204)
    // Check that worker is in job 2
    const updatedPlan = await api.get(`/api/plans/${plan.id}`, Id.PLANS)
    const updatedActiveJob1 = (updatedPlan.body.jobs as any[]).find(
      j => j.id === job.id
    )
    const updatedActiveJob2 = (updatedPlan.body.jobs as any[]).find(
      j => j.id === job2.body.id
    )
    expect(updatedActiveJob1?.workers.map(w => w.id)).not.toContain(worker.id)
    expect(updatedActiveJob1?.responsibleWorkerId).toBeNull()
    expect(updatedActiveJob2?.workers.map(w => w.id)).toContain(worker.id)

    await api.deletePlan(plan.id)
  })

  it('creates a ride for job', async function () {
    const { plan, job } = await api.createPlanWithJob()
    const worker = await api.createWorker()
    const car = await api.createCar(worker.id)
    const payload = {
      carId: car.id,
      driverId: worker.id,
      passengerIds: [],
    }
    const ride = await api.post(
      `/api/plans/${plan.id}/active-jobs/${job.id}/rides`,
      Id.PLANS,
      payload
    )
    expect(ride.status).toBe(201)
    expect(ride.body && typeof ride.body).toBe('object')
    expect(ride.body).toHaveProperty('id')
    expect(ride.body).toHaveProperty('carId')
    expect(ride.body).toHaveProperty('driverId')
    expect(ride.body).toHaveProperty('jobId')
    expect(ride.body.carId).toBe(car.id)
    expect(ride.body.driverId).toBe(worker.id)
    expect(ride.body.jobId).toBe(job.id)

    await api.deletePlan(plan.id)
  })

  it('updates a ride for job', async function () {
    const data = await api.createPlanWithJobsAndRide()
    const newPassengers = data.jobs[1].workerIds
    const update = await api.patch(
      `/api/plans/${data.plan.id}/active-jobs/${data.jobs[0].id}/rides/${data.jobs[0].ride.id}`,
      Id.PLANS,
      { passengerIds: newPassengers }
    )
    expect(update.status).toBe(204)
    const plan = await api.get(`/api/plans/${data.plan.id}`, Id.PLANS)
    const job = (plan.body.jobs as any[]).find(j => j.id === data.jobs[0].id)
    expect(job?.rides[0].passengers).toHaveLength(2)
    expect(job?.rides[0].passengers.map(p => p.id)).toContain(newPassengers[0])

    await api.deletePlan(data.plan.id)
  })

  it('deletes a ride from job', async function () {
    const data = await api.createPlanWithJobsAndRide()
    const del = await api.del(
      `/api/plans/${data.plan.id}/active-jobs/${data.jobs[0].id}/rides/${data.jobs[0].ride.id}`,
      Id.PLANS
    )
    expect(del.status).toBe(204)
    const plan = await api.get(`/api/plans/${data.plan.id}`, Id.PLANS)
    const job = (plan.body.jobs as any[]).find(j => j.id === data.jobs[0].id)
    expect(job?.rides).toHaveLength(0)

    await api.deletePlan(data.plan.id)
  })
  afterAll(api.afterTestBlock)
})
