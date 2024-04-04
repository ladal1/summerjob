import { getWorkers } from 'lib/data/workers'
import { WorkerComplete } from 'lib/types/worker'
import Image from 'next/image'
import logoImage from 'public/logo-smj-yellow.png'
import '/styles/print.css'

export const dynamic = 'force-dynamic'

export default async function PrintWorkersPage() {
  const workers = await getWorkers()
  return (
    <>
      <div className="print-a4-landscape">
        <div className="header">
          <h1>Seznam pracantů</h1>
          <Image
            src={logoImage}
            className="smj-logo"
            alt="SummerJob logo"
            quality={98}
            priority={true}
          />
        </div>
        <div className="d-flex">
          <table className="table-print">
            <thead className="workers-thead">
              <tr>
                <th scope="col" style={{ width: '12%' }}>
                  Jméno
                </th>
                <th scope="col" style={{ width: '14%' }}>
                  Příjmení
                </th>
                <th scope="col" style={{ width: '10%' }}>
                  Telefonní číslo
                </th>
                <th scope="col" style={{ width: '20%' }}>
                  E-mail
                </th>
                <th scope="col" style={{ width: '7%' }}>
                  Vlastnosti
                </th>
                <th scope="col" style={{ width: '18%' }}>
                  Poznámka
                </th>
              </tr>
            </thead>
            <tbody className="">
              {workers.map(worker => (
                <SimpleRow key={worker.id} data={formatWorkerRow(worker)} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function formatWorkerRow(worker: WorkerComplete) {
  return [
    worker.firstName,
    worker.lastName,
    worker.phone,
    worker.email,
    <>
      {worker.cars.length > 0 && (
        <i className="fas fa-car me-2" title={'Má auto'} />
      )}
      {worker.isStrong && <i className="fas fa-dumbbell" title={'Silák'} />}
    </>,
    '',
  ]
}

interface RowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
}

export function SimpleRow({ data }: RowProps) {
  return (
    <tr>
      {data.map((field, index) => {
        return (
          <td
            key={index}
            title={typeof field === 'string' ? field : undefined}
            className="text-break-word"
          >
            {field}
          </td>
        )
      })}
    </tr>
  )
}
