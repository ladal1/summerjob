'use client'
import { allergyMapping } from 'lib/data/enumMapping/allergyMapping'
import { compareDates, compareTimes, formatDateLong } from 'lib/helpers/helpers'
import { Allergy } from 'lib/prisma/client'
import { MyPlan } from 'lib/types/my-plan'
import { deserializePostsDates, PostComplete } from 'lib/types/post'
import { useMemo, useState } from 'react'
import SimpleDatePicker from '../date-picker/date-picker'
import EditBox from '../forms/EditBox'
import { FormHeader } from '../forms/FormHeader'
import { IconAndLabel } from '../forms/IconAndLabel'
import { Label } from '../forms/Label'
import { OpenNavigationButton } from '../forms/OpenNavigationButton'
import Map from '../map/Map'
import PageHeader from '../page-header/PageHeader'
import { MyEvents } from './MyEvents'

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
              <div className="container-fluid">
                <div className="row">
                  <div
                    className={`${
                      selectedPlan.job.location.coordinates ? 'col-lg-6' : 'col'
                    }`}
                  >
                    <Label id="description" label="Popis" />
                    {selectedPlan.job.description}
                    <Label id="contact" label="Kontaktní osoba" />
                    {selectedPlan.job.contact}
                    <Label id="onSite" label="Na místě" />
                    {selectedPlan.job.hasFood && selectedPlan.job.hasShower && (
                      <div className="d-flex gap-4">
                        {selectedPlan.job.hasFood && (
                          <div>
                            <IconAndLabel
                              label={'Občerstvení'}
                              icon={'fas fa-utensils'}
                            />
                          </div>
                        )}
                        {selectedPlan.job.hasShower && (
                          <div>
                            <IconAndLabel
                              label={'Sprcha'}
                              icon={'fas fa-shower'}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <Label id="allergens" label="Alergeny" />
                    {selectedPlan.job.allergens.length === 0 ? (
                      'Žádné'
                    ) : (
                      <div className="d-flex flex-wrap justify-content-start allign-items-center text-muted gap-1">
                        {selectedPlan.job.allergens.map(allergen => (
                          <span key={allergen} className="pill-static">
                            {allergyMapping[allergen as Allergy]}
                          </span>
                        ))}
                      </div>
                    )}
                    <Label id="worker" label="Pracanti" />
                    {selectedPlan.job.workerNames
                      .sort((a, b) => a.localeCompare(b))
                      .map(name => (
                        <div key={name}>
                          {name}
                          {name === selectedPlan.job?.responsibleWorkerName && (
                            <span className="text-muted">
                              {' '}
                              (zodpovědný pracant)
                            </span>
                          )}
                        </div>
                      ))}
                    <Label id="ride" label="Doprava" />
                    <>
                      {!selectedPlan.job.ride ? (
                        <IconAndLabel label="Pěšky" icon="fas fa-shoe-prints" />
                      ) : (
                        <>
                          {!selectedPlan.job.ride.endsAtMyJob ? (
                            <>
                              <IconAndLabel
                                label="Sdílená doprava"
                                icon="fas fa-car-on"
                              />
                              <span className="text-muted">
                                {' ('}Auto jede na job{' '}
                                <i>{selectedPlan.job.ride.endJobName}</i>, ale
                                vysadí tě cestou.{')'}
                              </span>
                            </>
                          ) : (
                            <div>
                              <IconAndLabel label="Auto" icon="fas fa-car" />
                            </div>
                          )}
                          <div>
                            <div>
                              <IconAndLabel
                                label="O autu: "
                                icon="fas fa-circle-info"
                              />
                              {selectedPlan.job.ride.car}
                            </div>
                            <div>
                              <IconAndLabel
                                label="Řidič: "
                                icon="fas fa-user"
                              />
                              {selectedPlan.job.ride.driverName}
                              {', '}
                              {selectedPlan.job.ride.driverPhone}
                            </div>
                          </div>
                        </>
                      )}
                    </>
                    {!selectedPlan.job.location.coordinates && (
                      <div>
                        <Label id="address" label="Adresa" />
                        {`${selectedPlan.job.location.address}, ${selectedPlan.job.location.name}`}
                      </div>
                    )}
                  </div>
                  {selectedPlan.job.location.coordinates && (
                    <div className="col-lg-6">
                      <Label id="address" label="Adresa" />
                      {`${selectedPlan.job.location.address}, ${selectedPlan.job.location.name}`}
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
