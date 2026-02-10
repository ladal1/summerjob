'use client'
import {
  capitalizeFirstLetter,
  convertToISOFormat,
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
import { foodAllergyMapping } from 'lib/data/enumMapping/foodAllergyMapping'
import { workAllergyMapping } from 'lib/data/enumMapping/workAllergyMapping'
import { useAPIFoodAllergies } from 'lib/fetcher/food-allergy'
import { useAPIWorkAllergies } from 'lib/fetcher/work-allergy'
import { useAPISkills } from 'lib/fetcher/skill'

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

  const { data: foodAllergies = [] } = useAPIFoodAllergies()
  const { data: workAllergies = [] } = useAPIWorkAllergies()
  const { data: skills = [] } = useAPISkills()

  const foodAllergyNameToId = useMemo(
    () =>
      new Map(foodAllergies.map(fa => [fa.name.trim().toLowerCase(), fa.id])),
    [foodAllergies]
  )
  const workAllergyNameToId = useMemo(
    () =>
      new Map(workAllergies.map(wa => [wa.name.trim().toLowerCase(), wa.id])),
    [workAllergies]
  )
  const SkillNameToId = useMemo(
    () => new Map(skills.map(s => [s.name.trim().toLowerCase(), s.id])),
    [skills]
  )

  const foodAllergyIdToName = useMemo(
    () => new Map(foodAllergies.map(fa => [fa.id, fa.name])),
    [foodAllergies]
  )
  const workAllergyIdToName = useMemo(
    () => new Map(workAllergies.map(wa => [wa.id, wa.name])),
    [workAllergies]
  )
  const skillIdToName = useMemo(
    () => new Map(skills.map(s => [s.id, s.name])),
    [skills]
  )

  const workers = useMemo(() => {
    const startDate = new Date(eventStartDate)
    const endDate = new Date(eventEndDate)
    const lines = importData.split('\n').filter(line => line.length > 0)
    const workers = lines.map(l =>
      getWorkerInfo(
        l,
        startDate,
        endDate,
        foodAllergyNameToId,
        workAllergyNameToId,
        SkillNameToId
      )
    )
    return workers
  }, [
    importData,
    eventStartDate,
    eventEndDate,
    foodAllergyNameToId,
    workAllergyNameToId,
    SkillNameToId,
  ])

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

  const datesExample = () => {
    const start = new Date(eventStartDate)
    const end = new Date(eventEndDate)
    const startISO = convertToISOFormat(start)
    let endISO = ''
    if (start.getTime() < end.getTime()) {
      endISO = convertToISOFormat(end)
    }
    const workDaysExample = startISO + (endISO ? `,${endISO}` : '')
    return workDaysExample
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
                Jméno;Příjmení;Věk;E-mail;Telefonní číslo;Potravinové
                alergie;Pracovní alergie;Dovednosti;Dny práce
              </pre>
              Příklad:
              <pre>
                {`Jan;Novák;19;jan.novak@gmail.com;+420123456789;Lepek,Vejce;Prach;Dřevorubec;${datesExample()}`}
              </pre>
            </div>
            <p>
              Seznam potravinových alergií:{' '}
              {foodAllergies.map(a => a.name).join(', ')}
              <br />
              Seznam pracovních alergií:{' '}
              {workAllergies.map(a => a.name).join(', ')}
              <br />
              Seznam evidovaných dovedností:{' '}
              {skills.map(s => s.name).join(', ')}
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
              placeholder="Jméno;Příjmení;Věk;E-mail;Telefonní číslo;Alergie;Dovednosti;Dny práce"
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
                <ResultBox
                  key={i}
                  result={worker}
                  index={i + 1}
                  foodAllergyIdToName={foodAllergyIdToName}
                  workAllergyIdToName={workAllergyIdToName}
                  skillIdToName={skillIdToName}
                />
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
  foodAllergyIdToName,
  workAllergyIdToName,
  skillIdToName,
}: {
  result: WorkerParsingResult
  index: number
  foodAllergyIdToName: Map<string, string>
  workAllergyIdToName: Map<string, string>
  skillIdToName: Map<string, string>
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
            Potravinové alergie:{' '}
            {result.data.foodAllergies.length > 0
              ? result.data.foodAllergies
                  .map(a => foodAllergyIdToName.get(a))
                  .join(', ')
              : 'Žádné'}
          </small>
          <br />
          <small className="text-muted">
            Pracovní alergie:{' '}
            {result.data.workAllergies.length > 0
              ? result.data.workAllergies
                  .map(a => workAllergyIdToName.get(a))
                  .join(', ')
              : 'Žádné'}
          </small>
          <br />
          <small className="text-muted">
            Dovednosti:{' '}
            {result.data.skills.length > 0
              ? result.data.skills.map(s => skillIdToName.get(s)).join(', ')
              : 'Žádné'}
          </small>
          <br />
          <small className="text-muted">
            Pracuje:{' '}
            {result.data.availability.workDays
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
  eventEnd: Date,
  foodAllergyNameToId: Map<string, string>,
  workAllergyNameToId: Map<string, string>,
  skillNameToId: Map<string, string>
): WorkerParsingResult {
  const lineWithError = (error: string) =>
    [line.length > 40 ? line.substring(0, 37) + '...' : line, error].join(': ')
  const [
    firstName,
    lastName,
    age,
    email,
    phone,
    foodAllergiesStr,
    workAllergiesStr,
    skillsStr,
    workDaysStr,
  ] = line.split(';')
  if (workDaysStr === undefined) {
    return { success: false, error: 'Missing data' }
  }
  const formatedPhone = formatPhoneNumber(phone)

  const parsedFoodAllergies = foodAllergiesStr
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(a => a !== '')
  const parsedWorkAllergies = workAllergiesStr
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(a => a !== '')
  const parsedSkills = skillsStr
    .split(',')
    .map(a => a.trim().toLowerCase())
    .filter(a => a !== '')

  const foodAllergies = parsedFoodAllergies
    .filter(fa => foodAllergyNameToId.get(fa))
    .map(fa => foodAllergyNameToId.get(fa))
  const workAllergies = parsedWorkAllergies
    .filter(wa => workAllergyNameToId.get(wa))
    .map(wa => workAllergyNameToId.get(wa))
  const skills = parsedSkills
    .filter(s => skillNameToId.get(s))
    .map(s => skillNameToId.get(s))
  console.log('skills ids', skills)
  console.log('workAllergies ids', workAllergies)

  const unknownFoodAllergies = parsedFoodAllergies.filter(
    fa => !foodAllergyNameToId.get(fa)
  )
  const unknownWorkAllergies = parsedWorkAllergies.filter(
    wa => !workAllergyNameToId.get(wa)
  )
  const unknownSkills = parsedSkills.filter(s => !skillNameToId.get(s))

  if (unknownFoodAllergies.length > 0) {
    return {
      success: false,
      error: lineWithError(
        `Neznámé alergie na jídlo: ${unknownFoodAllergies.join(', ')}`
      ),
    }
  }
  if (unknownWorkAllergies.length > 0) {
    return {
      success: false,
      error: lineWithError(
        `Neznámé pracovní alergie: ${unknownWorkAllergies.join(', ')}`
      ),
    }
  }
  if (unknownSkills.length > 0) {
    return {
      success: false,
      error: lineWithError(`Neznámé dovednosti: ${unknownSkills.join(', ')}`),
    }
  }

  const workDays = workDaysStr
    .split(',')
    .filter(a => a.trim() !== '')
    .map(date => date + ' GMT')
  const parsed = WorkerCreateSchema.safeParse({
    firstName,
    lastName,
    age: +age,
    email,
    phone: formatedPhone,
    strong: false,
    team: false,
    foodAllergies,
    workAllergies,
    skills,
    tools: [],
    availability: {
      workDays,
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
  for (const date of parsed.data.availability.workDays) {
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
