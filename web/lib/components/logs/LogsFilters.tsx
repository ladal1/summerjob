import { ChangeEvent } from 'react'

export interface LogsFiltersEventType {
  id: string
  name: string
}

interface LogsFiltersProps {
  search: string
  onSearchChanged: (search: string) => void
  eventTypes: LogsFiltersEventType[]
  selectedEventType: LogsFiltersEventType
  onEventTypeSelected: (id: string) => void
}

export function LogsFilters({
  search,
  onSearchChanged,
  eventTypes,
  selectedEventType,
  onEventTypeSelected,
}: LogsFiltersProps) {
  const eventTypeSelectChanged = (e: ChangeEvent<HTMLSelectElement>) => {
    onEventTypeSelected(e.target.value)
  }

  const isDefaultEventTypeSelected = selectedEventType.id === eventTypes[0].id

  return (
    <>
      <div className="row">
        <div className="col-auto mb-3">
          <input
            type="text"
            className="p-2 d-inline-block outline-none border-0 smj-filter-input"
            placeholder="Vyhledat..."
            value={search}
            onChange={e => onSearchChanged(e.target.value)}
          />
        </div>
        <div className="col-auto mb-3">
          <div className="d-inline-block">
            <select
              name="eventType"
              id="eventType"
              className={`form-select p-2 bg-white smj-filter-input ${
                isDefaultEventTypeSelected ? 'smj-default-option' : ''
              }`}
              value={selectedEventType.id}
              onChange={eventTypeSelectChanged}
            >
              {eventTypes &&
                eventTypes.map(eventType => (
                  <option value={eventType.id} key={eventType.id}>
                    {eventType.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </>
  )
}
