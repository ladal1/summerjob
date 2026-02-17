'use client'
import { Serialized } from 'lib/types/serialize'
import { deserializeJobTypes, JobTypeComplete } from 'lib/types/job-type'
import { useAPIJobTypes } from 'lib/fetcher/job-type'
import { JobTypesTable } from './JobTypesTable'

interface JobTypesClientPageProps {
  initialData: Serialized
}

export default function JobTypesClientPage({
  initialData,
}: JobTypesClientPageProps) {
  const initialJobTypes = deserializeJobTypes(initialData)
  const { data, mutate } = useAPIJobTypes({
    fallbackData: initialJobTypes,
  })

  const requestReload = (expectedResult: JobTypeComplete[]) => {
    mutate(expectedResult)
  }

  return (
    <>
      <section>
        <div className="container-fluid">
          <div className="row gx-3">
            <div className="col-lg-10 pb-2">
              <JobTypesTable data={data} reload={requestReload} />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
