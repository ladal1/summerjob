'use client'
import { Serialized } from 'lib/types/serialize'
import {
  deserializeWorkAllergies,
  WorkAllergyComplete,
} from 'lib/types/work-allergy'
import { useAPIWorkAllergies } from 'lib/fetcher/work-allergy'
import { WorkAllergiesTable } from './WorkAllergiesTable'

interface WorkAllergiesClientPageProps {
  initialData: Serialized
}

export default function WorkAllergiesClientPage({
  initialData,
}: WorkAllergiesClientPageProps) {
  const initialWorkAllergies = deserializeWorkAllergies(initialData)
  const { data, mutate } = useAPIWorkAllergies({
    fallbackData: initialWorkAllergies,
  })

  const requestReload = (expectedResult: WorkAllergyComplete[]) => {
    mutate(expectedResult)
  }

  return (
    <>
      <section>
        <div className="container-fluid">
          <h3>Pracovní alergie</h3>
          <div className="row gx-3"></div>
          <div className="row gx-3">
            <div className="col-lg-10 pb-2">
              <WorkAllergiesTable data={data} reload={requestReload} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
