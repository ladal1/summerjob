'use client'
import { ChangeEvent, useState } from 'react'

export interface FilterSelectItem {
  id: string
  name: string
}

interface FilterSelectProps {
  id: string,
  items: FilterSelectItem[]
  placeholder: string
  onSelected: (id: string) => void
  defaultSelected?: FilterSelectItem
}

export function FilterSelect({
  id,
  items,
  placeholder,
  onSelected,
  defaultSelected,
}: FilterSelectProps) {
  const [search, setSearch] = useState(defaultSelected?.id ?? '')

  const itemSelected = (e: ChangeEvent<HTMLSelectElement>) => {
    onSelected(e.target.value)
    setSearch(e.target.value)
  }

  return (
    <div className="d-inline-block">
      <select
        id={id}
        className="form-select smj-filter-select p-2"
        placeholder={placeholder}
        value={search}
        onChange={e => itemSelected(e)}
      >
        {items && items.map((item) => 
          <option 
            value={item.id} 
            key={item.id}
          >
            {item.name}
          </option>
        )}
      </select>
    </div>
  )
}
