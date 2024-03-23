import { ChangeEvent } from 'react'

interface PlanFiltersArea {
  id: string
  name: string
}

interface PlanFiltersProps {
  search: string
  onSearchChanged: (search: string) => void
  areas: PlanFiltersArea[]
  selectedArea: PlanFiltersArea
  onAreaSelected: (id: string) => void
}

export function PlanFilters({
  search,
  onSearchChanged,
  areas,
  selectedArea,
  onAreaSelected,
}: PlanFiltersProps) {
  const areaSelectChanged = (e: ChangeEvent<HTMLSelectElement>) => {
    onAreaSelected(e.target.value)
  }
  const isDefaultAreaSelected = selectedArea.id === areas[0].id

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
              name="area"
              id="area"
              className={`form-select p-2 bg-white smj-filter-input ${
                isDefaultAreaSelected ? 'smj-default-option' : ''
              }`}
              value={selectedArea.id}
              onChange={areaSelectChanged}
            >
              {areas &&
                areas.map(area => (
                  <option value={area.id} key={area.id}>
                    {area.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </>
  )
}
