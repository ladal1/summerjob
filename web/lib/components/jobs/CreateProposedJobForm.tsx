'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAPIProposedJobCreate } from 'lib/fetcher/proposed-job'
import { Area, JobType } from 'lib/prisma/client'
import { deserializeAreas } from 'lib/types/area'
import {
  ProposedJobCreateData,
  ProposedJobCreateSchema,
} from 'lib/types/proposed-job'
import { Serialized } from 'lib/types/serialize'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FilterSelect, FilterSelectItem } from '../filter-select/FilterSelect'
import AllergyPill from '../forms/AllergyPill'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { allergyMapping } from '../../data/allergyMapping'
import { jobTypeMapping } from '../../data/jobTypeMapping'
import { DateSelectionInput } from '../forms/input/DateSelectionInput'
import { TextInput } from '../forms/input/TextInput'
import { TextAreInput } from '../forms/input/TextAreaInput'
import { FilterSelectInput } from '../forms/input/FilterSelectInput'
import { allowForNumber, formatNumber } from 'lib/helpers/helpers'
import { Label } from '../forms/Label'
import FormWarning from '../forms/FormWarning'

interface CreateProposedJobProps {
  serializedAreas: Serialized
  allDates: DateBool[][]
}

export default function CreateProposedJobForm({
  serializedAreas,
  allDates,
}: CreateProposedJobProps) {
  const areas = deserializeAreas(serializedAreas)
  const { trigger, error, isMutating, reset } = useAPIProposedJobCreate()
  const [saved, setSaved] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProposedJobCreateData>({
    resolver: zodResolver(ProposedJobCreateSchema),
    defaultValues: {
      availability: [],
      allergens: [],
      areaId: undefined,
      jobType: JobType.OTHER,
    },
  })

  const onSubmit = (data: ProposedJobCreateData) => {
    trigger(data, {
      onError: e => {
        console.log(e)
      },
      onSuccess: () => {
        setSaved(true)
      },
    })
  }

  const selectArea = (item: FilterSelectItem) => {
    setValue('areaId', item.id)
  }
  const selectJobType = (item: FilterSelectItem) => {
    setValue('jobType', item.id as JobType)
  }

  const jobTypeSelectItems = Object.entries(jobTypeMapping).map(
    ([jobTypeKey, jobTypeToSelectName]) => ({
      id: jobTypeKey,
      name: jobTypeToSelectName,
      searchable: jobTypeToSelectName,
      item: <span> {jobTypeToSelectName} </span>,
    })
  )

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>Přidat job</h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <TextInput
              id="name"
              label="Název jobu"
              placeholder="Název"
              register={() => register("name")}
              errors={errors}
            />
            <TextAreInput
              id="publicDescription"
              label="Popis navrhované práce"
              placeholder="Popis"
              rows={4}
              register={() => register("publicDescription")}
            />
            <TextAreInput
              id="privateDescription"
              label="Poznámka pro organizátory"
              placeholder="Poznámka"
              rows={4}
              register={() => register("privateDescription")}
            />
            <FilterSelectInput
              id="areaId"
              label="Oblast jobu"
              placeholder="Vyberte oblast"
              items={areas.map(areaToSelectItem)}
              onSelect={selectArea}
              errors={errors}
              register={() => register('areaId')}
            />
            <TextInput
              id="address"
              label="Adresa"
              placeholder="Adresa"
              register={() => register("address")}
              errors={errors}
            />
            <TextInput
              id="contact"
              label="Kontakt"
              placeholder="Kontakt"
              register={() => register("contact")}
              errors={errors}
            />
            <TextInput
              id="requiredDays"
              label="Celkový počet dní na splnění"
              placeholder="Počet dní"
              type="number"
              min={1}
              defaultValue={1}
              onKeyDown={(e) => allowForNumber(e)}
              register={() => register("requiredDays", {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              errors={errors}
            />

            <Label
              id="minWorkers"
              label="Počet pracantů minimálně / maximálně / z toho silných"
            />
            <div className="d-flex w-50">
              <input
                className="form-control p-1 ps-2"
                id="minWorkers"
                type="number"
                min={1}
                defaultValue={1}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('minWorkers', { valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
              /
              <input
                className="form-control p-1 ps-2"
                id="maxWorkers"
                type="number"
                min={1}
                defaultValue={1}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('maxWorkers', {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
              /
              <input
                className="form-control p-1 ps-2"
                id="strongWorkers"
                type="number"
                min={0}
                defaultValue={0}
                onKeyDown={(e) => allowForNumber(e)}
                {...register('strongWorkers', {valueAsNumber: true, onChange: (e) => e.target.value = formatNumber(e.target.value)})}
              />
            </div>
            {(errors.minWorkers ||
              errors.maxWorkers ||
              errors.strongWorkers) && (<FormWarning message={
                errors?.minWorkers?.message as string | undefined ||
                errors?.maxWorkers?.message as string | undefined ||
                errors?.strongWorkers?.message as string | undefined
              } />)}


            <div className="d-flex flex-row">
              <DateSelectionInput
                id="availability"
                label="Časová dostupnost"
                register={() => register("availability")}
                days={allDates}
              />
            </div>
            <div>
              <label className="form-label fw-bold mt-4" htmlFor="area">
                Typ práce
              </label>
              <input type={'hidden'} {...register('jobType')} />
              <FilterSelect
                items={jobTypeSelectItems}
                placeholder="Vyberte typ práce"
                onSelected={selectJobType}
                defaultSelected={jobTypeSelectItems.find(
                  item => item.id === JobType.OTHER
                )}
              />
              {errors.jobType && (
                <div className="text-danger">Vyberte typ práce</div>
              )}
            </div>
            <label className="form-label d-block fw-bold mt-4" htmlFor="email">
              Alergie
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
