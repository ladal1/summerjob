'use client'
import { ActiveJobNoPlan } from 'lib/types/active-job'
import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Forces Leaflet to recompute its container size after the map mounts.
// Without this, when the map is rendered inside a container that was just
// revealed (e.g. via a "Show map" toggle), Leaflet measures the container
// before it has settled in the DOM, breaking tile rendering and markers.
function MapInvalidator() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(t)
  }, [map])
  return null
}

function MapHighlighter({
  highlightJobId,
  coordsByJobId,
  markerRefs,
}: {
  highlightJobId: string | null | undefined
  coordsByJobId: Map<string, [number, number]>
  markerRefs: React.RefObject<Map<string, L.Marker>>
}) {
  const map = useMap()
  // Read latest coords/refs without putting them in the effect deps,
  // so the highlight only fires when the user explicitly picks a new job —
  // not on every re-render caused by assignment changes.
  const coordsRef = useRef(coordsByJobId)
  coordsRef.current = coordsByJobId

  useEffect(() => {
    if (!highlightJobId) return
    const coords = coordsRef.current.get(highlightJobId)
    if (!coords) return
    const targetZoom = Math.max(map.getZoom(), 14)
    map.flyTo(coords, targetZoom, { duration: 0.6 })
    const marker = markerRefs.current.get(highlightJobId)
    if (marker) {
      const t = setTimeout(() => marker.openPopup(), 650)
      return () => clearTimeout(t)
    }
  }, [highlightJobId, map, markerRefs])
  return null
}

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
  height?: number // Optional height in pixels, defaults to 280px
  // When provided, popup shows assignment controls so user can change courier
  // directly from the map.
  courierNums?: number[]
  onAssignCourier?: (jobId: string, courierNum: number | null) => void
  // When set, map flies to that job and opens its popup.
  highlightJobId?: string | null
}

// Distinct, accessible colors for couriers on the map. Cycles if more couriers
// than palette entries exist.
const COURIER_COLOR_PALETTE = [
  '#0d6efd', // blue
  '#198754', // green
  '#dc3545', // red
  '#fd7e14', // orange
  '#6610f2', // purple
  '#20c997', // teal
  '#d63384', // pink
  '#ffc107', // amber
]

function colorForCourier(courierNum: number): string {
  return COURIER_COLOR_PALETTE[(courierNum - 1) % COURIER_COLOR_PALETTE.length]
}

