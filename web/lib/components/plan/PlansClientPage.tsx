'use client'
import ErrorPage from 'lib/components/error-page/ErrorPage'
import PageHeader from 'lib/components/page-header/PageHeader'
import { useAPIPlans } from 'lib/fetcher/plan'
import { formatDateLong } from 'lib/helpers/helpers'
import { deserializePlans, PlanWithJobs } from 'lib/types/plan'
import { Serialized } from 'lib/types/serialize'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Modal, ModalSize } from '../modal/Modal'
import NewPlanForm from './NewPlanForm'

interface PlansClientPageProps {
  initialData: Serialized<PlanWithJobs[]>
  startDate: string
  endDate: string
}

export default function PlansClientPage({
  initialData,
  startDate,
  endDate,
}: PlansClientPageProps) {
  const initialDataParsed = deserializePlans(initialData)
  const { data, error, isLoading } = useAPIPlans({
    fallbackData: initialDataParsed,
  })
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false)
  const openModal = () => setIsPlansModalOpen(true)
  const closeModal = () => setIsPlansModalOpen(false)

  const sortedPlans = useMemo(() => {
    if (!data) return []
    return data.sort((a, b) => b.day.getTime() - a.day.getTime())
  }, [data])

  if (error && !data) {
    return <ErrorPage error={error} />
  }

  const firstDay = new Date(startDate)
  const lastDay = new Date(endDate)
  const nextDay = (date: Date) => {
    const newDate = new Date(date)
    newDate.setDate(newDate.getDate() + 1)
    return newDate
  }

  const nextPlanDate =
    sortedPlans && sortedPlans.length > 0
      ? nextDay(sortedPlans[0].day)
      : firstDay

  return (
    <>
      <PageHeader title="Seznam plánů" isFluid={false}>
        <button
          className="btn btn-primary btn-with-icon"
          type="button"
          onClick={openModal}
        >
          <i className="far fa-calendar-plus"></i>
          <span>Nový plán</span>
        </button>
      </PageHeader>

      <section>
        <div className="container">
          <div className="list-group">
            {error && !data && (
              <center>Nastala chyba během načítání plánů.</center>
            )}
            {!isLoading && (!data || data.length === 0) && (
              <center>Žádné plány.</center>
            )}
            {isLoading && !data && <center>Načítání...</center>}
            {sortedPlans.map(plan => (
              <Link
                className="list-group-item list-group-item-action"
                href={`/plans/${plan.id}`}
                key={plan.id}
              >
                <div className="row">
                  <div className="col">
                    <h5>{formatDateLong(plan.day, true)}</h5>
                    <p>{plan.jobs.length} jobů</p>
                  </div>
                  <div className="col d-flex justify-content-end align-items-center gap-3">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {isPlansModalOpen && (
          <Modal
            title={'Přidat nový plán'}
            size={ModalSize.MEDIUM}
            onClose={closeModal}
          >
            <NewPlanForm
              initialDate={nextPlanDate}
              onCompleted={closeModal}
              from={firstDay}
              to={lastDay}
            />
          </Modal>
        )}
      </section>
    </>
  )
}
