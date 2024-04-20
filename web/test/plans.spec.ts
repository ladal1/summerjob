/* import { faker } from '@faker-js/faker'
import { Id, api, createPlanData } from './common'
import chai from 'chai'

const should = chai.should()

describe('Plans', function () {
  it('should show empty list of plans', async function () {
    const plans = await api.get('/api/plans', Id.PLANS)
    plans.status.should.equal(200)
    plans.body.should.be.an('array')
    plans.body.should.have.lengthOf(0)
  })

  it('creates a plan', async function () {
    const firstPlan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventStart())
    )
    firstPlan.status.should.equal(201)
    firstPlan.body.should.have.property('id')

    const lastPlan = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventEnd())
    )
    lastPlan.status.should.equal(201)
    lastPlan.body.should.have.property('id')

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
    plans.status.should.equal(200)
    plans.body.should.be.an('array')
    plans.body.should.have.lengthOf(1)

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
    deleted.status.should.equal(204)

    const plansAfterDelete = await api.get('/api/plans', Id.PLANS)
    plansAfterDelete.body.should.have.lengthOf(plans.body.length - 1)
  })

  it('returns a plan by id', async function () {
    const created = await api.post(
      '/api/plans',
      Id.PLANS,
      createPlanData(api.getSummerJobEventEnd())
    )
    const plan = await api.get(`/api/plans/${created.body.id}`, Id.PLANS)
    plan.status.should.equal(200)
    plan.body.should.be.an('object')
    plan.body.should.have.property('id')

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
    addToPlan.status.should.equal(201)
    addToPlan.body.planId.should.equal(plan.body.id)
    addToPlan.body.proposedJobId.should.equal(job.id)

    const planWithJob = await api.get(`/api/plans/${plan.body.id}`, Id.PLANS)
    planWithJob.body.jobs.should.have.lengthOf(1)

    await api.del(`/api/plans/${plan.body.id}`, Id.PLANS)
  })

  it('returns a job by id', async function () {
    const { plan, job } = await api.createPlanWithJob()
    const activeJob = await api.get(
      `/api/plans/${plan.id}/active-jobs/${job.id}`,
      Id.PLANS
    )
    activeJob.status.should.equal(200)
    activeJob.body.should.be.an('object')
    activeJob.body.should.have.property('id')
    activeJob.body.should.have.property('planId')
    activeJob.body.should.have.property('proposedJobId')
    activeJob.body.id.should.equal(job.id)
    activeJob.body.planId.should.equal(plan.id)

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
    removed.status.should.equal(204)

    const planWithoutJob = await api.get(`/api/plans/${plan.body.id}`, Id.PLANS)
    planWithoutJob.body.jobs.should.have.lengthOf(0)

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
    updated.status.should.equal(204)
    const updatedPlan = await api.get(`/api/plans/${plan.id}`, Id.PLANS)
    const updatedActiveJob = (updatedPlan.body.jobs as any[]).find(
      j => j.id === job.id
    )
    updatedActiveJob.proposedJob.privateDescription.should.equal(
      payload.proposedJob.privateDescription
    )
    updatedActiveJob.workers.map(w => w.id).should.include(worker.id)
    updatedActiveJob.responsibleWorkerId.should.equal(
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
    moved.status.should.equal(204)
    // Check that worker is in job 2
    const updatedPlan = await api.get(`/api/plans/${plan.id}`, Id.PLANS)
    const updatedActiveJob1 = (updatedPlan.body.jobs as any[]).find(
      j => j.id === job.id
    )
    const updatedActiveJob2 = (updatedPlan.body.jobs as any[]).find(
      j => j.id === job2.body.id
    )
    updatedActiveJob1.workers.map(w => w.id).should.not.include(worker.id)
    should.equal(updatedActiveJob1.responsibleWorkerId, null)
    updatedActiveJob2.workers.map(w => w.id).should.include(worker.id)

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
    ride.status.should.equal(201)
    ride.body.should.be.an('object')
    ride.body.should.have.property('id')
    ride.body.should.have.property('carId')
    ride.body.should.have.property('driverId')
    ride.body.should.have.property('jobId')
    ride.body.carId.should.equal(car.id)
    ride.body.driverId.should.equal(worker.id)
    ride.body.jobId.should.equal(job.id)

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
    update.status.should.equal(204)
    const plan = await api.get(`/api/plans/${data.plan.id}`, Id.PLANS)
    const job = (plan.body.jobs as any[]).find(j => j.id === data.jobs[0].id)
    job.rides[0].passengers.should.have.lengthOf(2)
    job.rides[0].passengers.map(p => p.id).should.include(newPassengers[0])

    await api.deletePlan(data.plan.id)
  })

  it('deletes a ride from job', async function () {
    const data = await api.createPlanWithJobsAndRide()
    const del = await api.del(
      `/api/plans/${data.plan.id}/active-jobs/${data.jobs[0].id}/rides/${data.jobs[0].ride.id}`,
      Id.PLANS
    )
    del.status.should.equal(204)
    const plan = await api.get(`/api/plans/${data.plan.id}`, Id.PLANS)
    const job = (plan.body.jobs as any[]).find(j => j.id === data.jobs[0].id)
    job.rides.should.have.lengthOf(0)

    await api.deletePlan(data.plan.id)
  })

  this.afterAll(api.afterTestBlock)
})
 */
