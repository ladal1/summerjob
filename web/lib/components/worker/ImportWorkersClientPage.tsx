'use client'
import {
  capitalizeFirstLetter,
  formatDateNumeric,
  formatDateShort,
  formatPhoneNumber,
} from 'lib/helpers/helpers'
import { useMemo, useState } from 'react'
import EditBox from '../forms/EditBox'
import PageHeader from '../page-header/PageHeader'
import { WorkerCreateData, WorkerCreateSchema } from 'lib/types/worker'
import { useAPIWorkersCreate } from 'lib/fetcher/worker'
import ErrorMessageModal from '../modal/ErrorMessageModal'
import { useRouter } from 'next/navigation'
import SuccessProceedModal from '../modal/SuccessProceedModal'
import { Allergy, Skill } from '../../prisma/client'

interface ImportWorkersClientPageProps {
  eventName: string
  eventStartDate: string
  eventEndDate: string
}

export default function ImportWorkersClientPage({
  eventName,
  eventStartDate,
  eventEndDate,
}: ImportWorkersClientPageProps) {
  const { trigger, isMutating, error, reset } = useAPIWorkersCreate({
    onSuccess: () => setSaved(true),
  })
  const [importData, setImportData] = useState('')
  const [saved, setSaved] = useState(false)

  const workers = useMemo(() => {
    const startDate = new Date(eventStartDate)
    const endDate = new Date(eventEndDate)
    const lines = importData.split('\n').filter(line => line.length > 0)
    const workers = lines.map(l => getWorkerInfo(l, startDate, endDate))
    return workers
  }, [importData, eventStartDate, eventEndDate])

  const isImportAllowed = useMemo(() => {
    return !isMutating && workers.every(w => w.success) && workers.length > 0
  }, [workers, isMutating])

  const errorMessage = useMemo(() => {
    if (error && error.reason) {
      return error.reason
    }
    return JSON.stringify(error)
  }, [error])

  const startImport = () => {
    const validWorkers = workers.filter(isSuccessfulResult).map(w => w.data)
    trigger({ workers: validWorkers })
  }

  const router = useRouter()
  const closeConfirmation = () => {
    setSaved(false)
    router.back()
  }
  return (
    <>
      <PageHeader title="Hromadný import pracantů" isFluid={false}>
        {}
      </PageHeader>
      <section>
        <div className="container mb-2">
          <EditBox>
            <div>
              Aktivní ročník: <b>{eventName}</b>,{' '}
              {formatDateNumeric(new Date(eventStartDate))} až{' '}
              {formatDateNumeric(new Date(eventEndDate))}
            </div>
            <p>
              Pokud chcete přidat pracanty do jiného ročníku, aktivujte daný
              ročník v administraci.
            </p>
            <div>
              Import akceptuje data oddělená středníkem v následujícím formátu:
              <pre>
                Jméno;Příjmení;Věk;E-mail;Telefonní číslo;Alergie;Dovednosti;Dny práce;Dny adorace
              </pre>
              Příklad:
              <pre>
                Jan;Novák;19;jan.novak@gmail.com;+420123456789;DUST,ANIMALS;2022/07/01,2022/07/02,2022/07/04;2022/07/02,2022/07/04
              </pre>
            </div>
            <p>
              Seznam evidovaných alergií: {Object.values(Allergy).join(', ')}
              <br />
              Seznam evidovaných dovedností: {Object.values(Skill).join(', ')}
              <br />
              Datum je možné zadat i v jiném formátu. Před importem zkontrolujte
              níže, že se data naimportují správně.
            </p>
            <label className="fw-bold" htmlFor="data">
              Vložte data:
            </label>
            <textarea
              name="data"
              className="form-control border p-1"
              rows={10}
              placeholder="Jméno;Příjmení;Věk;E-mail;Telefonní číslo;Alergie;Dovednosti;Dny práce;Dny adorace"
              value={importData}
              onChange={e => setImportData(e.target.value)}
            />
            <h4 className="mt-3">Náhled</h4>
            <div>
              Správně zadané: {workers.filter(w => w.success).length}
              <br />
              Chybně zadané: {workers.filter(w => !w.success).length}
            </div>
            <ul className="list-group">
              {workers.map((worker, i) => (
                <ResultBox key={i} result={worker} index={i + 1} />
              ))}
            </ul>
            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-primary mt-3"
                disabled={!isImportAllowed}
                onClick={() => startImport()}
              >
                Importovat
              </button>
            </div>
          </EditBox>
        </div>
      </section>
      {error && <ErrorMessageModal onClose={reset} details={errorMessage} />}
      {saved && <SuccessProceedModal onClose={closeConfirmation} />}
    </>
  )
}

