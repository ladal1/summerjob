interface CarsFiltersProps {
  search: string
  onSearchChanged: (search: string) => void
}

export function CarsFilters({ search, onSearchChanged }: CarsFiltersProps) {
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
      </div>
    </>
  )
}
