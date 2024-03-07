'use client'
import React, { createRef, useEffect, useState } from 'react'

export interface FilterSelectItem {
  id: string
  name: string
  searchable: string
}

interface FilterSelectProps {
  id: string,
  items: FilterSelectItem[][]
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
  const [search, setSearch] = useState(defaultSelected?.name ?? '')
  const [selected, setSelected] = useState(defaultSelected?.name ?? '');
  const [isOpen, setIsOpen] = useState(false)

  const dropdown = createRef<HTMLInputElement>()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // if dropdown-menu isn't even open do nothing
      if(!isOpen) 
        return
      
      /* 
      if we click anywhere outside of dropdown-menu it will close it
      even though when you click inside of dropdown-menu it will close it, 
      but also it will set selected item, that's the reason why we are exluding it from here
      */
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) {
        hideDropdown();
      }
    }

    // if it register mouse click anywhere on the window it will call handleCLickOutside
    document.addEventListener('mousedown', handleClickOutside) // alternatively use window. instead of document.

    // clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdown, isOpen]) // dependencies
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const hideDropdown = () => {
    setIsOpen(false)
  }

  const selectItem = (item: FilterSelectItem) => {
    hideDropdown()
    setSelected(item.name)
    onSelected(item.id) // save to form
    setSearch(item.name)
  }

  const shouldShowItem = (item: FilterSelectItem) => {
    const isSearchEmpty = search.length === 0 || search === selected
    return (
      isSearchEmpty ||
      item.searchable.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <>
      <div className="p-0" aria-expanded={isOpen}>
        <input
          id={id}
          className="smj-dropdown fs-5"
          type="text"
          placeholder={placeholder}
          value={search}
          onClick={toggleDropdown}
          onChange={e => setSearch(e.target.value)}
        ></input>
      </div>
      <div className="btn-group" ref={dropdown}>
        <ul className={`dropdown-menu ${isOpen ? 'show' : ''} smj-dropdown-menu`}>
          {items.map((part, index) => (
            <React.Fragment key={index}>
              {part.map((item) => (
                shouldShowItem(item) && (
                  <li key={item.id}>
                    <button
                      className="dropdown-item smj-dropdown-item fs-5"
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
