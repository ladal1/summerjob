'use client'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { workAllergyMapping } from 'lib/data/enumMapping/workAllergyMapping'
import { WorkAllergy } from 'lib/prisma/client'
import { MyPlan } from 'lib/types/my-plan'
import EditBox from '../forms/EditBox'
import { FormHeader } from '../forms/FormHeader'
import { IconAndLabel } from '../forms/IconAndLabel'
import { Label } from '../forms/Label'
import { OpenNavigationButton } from '../forms/OpenNavigationButton'
import Map from '../map/Map'

interface MyJobProps {
  selectedPlan: MyPlan
}

export default function MyJob({ selectedPlan }: MyJobProps) {
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
      <section>
        <EditBox>
          <FormHeader label="Můj job" />
          {selectedPlan?.job && (
            <div className="container-fluid">
              <div className="row pt-4">
                <h3>{craftLabel()}</h3>
                <div
                  className={`${
                    selectedPlan.job.location.coordinates ? 'col-lg-6' : 'col'
                  }`}
                >
                  {selectedPlan.job.description.length > 0 && (
                    <>
                      <Label id="description" label="Popis" />
                      <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedPlan.job.description}
                        </ReactMarkdown>
                      </div>
                    </>
                  )}
                  <Label id="contact" label="Kontaktní osoba" />
                  {selectedPlan.job.contact}
                  <Label id="onSite" label="Na místě" />
                  {selectedPlan.job.hasFood || selectedPlan.job.hasShower ? (
                    <div className="d-flex gap-4">
                      {selectedPlan.job.hasFood && (
                        <div>
                          <IconAndLabel
                            label={'Strava'}
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
                  ) : (
                    <span>Bez sprchy a jídla</span>
                  )}
                  <Label id="allergens" label="Alergeny" />
                  {selectedPlan.job.allergens.length === 0 ? (
                    'Žádné'
                  ) : (
                    <div className="d-flex flex-wrap justify-content-start allign-items-center text-muted gap-1">
                      {selectedPlan.job.allergens.map(allergen => (
                        <span key={allergen} className="pill-static">
                          {workAllergyMapping[allergen as WorkAllergy]}
                        </span>
                      ))}
                    </div>
                  )}
                  <Label id="worker" label="Pracanti" />
                  {selectedPlan.job.workerNames
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(worker => (
                      <div key={worker.name}>
                        {worker.name} ({worker.phone})
                        {worker.responsibleWorker && (
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
                            <IconAndLabel label="Řidič: " icon="fas fa-user" />
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
                    <div className="mb-3" style={{ height: '400px' }}>
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
      </section>
    </>
  )
}
