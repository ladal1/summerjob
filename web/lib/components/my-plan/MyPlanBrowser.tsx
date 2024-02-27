'use client'
import { formatDateLong } from 'lib/helpers/helpers'
import { MyPlan } from 'lib/types/my-plan'
import { useMemo, useState } from 'react'
import SimpleDatePicker from '../date-picker/date-picker'
import EditBox from '../forms/EditBox'
import PageHeader from '../page-header/PageHeader'
import { RowContent } from '../table/RowContent'
import Map from '../forms/input/Map'
import { OpenNavigationButton } from '../forms/OpenNavigationButton'

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
    const t =  sortedPlans.find(plan => plan.day.getTime() === date.getTime())
    console.log(plans)
    console.log(sortedPlans)
    console.log(t?.job?.location)
    return t
  }, [date, sortedPlans])

  return (
    <>
      <PageHeader title={formatDateLong(date)} isFluid={false}>
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
              <div className="container-fluid">
                <div className="row">
                  <div className={`${selectedPlan.job.location.coordinations ? "col-lg-6" : "col"} " mb-3"`}>
                    <RowContent
                      data={
                        [
                          {
                            label: "Popis",
                            content: `${selectedPlan.job.description}`, 
                          },
                          {
                            label: "Zodpovědný pracant",
                            content: `${selectedPlan.job.responsibleWorkerName}`, 
                          },
                          {
                            label: "Pracanti",
                            content: `${selectedPlan.job.workerNames.join(', ')}`, 
                          },
                          {
                            label: "Kontaktní osoba",
                            content: `${selectedPlan.job.contact}`, 
                          },
                          {
                            label: "Alergeny",
                            content: `${selectedPlan.job.allergens.join(', ') || 'Žádné'}`, 
                          },
                          {
                            label: "Adresa",
                            content: `${selectedPlan.job.location.address}, ${selectedPlan.job.location.name}`, 
                          },
                          {
                            label: "Občerstvení k dispozici",
                            content: `${selectedPlan.job.hasFood ? 'Ano' : 'Ne'}`, 
                          },
                          {
                            label: "Sprcha k dispozici",
                            content: `${selectedPlan.job.hasShower ? 'Ano' : 'Ne'}`, 
                          },
                          {
                            label: <strong>Doprava:</strong>,
                            content: 
                            <>
                              {!selectedPlan.job.ride && <div className="ms-2">Pěšky</div>}
                              {selectedPlan.job.ride && (
                                <>
                                  <div className="ms-2 pt-2">
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
                            </> 
                          },
                        ] 
                      }
                    />
                  </div>
                  {selectedPlan.job.location.coordinations && (
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <Map
                          center={selectedPlan.job.location.coordinations}
                          zoom={11}
                          markerPosition={selectedPlan.job.location.coordinations}
                        />
                      </div>
                      <div className="d-flex justify-content-end">
                        <OpenNavigationButton coordinates={selectedPlan.job.location.coordinations} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </EditBox>
        </div>
      </section>
    </>
  )
}
