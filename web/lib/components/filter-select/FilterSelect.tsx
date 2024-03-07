import { allowForNumber, formatNumber } from 'lib/helpers/helpers'
import React, { createRef, useEffect, useState } from 'react'

export interface FilterSelectItem {
  id: string
  name: string
  searchable: string
  amount?: number
}

interface FilterSelectProps {
  id: string,
  items: FilterSelectItem[][]
  placeholder: string
  onSelected: (selectedItems: FilterSelectItem[]) => void
  defaultSelected?: FilterSelectItem
  multiple?: boolean
}

export function FilterSelect({
  id,
  items,
  placeholder,
  onSelected,
  defaultSelected,
  multiple = false
}: FilterSelectProps) {
  const [search, setSearch] = useState(defaultSelected?.name ?? '')
  const [selectedItems, setSelectedItems] = useState<FilterSelectItem[]>(defaultSelected ? [defaultSelected] : [])
  const [isOpen, setIsOpen] = useState(false)
  const [editAmountItem, setEditAmountItem] = useState<FilterSelectItem | null>(null);

  const dropdown = createRef<HTMLInputElement>()
  const input = createRef<HTMLInputElement>()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      /* 
      if we click anywhere outside of dropdown-menu it will close it
      even though when you click inside of dropdown-menu it will close it, 
      but also it will set selected item, that's the reason why we are exluding it from here
      */
      if (isOpen && dropdown.current && !dropdown.current.contains(event.target as Node)) {
        hideDropdown()
      }

      // Check if the click target is outside the input and its parent container
      if (editAmountItem && input.current && !input.current.contains(event.target as Node)) {
        // Close the editAmountItem if it is open
        setEditAmountItem(null);
      }
    }

    // if it register mouse click anywhere on the window it will call handleCLickOutside
    document.addEventListener('mousedown', handleClickOutside) // alternatively use window. instead of document.

    // clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdown, isOpen, input, editAmountItem, setEditAmountItem]) 
  
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const hideDropdown = () => {
    setIsOpen(false)
  }

  const selectItem = (item: FilterSelectItem) => {
    hideDropdown()
    if(multiple) {
      setSearch('')
    }
    else {
      setSearch(item.name)
    }
    onSelected([item])
    if(!multiple) {
      setSelectedItems([item])
    }
    // Check if the item is already selected
    else if (!selectedItems.find((selectedItem) => selectedItem.id === item.id)) {
      // Add the selected item to the array
      setSelectedItems([...selectedItems, item])
    }
  }

  const removeSelectedItem = (item: FilterSelectItem) => {
    // Filter out the removed item
    const updatedSelectedItems = selectedItems.filter((selectedItem) => selectedItem.id !== item.id)
    // Update the state and notify the parent component
    setSelectedItems(updatedSelectedItems)
    onSelected(updatedSelectedItems)
  }

  const shouldShowItem = (item: FilterSelectItem) => {
    const isSearchEmpty = search.length === 0 || (!multiple && search === selectedItems[0].name)
    return (
      isSearchEmpty ||
      item.searchable.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <>
      {multiple && (
        <div className="pill-container">
          {selectedItems.map((selectedItem) => (
            <div key={selectedItem.id} className="pill">
              <span onClick={() => setEditAmountItem(selectedItem)}>
                {selectedItem.name}
                {!(editAmountItem && editAmountItem.id === selectedItem.id) && (selectedItem.amount !== undefined) && (
                  <span>
                    (
                      {selectedItem.amount}
                    )
                  </span>
                )}
              </span>
              {(editAmountItem && editAmountItem.id === selectedItem.id) && (
                <span>
                  (
                  <input
                    className="form-control smj-input"
                    type="number"
                    ref={input}
                    min={1}
                    defaultValue={selectedItem.amount ?? 1}
                    onKeyDown={(e) => allowForNumber(e)}
                    onChange={(e) => {
                      const num = formatNumber(e.target.value)
                      setSelectedItems((prevItems) =>
                        prevItems.map((prevItem) =>
                          prevItem.id === selectedItem.id ? { ...prevItem, amount: +num } : prevItem
                        )
                      )
                    }}
                  />
                  )
                </span>
              )}
              <span className="pill-close" onClick={() => removeSelectedItem(selectedItem)}>
                <i className="fa-solid fa-xmark"/>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="p-0" aria-expanded={isOpen}>
        <input
          id={id}
          className="smj-dropdown fs-5"
          type="text"
          placeholder={placeholder}
          value={search}
          onClick={toggleDropdown}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="btn-group" ref={dropdown}>
        <ul className={`dropdown-menu ${isOpen ? 'show' : ''} smj-dropdown-menu`}>
          {items.map((part, index) => (
            <React.Fragment key={index}>
              {part.map((item) => (
                shouldShowItem(item) && (
                  <li key={item.id}>
                    <button
                      className={`dropdown-item smj-dropdown-item fs-5 ${multiple && selectedItems.find(selectedItem => selectedItem.id === item.id) ? 'smj-selected' : ''}`}
                      type="button"
                      onClick={() => selectItem(item)}
                    >
                      {item.name}
                    </button>
                  </li>
                )
              ))}
              {(index < items.length - 1 && part.length !== 0) && (
                <div className="dropdown-divider" key={`divider-${index}`}></div>
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </>
  )
}
