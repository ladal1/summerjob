'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  deserializeWorker,
  WorkerComplete,
  WorkerUpdateSchema,
} from 'lib/types/worker'
import { useState } from 'react'
import { useAPIWorkerUpdate } from 'lib/fetcher/worker'
import Link from 'next/link'
import AllergyPill from '../forms/AllergyPill'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { Serialized } from 'lib/types/serialize'
import DaysSelection from '../forms/DaysSelection'
import { datesBetween, pick } from 'lib/helpers/helpers'
import { useRouter } from 'next/navigation'
import FormWarning from '../forms/FormWarning'
import { Allergy } from '../../prisma/client'
import { allergyMapping } from 'lib/data/allergyMapping'

const schema = WorkerUpdateSchema
type WorkerForm = z.input<typeof schema>

interface EditWorkerProps {
  serializedWorker: Serialized<WorkerComplete>
  eventStartDate: string
  eventEndDate: string
  isProfilePage: boolean
}

export default function EditWorker({
  serializedWorker,
  eventStartDate,
  eventEndDate,
  isProfilePage,
}: EditWorkerProps) {
  const worker = deserializeWorker(serializedWorker)
  const allDates = datesBetween(
    new Date(eventStartDate),
    new Date(eventEndDate)
  )
  const {
    formState: { dirtyFields },
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkerForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.email,
      phone: worker.phone,
      strong: worker.isStrong,
      allergyIds: worker.allergies as Allergy[],
      availability: {
        workDays: worker.availability.workDays.map(day => day.toJSON()),
        adorationDays: worker.availability.adorationDays.map(day =>
          day.toJSON()
        ),
      },
    },
  })

  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const { trigger, isMutating, reset, error } = useAPIWorkerUpdate(worker.id, {
    onSuccess: () => {
      setSaved(true)
      router.refresh()
    },
  })

  const onSubmit = (data: WorkerForm) => {
    const modified = pick(data, ...Object.keys(dirtyFields)) as WorkerForm
    trigger(modified)
  }

  const onConfirmationClosed = () => {
    setSaved(false)
    if (!isProfilePage) {
      router.back()
    }
  }

  return (
    <>
      <div className="row">
        <div className="col">
          <h3>
            {worker.firstName} {worker.lastName}
          </h3>
        </div>
      </div>
      <div className="row">
        <div className="col">
          <form onSubmit={handleSubmit(onSubmit)}>
            <label className="form-label fw-bold mt-4" htmlFor="name">
              Jméno
            </label>
            <input
              id="name"
              className="form-control p-0 fs-5"
              type="text"
              placeholder="Jméno"
              {...register('firstName')}
            />
            <FormWarning message={errors.firstName?.message} />
            <label className="form-label fw-bold mt-4" htmlFor="surname">
              Příjmení
            </label>
            <input
              id="surname"
              className="form-control p-0 fs-5"
              type="text"
              placeholder="Příjmení"
              {...register('lastName')}
            />
            <FormWarning message={errors.lastName?.message} />
            <label className="form-label fw-bold mt-4" htmlFor="phone">
              Telefonní číslo
            </label>
            <input
              id="phone"
              className="form-control p-0 fs-5"
              type="tel"
              maxLength={20}
              pattern="((?:\+|00)[0-9]{1,3})?[ ]?[0-9]{3}[ ]?[0-9]{3}[ ]?[0-9]{3}"
              placeholder="(+420) 123 456 789"
              {...register('phone')}
            />
            <FormWarning message={errors.phone?.message} />
            <label className="form-label fw-bold mt-4" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              className="form-control p-0 fs-5"
              type="email"
              {...register('email')}
            />
            <FormWarning message={errors.email?.message} />
            <p className="text-muted mt-1">
              {isProfilePage
                ? 'Změnou e-mailu dojde k odhlášení z aplikace.'
                : 'Změnou e-mailu dojde k odhlášení uživatele z aplikace.'}
            </p>
            <label
              className="form-label d-block fw-bold mt-4"
              htmlFor="availability.workDays"
            >
              {isProfilePage
                ? 'Můžu pracovat v následující dny'
                : 'Může pracovat v následující dny'}
            </label>
            <DaysSelection
              name="availability.workDays"
              days={allDates}
              register={() => register('availability.workDays')}
            />
            <label
              className="form-label d-block fw-bold mt-4"
              htmlFor="availability.adorationDays"
            >
              {isProfilePage
                ? 'Chci adorovat v následující dny'
                : 'Chce adorovat v následující dny'}
            </label>
            <DaysSelection
              name="availability.adorationDays"
              days={allDates}
              register={() => register('availability.adorationDays')}
            />
            <label
              className="form-label d-block fw-bold mt-4"
              htmlFor="allergy"
            >
              Alergie
            </label>
            <div className="form-check-inline">
              {Object.entries(allergyMapping).map(
                ([allergyKey, allergyName]) => (
                  <AllergyPill
                    key={allergyKey}
                    allergyId={allergyKey}
                    allergyName={allergyName}
                    register={() => register('allergyIds')}
                  />
                )
              )}
            </div>
            <label className="form-label d-block fw-bold mt-4">
              Další vlastnosti
            </label>
            <div className="form-check align-self-center align-items-center d-flex gap-2 ms-2">
              <input
                type="checkbox"
                className="fs-5 form-check-input"
                id="strong"
                {...register('strong')}
              />
              <label className="form-check-label" htmlFor="strong">
                Silák
                <i className="fas fa-dumbbell ms-2"></i>
              </label>
            </div>
            <label className="form-label d-block fw-bold mt-4" htmlFor="car">
              Auta
            </label>
            {isProfilePage && worker.cars.length === 0 && (
              <p>Pro přiřazení auta kontaktujte tým SummerJob.</p>
            )}
            {isProfilePage && worker.cars.length > 0 && (
              <div className="list-group">
                {worker.cars.map(car => (
                  <div key={car.id} className="list-group-item ps-2 w-50">
                    {car.name}
                  </div>
                ))}
              </div>
            )}
            {!isProfilePage && worker.cars.length === 0 && <p>Žádná auta</p>}
            {!isProfilePage && worker.cars.length > 0 && (
              <div className="list-group">
                {worker.cars.map(car => (
                  <Link
                    key={car.id}
                    href={`/cars/${car.id}`}
                    className="list-group-item list-group-item-action ps-2 d-flex align-items-center justify-content-between w-50"
                  >
                    {car.name}
                    <i className="fas fa-angle-right ms-2"></i>
                  </Link>
                ))}
              </div>
            )}
            {!isProfilePage && (
              <div>
                <label className="form-label fw-bold mt-4" htmlFor="note">
                  Poznámka
                </label>
                <input
                  id="note"
                  className="form-control p-0 fs-5"
                  type="text"
                  placeholder="Poznámka"
                  {...register('note')}
                />
              </div>
            )}

            <div className="d-flex justify-content-between gap-3">
              <button
                className="btn btn-secondary mt-4"
                type="button"
                onClick={() => router.back()}
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
            {saved && <SuccessProceedModal onClose={onConfirmationClosed} />}
            {error && <ErrorMessageModal onClose={reset} />}
          </form>
        </div>
      </div>
    </>
  )
}
