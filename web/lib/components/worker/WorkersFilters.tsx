interface WorkersFiltersProps {
  search: string
  onSearchChanged: (search: string) => void
  onlyStrong: boolean
  onOnlyStrongChanged: (onlyStrong: boolean) => void
  onlyWithCar: boolean
  onOnlyWithCarChanged: (withCar: boolean) => void
}

export function WorkersFilters({
  search,
  onSearchChanged,
  onlyStrong,
  onOnlyStrongChanged,
  onlyWithCar,
  onOnlyWithCarChanged,
}: WorkersFiltersProps) {
  return (
    <>
      <div className="row">
        <div className="col-auto mb-3 ">
          <input
            type="text"
            className="p-2 d-inline-block outline-none border-0 smj-filter-input"
            placeholder="Vyhledat..."
            value={search}
            onChange={e => onSearchChanged(e.target.value)}
          />
        </div>
        <div className="col-auto mb-3 d-flex">
          <div className="form-check align-self-center align-items-center d-flex gap-2">
            <input
              className="form-check-input fs-5 checkbox-white"
              type="checkbox"
              id="onlyStrongCheckbox"
              checked={onlyStrong}
              onChange={e => onOnlyStrongChanged(e.target.checked)}
            />
            <label
              className="form-check-label fw-lighter fs-5"
              htmlFor="onlyStrongCheckbox"
            >
              Pouze silní
            </label>
          </div>
        </div>
        <div className="col-auto mb-3 d-flex">
          <div className="form-check align-self-center align-items-center d-flex gap-2">
            <input
              className="form-check-input fs-5 checkbox-white"
              type="checkbox"
              id="onlyWithCarCheckbox"
              checked={onlyWithCar}
              onChange={e => onOnlyWithCarChanged(e.target.checked)}
            />
            <label
              className="form-check-label fw-lighter fs-5"
              htmlFor="onlyWithCarCheckbox"
            >
              Pouze s autem
            </label>
          </div>
        </div>
      </div>
    </>
  )
}
