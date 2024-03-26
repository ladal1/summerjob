'use client'
import {
  compareDates,
  compareTimes,
  formatDateLong,
  formateTime,
} from 'lib/helpers/helpers'
import { MyPlan } from 'lib/types/my-plan'
import { useMemo, useState } from 'react'
import SimpleDatePicker from '../date-picker/date-picker'
import EditBox from '../forms/EditBox'
import { OpenNavigationButton } from '../forms/OpenNavigationButton'
import Map from '../map/Map'
import PageHeader from '../page-header/PageHeader'
import { RowContent } from '../table/RowContent'
import { deserializePostsDates, PostComplete } from 'lib/types/post'
import { MyEvents } from './MyEvents'
import { FormHeader } from '../forms/FormHeader'
import { Label } from '../forms/Label'

interface MyPlanBrowserProps {
  plans: MyPlan[]
  events: PostComplete[]
  userId: string
}

export default function MyPlanBrowser({
  plans,
  events,
  userId,
}: MyPlanBrowserProps) {
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

  const eventsWithNewDatesAndSorted = useMemo(() => {
    return sortEvents(events.map(item => deserializePostsDates(item)))
  }, [events])

  const filteredEvents = useMemo(() => {
    return filterEvents(date, eventsWithNewDatesAndSorted)
  }, [date, eventsWithNewDatesAndSorted])

  const craftLabel = () => {
    return (
      (selectedPlan?.job &&
        (selectedPlan?.job?.seqNum ? selectedPlan?.job?.seqNum + ' - ' : '') +
          selectedPlan?.job?.name) ||
      'Tento den nemáte naplánovanou práci.'
    )
  }

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
            <FormHeader label={craftLabel()} />
            {selectedPlan?.job && (
              <div className="container-fluid mt-2">
                <div className="row">
                  <div
                    className={`${
                      selectedPlan.job.location.coordinates ? 'col-lg-6' : 'col'
                    } " mb-3"`}
                  >
                    <RowContent
                      data={[
                        {
                          label: 'Popis',
                          content: `${selectedPlan.job.description}`,
                        },
                        {
                          label: 'Zodpovědný pracant',
                          content: `${selectedPlan.job.responsibleWorkerName}`,
                        },
                        {
                          label: 'Pracanti',
                          content: `${selectedPlan.job.workerNames.join(', ')}`,
                        },
                        {
                          label: 'Kontaktní osoba',
                          content: `${selectedPlan.job.contact}`,
                        },
                        {
                          label: 'Alergeny',
                          content: `${
                            selectedPlan.job.allergens.join(', ') || 'Žádné'
                          }`,
                        },
                        {
                          label: 'Adresa',
                          content: `${selectedPlan.job.location.address}, ${selectedPlan.job.location.name}`,
                        },
                        {
                          label: 'Občerstvení k dispozici',
                          content: `${selectedPlan.job.hasFood ? 'Ano' : 'Ne'}`,
                        },
                        {
                          label: 'Sprcha k dispozici',
                          content: `${
                            selectedPlan.job.hasShower ? 'Ano' : 'Ne'
                          }`,
                        },
                        {
                          label: 'Doprava',
                          content: (
                            <>
                              {!selectedPlan.job.ride && (
                                <div className="ms-2">Pěšky</div>
                              )}
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
                                        <i>
                                          {selectedPlan.job.ride.endJobName}
                                        </i>
                                        , ale vysadí tě cestou.
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </>
                          ),
                        },
                      ]}
                    />
                  </div>
                  {selectedPlan.job.location.coordinates && (
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <Map
                          center={selectedPlan.job.location.coordinates}
                          zoom={11}
                          markerPosition={selectedPlan.job.location.coordinates}
                          address={selectedPlan.job.location.address}
                        />
                      </div>
                      <div className="d-flex justify-content-end">
                        <OpenNavigationButton
                          coordinates={selectedPlan.job.location.coordinates}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </EditBox>
        </div>
      </section>
      {filteredEvents.length !== 0 && (
        <MyEvents events={filteredEvents} userId={userId} date={date} />
      )}
    </>
  )
}

function filterEvents(selectedDay: Date, posts: PostComplete[]) {
  if (!posts) return []
  return posts.filter(post => {
    return (
      (post.availability &&
        post.availability.some(availDay => {
          return selectedDay && availDay.getTime() === selectedDay.getTime()
        })) ||
      post.availability === undefined ||
      post.availability.length === 0
    )
  })
}
function sortEvents(posts: PostComplete[]) {
  return [...posts].sort((a, b) => {
    const compareDatesResult = compareDates(a.availability, b.availability)
    if (compareDatesResult === 0) return compareTimes(a.timeFrom, b.timeFrom)
    return compareDatesResult
  })
}
