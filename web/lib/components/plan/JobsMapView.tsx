'use client'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for Marker Icon that is not defaultly showing for react-leaflet
// Set this once at module scope to avoid performance issues
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet/dist/images/marker-shadow.png',
  iconAnchor: [11, 46], // fix icon position
  popupAnchor: [2, -46], // fix popup window position
})
L.Marker.prototype.options.icon = DefaultIcon

interface JobsMapViewProps {
  jobs: ActiveJobNoPlan[]
  jobOrder?: { [jobId: string]: number } // Optional mapping of job ID to order number
}

export default function JobsMapView({ jobs, jobOrder }: JobsMapViewProps) {
  // Create numbered icons for ordered jobs
  const createNumberedIcon = (number: number) => {
    return L.divIcon({
      html: `<div style="
        background-color: #007bff;
        color: white;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      ">${number}</div>`,
      className: 'custom-numbered-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    })
  }

  // Filter jobs that have coordinates
  const jobsWithCoordinates = useMemo(() => {
    return jobs.filter(job => 
      job.proposedJob.coordinates && 
      job.proposedJob.coordinates.length === 2 &&
      job.proposedJob.coordinates[0] !== null &&
      job.proposedJob.coordinates[1] !== null
    ).map(job => ({
      id: job.id,
      name: job.proposedJob.name,
      address: job.proposedJob.address,
      areaName: job.proposedJob.area?.name || 'Nezadaná oblast',
      coordinates: [job.proposedJob.coordinates[0]!, job.proposedJob.coordinates[1]!] as [number, number],
      workersCount: job.workers.length,
      maxWorkers: job.proposedJob.maxWorkers,
      minWorkers: job.proposedJob.minWorkers,
      contact: job.proposedJob.contact,
      completed: job.completed
    }))
  }, [jobs])

  // Calculate center of map based on all job coordinates
  const mapCenter = useMemo((): [number, number] => {
    if (jobsWithCoordinates.length === 0) {
      return [49.8203, 15.4784] // Default to Czech Republic center
    }
    
    const avgLat = jobsWithCoordinates.reduce((sum, job) => sum + job.coordinates[0], 0) / jobsWithCoordinates.length
    const avgLng = jobsWithCoordinates.reduce((sum, job) => sum + job.coordinates[1], 0) / jobsWithCoordinates.length
    
    return [avgLat, avgLng]
  }, [jobsWithCoordinates])

  if (jobsWithCoordinates.length === 0) {
    return (
      <div className="text-center p-4">
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          Žádný z vybraných jobů nemá zadané souřadnice pro zobrazení na mapě.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3">
        <p className="text-muted">
          Zobrazeno {jobsWithCoordinates.length} z {jobs.length} vybraných jobů 
          {jobsWithCoordinates.length < jobs.length && ` (${jobs.length - jobsWithCoordinates.length} jobů nemá souřadnice)`}
        </p>
      </div>
      
      <div style={{ height: '280px', width: '100%', overflow: 'hidden' }}>
        <MapContainer
          center={mapCenter}
          zoom={10}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
          className="smj-map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {jobsWithCoordinates.map(job => {
            const orderNumber = jobOrder?.[job.id]
            const icon = orderNumber ? createNumberedIcon(orderNumber) : DefaultIcon
            
            return (
              <Marker key={job.id} position={job.coordinates} icon={icon}>
                <Popup>
                  <div className="job-popup">
                    <h6 className="mb-2">
                      {orderNumber && (
                        <span className="badge bg-primary me-2">{orderNumber}.</span>
                      )}
                      <strong>{job.name}</strong>
                      {job.completed && (
                        <span className="badge bg-success ms-2">Hotovo</span>
                      )}
                    </h6>
                    
                    <div className="mb-2">
                      <small><strong>Oblast:</strong> {job.areaName}</small>
                    </div>
                    
                    <div className="mb-2">
                      <small><strong>Adresa:</strong> {job.address}</small>
                    </div>
                    
                    <div className="mb-2">
                      <small>
                        <strong>Pracanti:</strong> {job.workersCount} / {job.minWorkers} .. {job.maxWorkers}
                      </small>
                    </div>
                    
                    {job.contact && (
                      <div className="mb-2">
                        <small><strong>Kontakt:</strong> {job.contact}</small>
                      </div>
                    )}
                    
                    <div className="mb-2">
                      <small>
                        <strong>Souřadnice:</strong> [{job.coordinates[0].toFixed(6)}, {job.coordinates[1].toFixed(6)}]
                      </small>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
