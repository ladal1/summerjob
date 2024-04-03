import { formatNumberAfterThreeDigits } from 'lib/helpers/helpers'
import { CarComplete } from 'lib/types/car'
import { useMemo } from 'react'

interface CarsStatisticsProps {
  data: CarComplete[]
}

export const CarsStatistics = ({ data }: CarsStatisticsProps) => {
  const calculateKilomatrage = () => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + (current.odometerEnd - current.odometerStart)
    }, 0)

    return count ?? 0
  }

  const calculateReimbursed = useMemo(() => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + +current.reimbursed
    }, 0)

    return count ?? 0
  }, [data])

  const calculateNumberOfSeats = useMemo(() => {
    const count = data?.reduce((accumulator, current) => {
      return accumulator + current.seats
    }, 0)

    return count ?? 0
  }, [data])

  interface SeatList {
    [key: string]: {
      name: string
      amount: number
    }
  }

  const seatList: SeatList = useMemo(
    () =>
      (data || []).reduce((accumulator: SeatList, car) => {
        accumulator[car.seats] = {
          name: '' + car.seats,
          amount: (accumulator['' + car.seats]?.amount || 0) + 1,
        }
        return accumulator
      }, {}),
    [data]
  )
  return (
    <>
      <div className="vstack smj-search-stack smj-shadow rounded-3">
        <h5>Statistiky</h5>
        <hr />
        <ul className="list-group list-group-flush ">
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Aut</span>
            <span>{data?.length}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Najeto kilometrů</span>
            <span className="text-nowrap">
              {formatNumberAfterThreeDigits('' + calculateKilomatrage())}
            </span>
          </li>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Proplacených</span>
            <span>{calculateReimbursed}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 d-flex justify-content-between align-items-center smj-gray">
            <span className="me-2">Celkově míst</span>
            <span>{calculateNumberOfSeats}</span>
          </li>
          <li className="list-group-item ps-0 pe-0 smj-gray">
            <span className="me-2">Počet míst</span>
            <table className="table">
              <tbody>
                {Object.entries(seatList).map(([key, seat]) => (
                  <tr key={key} className="text-end">
                    <td>{seat.name}</td>
                    <td>
                      {seat.amount}
                      {'x'}
                    </td>
                  </tr>
                ))}
                {Object.entries(seatList).length === 0 && (
                  <tr key="none" className="text-end">
                    <td>žádné</td>
                  </tr>
                )}
              </tbody>
            </table>
          </li>
        </ul>
      </div>
    </>
  )
}
