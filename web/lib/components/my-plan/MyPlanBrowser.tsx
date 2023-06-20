'use client'
import { formatDateLong } from 'lib/helpers/helpers'
import { MyPlan } from 'lib/types/my-plan'
import { useMemo, useState } from 'react'
import SimpleDatePicker from '../date-picker/date-picker'
import EditBox from '../forms/EditBox'
import PageHeader from '../page-header/PageHeader'

interface MyPlanBrowserProps {
  plans: MyPlan[]
}

export default function MyPlanBrowser({ plans }: MyPlanBrowserProps) {
  const latestPlan = plans.reduce((a, b) => (a.day > b.day ? a : b))
  const [date, setDate] = useState(latestPlan.day)
  const sortedPlans = useMemo(() => {
    return new Array(...plans).sort((a, b) => a.day.getTime() - b.day.getTime())
  }, [plans])
  if (
    sortedPlans.length > 0 &&
    (date > sortedPlans[sortedPlans.length - 1].day ||
      date < sortedPlans[0].day)
  ) {
    setDate(sortedPlans[sortedPlans.length - 1].day)
  }
  const onDateChanged = (newDate: Date) => {
    if (
      newDate > sortedPlans[sortedPlans.length - 1].day ||
      newDate < sortedPlans[0].day
    )
      return
    setDate(newDate)
  }
  const selectedPlan = useMemo(() => {
    return sortedPlans.find(plan => plan.day.getTime() === date.getTime())
  }, [date, sortedPlans])
  return (
    <>
      <PageHeader title={formatDateLong(date, true)} isFluid={false}>
        <div className="bg-white">
          <SimpleDatePicker initialDate={date} onDateChanged={onDateChanged} />
        </div>
      </PageHeader>
      <section>
        <div className="container">
          <EditBox>
            <h5>
              {selectedPlan?.job?.name ||
                'Tento den nemáte naplánovanou práci.'}
            </h5>
            {selectedPlan?.job && (
              <>
                <p>{selectedPlan.job.description}</p>
                <p>
                  <strong>Zodpovědný pracant: </strong>
                  {selectedPlan.job.responsibleWorkerName}
                </p>
                <p>
                  <strong>Pracanti: </strong>
                  {selectedPlan.job.workerNames.join(', ')}
                </p>
                <p>
                  <strong>Kontaktní osoba: </strong>
                  {selectedPlan.job.contact}
                </p>
                <p>
                  <strong>Alergeny: </strong>
                  {selectedPlan.job.allergens.join(', ') || 'Žádné'}
                </p>
                <p>
                  <strong>Adresa: </strong>
                  {selectedPlan.job.location.address},{' '}
                  {selectedPlan.job.location.name}
                </p>
                <p>
                  <strong>Občerstvení k dispozici: </strong>
                  {selectedPlan.job.hasFood ? 'Ano' : 'Ne'}
                </p>
                <p>
                  <strong>Sprcha k dispozici: </strong>
                  {selectedPlan.job.hasShower ? 'Ano' : 'Ne'}
                </p>
                <div>
                  <strong>Doprava</strong>
                  {!selectedPlan.job.ride && <div className="ms-2">Pěšky</div>}
                  {selectedPlan.job.ride && (
                    <>
                      <div className="ms-2">
                        <div>
                          <strong>Auto: </strong>
                          {selectedPlan.job.ride.car}
                        </div>
                        <div>
                          <strong>Řidič: </strong>
                          {selectedPlan.job.ride.driverName}
                          {', '}
                          {selectedPlan.job.ride.driverPhone}
                        </div>
                        {!selectedPlan.job.ride.endsAtMyJob && (
                          <>
                            Sdílená doprava. Auto jede na job{' '}
                            <i>{selectedPlan.job.ride.endJobName}</i>, tebe
                            vysadí cestou.
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </EditBox>
        </div>
      </section>
    </>
  )
}