export default function JobsMapView({
  jobs,
  jobOrder,
  height = 280,
  courierNums,
  onAssignCourier,
  highlightJobId,
}: JobsMapViewProps) {
  const markerRefs = useRef(new Map<string, L.Marker>())
  // Create numbered icons for ordered jobs
  const createNumberedIcon = (number: number) => {
    const color = colorForCourier(number)
    return L.divIcon({
      html: `<div style="
        background-color: ${color};
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
      popupAnchor: [0, -15],
    })
  }

  const unassignedIcon = L.divIcon({
    html: `<div style="
      background-color: #adb5bd;
      color: white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      border: 2px dashed white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">?</div>`,
    className: 'custom-unassigned-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })

  // Filter jobs that have coordinates
  const jobsWithCoordinates = useMemo(() => {
    return jobs
      .filter(
        job =>
          job.proposedJob.coordinates &&
          job.proposedJob.coordinates.length === 2 &&
          job.proposedJob.coordinates[0] !== null &&
          job.proposedJob.coordinates[1] !== null
      )
      .map(job => ({
        id: job.id,
        name: job.proposedJob.name,
        address: job.proposedJob.address,
        areaName: job.proposedJob.area?.name || 'Nezadaná oblast',
        coordinates: [
          job.proposedJob.coordinates[0]!,
          job.proposedJob.coordinates[1]!,
        ] as [number, number],
        workersCount: job.workers.length,
        maxWorkers: job.proposedJob.maxWorkers,
        minWorkers: job.proposedJob.minWorkers,
        contact: job.proposedJob.contact,
        completed: job.completed,
        hasFood: job.proposedJob.hasFood,
        allergens: Array.from(
          new Set(job.workers.flatMap(w => w.foodAllergies.map(a => a.name)))
        ),
      }))
  }, [jobs])

  const coordsByJobId = useMemo(() => {
    const map = new Map<string, [number, number]>()
    for (const job of jobsWithCoordinates) map.set(job.id, job.coordinates)
    return map
  }, [jobsWithCoordinates])

  // Calculate center of map based on all job coordinates
  const mapCenter = useMemo((): [number, number] => {
    if (jobsWithCoordinates.length === 0) {
      return [49.8203, 15.4784] // Default to Czech Republic center
    }

    const avgLat =
      jobsWithCoordinates.reduce((sum, job) => sum + job.coordinates[0], 0) /
      jobsWithCoordinates.length
    const avgLng =
      jobsWithCoordinates.reduce((sum, job) => sum + job.coordinates[1], 0) /
      jobsWithCoordinates.length

    return [avgLat, avgLng]
  }, [jobsWithCoordinates])

  const courierLegend = useMemo(() => {
    if (!courierNums || courierNums.length === 0) return []
    return courierNums.map(num => ({ num, color: colorForCourier(num) }))
  }, [courierNums])

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
      <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <p className="text-muted mb-0 small">
          Zobrazeno {jobsWithCoordinates.length} z {jobs.length} vybraných jobů
          {jobsWithCoordinates.length < jobs.length &&
            ` (${jobs.length - jobsWithCoordinates.length} jobů nemá souřadnice)`}
        </p>
        {courierLegend.length > 0 && (
          <div className="d-flex flex-wrap gap-2 small">
            {courierLegend.map(({ num, color }) => (
              <span
                key={num}
                className="d-inline-flex align-items-center gap-1"
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: '1px solid white',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}
                />
                Rozvozník {num}
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ height: `${height}px`, width: '100%', overflow: 'hidden' }}>
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
          <MapInvalidator />
          <MapHighlighter
            highlightJobId={highlightJobId}
            coordsByJobId={coordsByJobId}
            markerRefs={markerRefs}
          />
          {jobsWithCoordinates.map(job => {
            const orderNumber = jobOrder?.[job.id]
            const icon = orderNumber
              ? createNumberedIcon(orderNumber)
              : onAssignCourier
                ? unassignedIcon
                : DefaultIcon

            return (
              <Marker
                key={job.id}
                position={job.coordinates}
                icon={icon}
                ref={ref => {
                  if (ref) markerRefs.current.set(job.id, ref)
                  else markerRefs.current.delete(job.id)
                }}
              >
                <Popup>
                  <div className="job-popup">
                    <h6 className="mb-2">
                      {orderNumber && (
                        <span className="badge bg-primary me-2">
                          {orderNumber}.
                        </span>
                      )}
                      <strong>{job.name}</strong>
                      {job.completed && (
                        <span className="badge bg-success ms-2">Hotovo</span>
                      )}
                    </h6>

                    <div className="mb-2 d-flex flex-wrap gap-1">
                      {!job.hasFood && (
                        <span className="badge bg-warning text-dark">
                          Potřebuje jídlo
                        </span>
                      )}
                      {job.allergens.length > 0 && (
                        <span
                          className="badge bg-danger"
                          title={job.allergens.join(', ')}
                        >
                          Alergie: {job.allergens.join(', ')}
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <small>
                        <strong>Oblast:</strong> {job.areaName}
                      </small>
                    </div>

                    <div className="mb-2">
                      <small>
                        <strong>Adresa:</strong> {job.address}
                      </small>
                    </div>

                    <div className="mb-2">
                      <small>
                        <strong>Pracanti:</strong> {job.workersCount} /{' '}
                        {job.minWorkers} .. {job.maxWorkers}
                      </small>
                    </div>

                    {job.contact && (
                      <div className="mb-2">
                        <small>
                          <strong>Kontakt:</strong> {job.contact}
                        </small>
                      </div>
                    )}

                    <div className="mb-2">
                      <small>
                        <strong>Souřadnice:</strong> [
                        {job.coordinates[0].toFixed(6)},{' '}
                        {job.coordinates[1].toFixed(6)}]
                      </small>
                    </div>

                    {onAssignCourier && courierNums && (
                      <div className="mt-2 pt-2 border-top">
                        <label className="form-label small fw-semibold mb-1">
                          {orderNumber
                            ? 'Změnit rozvozníka'
                            : 'Přiřadit rozvozníka'}
                        </label>
                        <select
                          className="form-select form-select-sm mb-2"
                          value={orderNumber ?? ''}
                          onChange={e => {
                            const v = e.target.value
                            if (v === '') return
                            onAssignCourier(job.id, parseInt(v))
                          }}
                        >
                          {!orderNumber && (
                            <option value="" disabled>
                              Vybrat…
                            </option>
                          )}
                          {courierNums.map(n => (
                            <option key={n} value={n}>
                              Rozvozník {n}
                            </option>
                          ))}
                        </select>
                        {orderNumber && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger w-100"
                            onClick={() => onAssignCourier(job.id, null)}
                          >
                            <i className="fas fa-times me-1"></i>
                            Odebrat z rozvozu
                          </button>
                        )}
                      </div>
                    )}
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
