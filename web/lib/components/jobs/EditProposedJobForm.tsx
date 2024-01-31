'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIProposedJobUpdate } from 'lib/fetcher/proposed-job'
import { datesBetween } from 'lib/helpers/helpers'
import {
  deserializeProposedJob,
  ProposedJobComplete,
  ProposedJobUpdateSchema,
} from 'lib/types/proposed-job'
import { Serialized } from 'lib/types/serialize'
import { WorkerBasicInfo } from 'lib/types/worker'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { FilterSelect, FilterSelectItem } from '../filter-select/FilterSelect'
import AllergyPill from '../forms/AllergyPill'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { allergyMapping } from 'lib/data/allergyMapping'
import { jobTypeMapping } from '../../data/jobTypeMapping'
import { JobType } from '../../prisma/client'
import { Area } from '../../prisma/zod'
import { deserializeAreas } from '../../types/area'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'

interface EditProposedJobProps {
  serializedJob: Serialized
  serializedAreas: Serialized
  allDates: DateBool[][]
}

const schema = ProposedJobUpdateSchema
type ProposedJobForm = z.input<typeof schema>

export default function EditProposedJobForm({
  serializedJob,
  serializedAreas,
  allDates,
}: EditProposedJobProps) {
  const job = deserializeProposedJob(serializedJob)
  const areas = deserializeAreas(serializedAreas)
  const { trigger, error, isMutating, reset } = useAPIProposedJobUpdate(job.id)
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProposedJobForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: job.name,
      publicDescription: job.publicDescription,
      privateDescription: job.privateDescription,
      allergens: job.allergens,
      address: job.address,
      contact: job.contact,
      requiredDays: job.requiredDays,
      minWorkers: job.minWorkers,
      maxWorkers: job.maxWorkers,
      strongWorkers: job.strongWorkers,
      hasFood: job.hasFood,
      hasShower: job.hasShower,
      availability: job.availability.map(day => day.toJSON()),
      jobType: job.jobType,
      areaId: job.areaId,
    },
  })

  const selectJobType = (item: FilterSelectItem) => {
    setValue('jobType', item.id as JobType)
  }

  const selectArea = (item: FilterSelectItem) => {
    setValue('areaId', item.id as string)
  }

  const onSubmit = (data: ProposedJobForm) => {
    trigger(data, {
      onSuccess: () => {
        setSaved(true)
      },
    })
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Upravit job</h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="form-label fw-bold mt-4" htmlFor="name">
              Název jobu
            </label>
            <input
              className="form-control p-1 ps-2"
              id="name"
              {...register('name')}
            />
            <label
              className="form-label fw-bold mt-4"
              htmlFor="publicDescription"
            >
              Popis navrhované práce
            </label>
            <textarea
              className="form-control border p-1 ps-2"
              id="publicDescription"
              rows={3}
              {...register('publicDescription')}
            ></textarea>
            <label
              className="form-label fw-bold mt-4"
              htmlFor="privateDescription"
            >
              Poznámka pro organizátory
            </label>
            <textarea
              className="form-control border p-1 ps-2"
              id="privateDescription"
              rows={3}
              {...register('privateDescription')}
            ></textarea>
            <label className="form-label fw-bold mt-4" htmlFor="area">
              Oblast jobu
            </label>
            <input type={'hidden'} {...register('areaId')} />
            <FilterSelect
              items={areas.map(areaToSelectItem)}
              placeholder={job.area?.name ?? 'Vyberte oblast'}
              onSelected={selectArea}
            />
            <label className="form-label fw-bold mt-4" htmlFor="address">
              Adresa
            </label>
            <input
              className="form-control p-1 ps-2"
              id="address"
              {...register('address')}
            />
            <label className="form-label fw-bold mt-4" htmlFor="contact">
              Kontakt
            </label>
            <input
              className="form-control p-1 ps-2"
              id="contact"
              {...register('contact')}
            />
            <label className="form-label fw-bold mt-4" htmlFor="requiredDays">
              Celkový počet dnů na splnění
            </label>
            <input
              className="form-control p-1 ps-2"
              id="requiredDays"
              {...register('requiredDays', { valueAsNumber: true })}
            />
            <label className="form-label fw-bold mt-4" htmlFor="minWorkers">
              Počet pracantů minimálně / maximálně / z toho silných
            </label>

            <div className="d-flex w-50">
              <input
                className="form-control p-1 ps-2"
                id="minWorkers"
                type="number"
                min={1}
                {...register('minWorkers', { valueAsNumber: true })}
              />
              /
              <input
                className="form-control p-1 ps-2"
                id="maxWorkers"
                type="number"
                min={1}
                {...register('maxWorkers', { valueAsNumber: true })}
              />
              /
              <input
                className="form-control p-1 ps-2"
                id="strongWorkers"
                type="number"
                min={0}
                {...register('strongWorkers', { valueAsNumber: true })}
              />
            </div>
            <div className="d-flex flex-row">
              <DateSelectionInput
                id="availability"
                label="Časová dostupnost"
                register={register}
                days={allDates}
              />
            </div>
            <div>
              <label className="form-label fw-bold mt-4" htmlFor="area">
                Typ práce
              </label>
              <input type={'hidden'} {...register('jobType')} />
              <FilterSelect
                items={Object.entries(jobTypeMapping).map(
                  ([jobTypeKey, jobTypeToSelectName]) => ({
                    id: jobTypeKey,
                    name: jobTypeToSelectName,
                    searchable: jobTypeToSelectName,
                    item: <span> {jobTypeToSelectName} </span>,
                  })
                )}
                placeholder={jobTypeMapping[job.jobType]}
                onSelected={selectJobType}
              />
              {errors.jobType && (
                <div className="text-danger">Vyberte typ práce</div>
              )}
            </div>

            <label className="form-label d-block fw-bold mt-4" htmlFor="email">
              Alergeny
            </label>
            <div className="form-check-inline">
              {Object.entries(allergyMapping).map(
                ([allergyKey, allergyName]) => (
                  <AllergyPill
                    key={allergyKey}
                    allergyId={allergyKey}
                    allergyName={allergyName}
                    register={() => register('allergens')}
                  />
                )
              )}
            </div>

            <div className="form-check mt-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="hasFood"
                {...register('hasFood')}
              />
              <label className="form-check-label" htmlFor="hasFood">
                <i className="fa fa-utensils ms-2 me-2"></i>
                Strava na místě
              </label>
            </div>
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="hasShower"
                {...register('hasShower')}
              />
              <label className="form-check-label" htmlFor="hasShower">
                <i className="fa fa-shower ms-2 me-2"></i>
                Sprcha na místě
              </label>
            </div>

            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary mt-4"
                type="button"
                onClick={() => window.history.back()}
              >
                Zpět
              </button>
              <input
                type={'submit'}
                className="btn btn-primary mt-4"
                value={'Uložit'}
                disabled={isMutating}
              />
            </div>
          </form>
        </div>
      </div>
      {saved && <SuccessProceedModal onClose={() => window.history.back()} />}
      {error && <ErrorMessageModal onClose={reset} />}
    </>
  )
}

function areaToSelectItem(area: Area): FilterSelectItem {
  return {
    id: area.id,
    searchable: `${area.name}`,
    name: area.name,
    item: <span>{area.name}</span>,
  }
}

function workerToSelectItem(worker: WorkerBasicInfo): FilterSelectItem {
  return {
    id: worker.id,
    searchable: `${worker.firstName} ${worker.lastName}`,
    name: `${worker.firstName} ${worker.lastName}`,
    item: (
      <span>
        {worker.firstName} {worker.lastName}
      </span>
    ),
  }
}