function ResultBox({
  result,
  index,
}: {
  result: WorkerParsingResult
  index: number
}) {
  return (
    <li
      className={`list-group-item ${
        result.success ? '' : 'list-group-item-danger'
      }`}
    >
      {result.success ? (
        <>
          {`(${index})`}
          <b>
            {' '}
            {result.data.firstName} {result.data.lastName}
            {', '}
            {result.data.age}
          </b>{' '}
          <small className="text-muted">
            {result.data.email} {result.data.phone}
          </small>
          <br />
          <small className="text-muted">
            Alergie: {result.data.allergyIds.join(', ')}
          </small>
          <br />
          <small className="text-muted">
            Dovednosti: {result.data.skills.join(', ')}
          </small>
          <br />
          <small className="text-muted">
            Pracuje:{' '}
            {result.data.availability.workDays
              .map(d => capitalizeFirstLetter(formatDateShort(d)))
              .join(', ')}
          </small>
          <br />
          <small className="text-muted">
            Adoruje:{' '}
            {result.data.availability.adorationDays
              .map(d => capitalizeFirstLetter(formatDateShort(d)))
              .join(', ')}
          </small>
        </>
      ) : (
        <>
          {`(${index})`} {result.error}
        </>
      )}
    </li>
  )
}

function isSuccessfulResult(
  result: WorkerParsingResult
): result is { success: true; data: WorkerCreateData } {
  return result.success
}

type WorkerParsingResult =
  | { success: true; data: WorkerCreateData }
  | { success: false; error: string }

function getWorkerInfo(
  line: string,
  eventStart: Date,
  eventEnd: Date
): WorkerParsingResult {
  const lineWithError = (error: string) =>
    [line.length > 40 ? line.substring(0, 37) + '...' : line, error].join(': ')
  const [
    firstName,
    lastName,
    age,
    email,
    phone,
    allergiesStr,
    skillsStr,
    workDaysStr,
    adorationDaysStr,
  ] = line.split(';')
  if (adorationDaysStr === undefined) {
    return { success: false, error: 'Missing data' }
  }
  const formatedPhone = formatPhoneNumber(phone)
  const allergies = allergiesStr.split(',').filter(a => a.trim() !== '')
  const skills = skillsStr.split(',').filter(a => a.trim() !== '')
  const workDays = workDaysStr
    .split(',')
    .filter(a => a.trim() !== '')
    .map(date => date + ' GMT')
  const adorationDays =
    adorationDaysStr
      ?.split(',')
      .filter(a => a.trim() !== '')
      .map(date => date + ' GMT') ?? []
  const parsed = WorkerCreateSchema.safeParse({
    firstName,
    lastName,
    age: +age,
    email,
    phone: formatedPhone,
    strong: false,
    allergyIds: allergies,
    skills,
    availability: {
      workDays,
      adorationDays,
    },
    photoFile: undefined,
  })
  if (!parsed.success) {
    const error = parsed.error.issues
      .map(
        i =>
          `${i.message} (${i.path
            .filter(p => typeof p === 'string')
            .join(', ')})`
      )
      .join(', ')

    return { success: false, error: lineWithError(error) }
  }
  // Check that all dates are within the event
  for (const date of [
    ...parsed.data.availability.workDays,
    ...parsed.data.availability.adorationDays,
  ]) {
    if (date < eventStart || date > eventEnd) {
      return {
        success: false,
        error: lineWithError(
          `Date ${formatDateNumeric(date)} is outside of the event`
        ),
      }
    }
  }
  return { success: true, data: parsed.data }
}
