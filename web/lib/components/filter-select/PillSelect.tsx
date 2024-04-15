import { formatNumber } from 'lib/helpers/helpers'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { IconAndLabel } from '../forms/IconAndLabel'

export interface PillSelectItem {
  databaseId?: string
  id: string
  name: string
  searchable: string
  amount?: number
  icon?: string
}

interface PillSelectProps {
  id: string
  items: PillSelectItem[][]
  placeholder: string
  onSelected: (selectedItems: PillSelectItem[]) => void
  defaultSelected?: PillSelectItem[]
  removeExisting: (id: string) => void
  withNumberSelect?: boolean
  multiple?: boolean
}

export function PillSelect({
  id,
  items,
  placeholder,
  onSelected,
  defaultSelected,
  removeExisting,
  withNumberSelect = false,
  multiple = false,
}: PillSelectProps) {
  const [search, setSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<PillSelectItem[]>(
    defaultSelected ? defaultSelected : []
  )
  const [itemToRemove, setItemToRemove] = useState<PillSelectItem | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isEditingAmountItem, setIsEditingAmountItem] =
    useState<PillSelectItem | null>(null)

  const dropdownRef = useRef<HTMLInputElement>(null)
  const dropdownInputRef = useRef<HTMLInputElement>(null)
  const pillInputRef = useRef<HTMLInputElement>(null)

  const removeSelectedItem = useCallback(
    (item: PillSelectItem) => {
      // Filter out the removed item
      const updatedSelectedItems = selectedItems.filter(
        selectedItem => selectedItem.id !== item.id
      )
      // Update the state and notify the parent component
      setSelectedItems(updatedSelectedItems)
      if (item.databaseId !== undefined) {
        removeExisting(item.databaseId)
      } else {
        onSelected(updatedSelectedItems)
      }
    },
    [onSelected, removeExisting, selectedItems]
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      /* 
      if we click anywhere outside of dropdown-menu it will close it
      even though when you click inside of dropdown-menu it will close it, 
      but also it will set selected item, that's the reason why we are exluding it from here
      */
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        hideDropdown()
      }

      // Check if the click target is outside the input and its parent container
      if (
        isEditingAmountItem &&
        pillInputRef.current &&
        !pillInputRef.current.contains(event.target as Node)
      ) {
        // Close the isEditingAmountItem if it is open
        setIsEditingAmountItem(null)
        // Remove itemToRemove if it is set
        if (itemToRemove) {
          removeSelectedItem(itemToRemove)
          setItemToRemove(null)
        }
      }
    }

    // if it register mouse click anywhere on the window it will call handleCLickOutside
    document.addEventListener('click', handleClickOutside) // alternatively use window. instead of document.

    // clean up
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [
    dropdownRef,
    isOpen,
    pillInputRef,
    isEditingAmountItem,
    setIsEditingAmountItem,
    itemToRemove,
    removeSelectedItem,
  ])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
    if (dropdownInputRef.current) {
      dropdownInputRef.current.focus()
    }
  }

  const hideDropdown = () => {
    setIsOpen(false)
  }

  const selectItem = (item: PillSelectItem) => {
    hideDropdown()
    setIsEditingAmountItem(item)
    if (multiple) {
      setSearch('')
    } else {
      setSearch(item.name)
    }
    if (!multiple) {
      setSelectedItems([item])
      onSelected([item])
    }
    // Check if the item is already selected
    else if (!selectedItems.find(selectedItem => selectedItem.id === item.id)) {
      // Add the selected item to the array
      setSelectedItems([...selectedItems, item])
      onSelected([...selectedItems, item])
    }
  }

  const shouldShowItem = (item: PillSelectItem) => {
    const isSearchEmpty =
      search.length === 0 || (!multiple && search === selectedItems[0].name)
    return (
      isSearchEmpty ||
      item.searchable.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <>
      {multiple && (
        <div
          className="d-flex flex-wrap"
          onClick={e => {
            if (e.target === e.currentTarget && withNumberSelect) {
              // click on this container will togle dropdown (but not click on pills)
              toggleDropdown()
            }
          }}
        >
          {selectedItems.map(selectedItem => (
            <div key={`selected-item-${selectedItem.id}`} className="pill">
              {withNumberSelect ? (
                <>
                  <div
                    className="cursor-pointer"
                    onClick={() => setIsEditingAmountItem(selectedItem)}
                  >
                    {selectedItem.name}
                    {!(
                      isEditingAmountItem &&
                      isEditingAmountItem.id === selectedItem.id
                    ) &&
                      selectedItem.amount !== undefined &&
                      selectedItem.amount > 1 && (
                        <span className="ms-1">({selectedItem.amount})</span>
                      )}
                  </div>
                  {isEditingAmountItem &&
                    isEditingAmountItem.id === selectedItem.id && (
                      <div className="d-inline-flex align-items-baseline ms-1">
                        (
                        <input
                          className="form-control smj-input p-0"
                          style={{
                            maxWidth: '50px',
                            boxShadow: 'inset 0 -1px 0 #7e7e7e',
                          }}
                          ref={pillInputRef}
                          type="number"
                          min={1}
                          defaultValue={selectedItem.amount ?? 1}
                          onChange={e => {
                            e.target.value = formatNumber(e.target.value)
                            const num = e.target.value
                            if (+num >= 1) {
                              selectedItem.amount = +num
                              setItemToRemove(null)
                            } else if (+num == 0) {
                              setItemToRemove(selectedItem)
                            }
                            onSelected(selectedItems)
                          }}
                        />
                        )
                      </div>
                    )}
                </>
              ) : (
                <IconAndLabel
                  icon={selectedItem.icon ?? ''}
                  label={selectedItem.name}
                />
              )}
              <span
                className="pill-close"
                onClick={() => removeSelectedItem(selectedItem)}
              >
                <i className="fa-solid fa-xmark" />
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
          placeholder={
            multiple && selectedItems.length !== 0 ? '' : placeholder
          }
          value={search}
          ref={dropdownInputRef}
          onClick={toggleDropdown}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="btn-group" ref={dropdownRef}>
        <ul
          className={`dropdown-menu ${isOpen ? 'show' : ''} smj-dropdown-menu`}
        >
          {items.map((part, index) => (
            <React.Fragment key={`dropdown-${index}`}>
              {part.map(
                item =>
                  shouldShowItem(item) && (
                    <li key={`dropdown-item-${item.id}`}>
                      <button
                        className={`dropdown-item smj-dropdown-item fs-5 ${
                          selectedItems.find(
                            selectedItem => selectedItem.id === item.id
                          )
                            ? 'smj-selected'
                            : ''
                        }`}
                        type="button"
                        onClick={() => selectItem(item)}
                      >
                        {item.name}
                      </button>
                    </li>
                  )
              )}
              {index < items.length - 1 && part.length !== 0 && (
                <div
                  className="dropdown-divider"
                  key={`divider-${index}`}
                ></div>
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>
    </>
  )
}
