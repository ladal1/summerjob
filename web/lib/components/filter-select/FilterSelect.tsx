'use client'
import { createRef, CSSProperties, useState } from 'react'

export interface FilterSelectItem {
  id: string
  name: string
  searchable: string
  item: React.ReactNode
}

interface FilterSelectProps {
  items: FilterSelectItem[]
  placeholder: string
  onSelected: (item: FilterSelectItem) => void
  defaultSelected?: FilterSelectItem
}

const DEFAULT: FilterSelectItem = {
  id: 'DEFAULT_OPTION',
  name: 'Vyberte možnost',
  searchable: '',
  item: <></>,
}

export function FilterSelect({
  items,
  placeholder,
  onSelected,
  defaultSelected,
}: FilterSelectProps) {
  const [search, setSearch] = useState(defaultSelected?.name ?? '')
  const [selected, setSelected] = useState(defaultSelected ?? DEFAULT)
  const inputRef = createRef<HTMLInputElement>()
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})

  const showDropdown = () => {
    setDropdownStyle({
      display: 'block',
      transform: `translate(0px, ${inputRef.current?.scrollHeight}px)`,
    })
  }

  const hideDropdown = () => {
    setDropdownStyle({})
  }

  const selectItem = (item: FilterSelectItem) => {
    setSelected(item)
    setSearch(item.name)
    hideDropdown()
    onSelected(item)
  }

  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      hideDropdown()
    }
  }

  const shouldShowItem = (item: FilterSelectItem) => {
    const isSearchEmpty = search.length === 0 || search === selected.name
    return (
      isSearchEmpty ||
      item.searchable.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <div className="dropdown" onBlur={onBlur}>
      <div className="p-0" aria-expanded="false">
        <input
          className="p-2 w-100"
          type="text"
          placeholder={placeholder}
          style={{ border: '0px', outline: '0px' }}
          onFocus={showDropdown}
          onClick={showDropdown}
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
        ></input>
      </div>

      <ul
        className="dropdown-menu smj-dropdown-menu w-100 overflow-auto"
        style={dropdownStyle}
      >
        {items.map(item => {
          return (
            shouldShowItem(item) && (
              <li key={item.id}>
                <button
                  className="dropdown-item"
                  type="button"
                  onClick={() => selectItem(item)}
                >
                  {item.item}
                </button>
              </li>
            )
          )
        })}
      </ul>
    </div>
  )
}
