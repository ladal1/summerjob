import { formatDateLong } from 'lib/helpers/helpers'
import { ChangeEvent } from 'react'
import Select, { CSSObjectWithLabel, StylesConfig } from 'react-select'

interface SelectOption {
  id: string
  name: string
}

interface SelectOptionDays {
  id: string
  day: Date
}

interface ReactSelectOption {
  value: string
  label: string
}

interface FiltersProps {
  search: string
  onSearchChanged: (search: string) => void
  selects?: {
    id: string
    options: SelectOption[]
    selected: SelectOption
    onSelectChanged: (id: string) => void
    defaultOptionId?: string
  }[]
  selectsDays?: {
    id: string
    options: SelectOptionDays[]
    selected: SelectOptionDays
    onSelectChanged: (id: Date) => void
    defaultOptionId?: string
  }[]
  multiSelects?: {
    id: string
    options: SelectOption[]
    selected: SelectOption[]
    onSelectChanged: (ids: string[]) => void
    placeholder?: string
  }[]
  multiSelectsDays?: {
    id: string
    options: SelectOptionDays[]
    selected: SelectOptionDays[]
    onSelectChanged: (days: Date[]) => void
    placeholder?: string
  }[]
  checkboxes?: {
    id: string
    label: string
    checked: boolean
    onCheckboxChanged: (checked: boolean) => void
  }[]
}

const multiSelectStyles: StylesConfig<ReactSelectOption, true> = {
  control: base =>
    ({
      ...base,
      backgroundColor: 'white',
      border: 0,
      borderRadius: '5px',
      minWidth: '200px',
      minHeight: '42px',
      boxShadow: '1px 1px 2px 2px rgba(0, 0, 0, 0.1)',
    }) as CSSObjectWithLabel,
  option: base =>
    ({
      ...base,
      backgroundColor: 'white',
      color: 'black',
      ':hover': { backgroundColor: '#ffea9c' },
    }) as CSSObjectWithLabel,
  multiValue: base =>
    ({
      ...base,
      backgroundColor: '#fdc345',
      borderRadius: '4px',
    }) as CSSObjectWithLabel,
  multiValueLabel: base =>
    ({
      ...base,
      color: 'black',
    }) as CSSObjectWithLabel,
  multiValueRemove: base =>
    ({
      ...base,
      ':hover': { backgroundColor: 'rgba(0, 0, 0, 0.15)' },
    }) as CSSObjectWithLabel,
}

export function Filters({
  search,
  onSearchChanged,
  selects,
  selectsDays,
  multiSelects,
  multiSelectsDays,
  checkboxes,
}: FiltersProps) {
  const handleSelectChange = (
    id: string,
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    if (selects === undefined) {
      return
    }
    const selectedValue = e.target.value
    const select = selects.find(s => s.id === id)
    if (select) {
      select.onSelectChanged(selectedValue)
    }
  }

  const handleSelectDaysChange = (
    id: string,
    e: ChangeEvent<HTMLSelectElement>
  ) => {
    if (selectsDays === undefined) {
      return
    }
    const selectedValue = e.target.value
    const select = selectsDays.find(s => s.id === id)
    if (select) {
      select.onSelectChanged(new Date(selectedValue))
    }
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checkboxes === undefined) {
      return
    }
    const checkbox = checkboxes.find(cb => cb.id === id)
    if (checkbox) {
      checkbox.onCheckboxChanged(checked)
    }
  }

  return (
    <>
      <div className="row">
        <div className="col-auto mb-3">
          <label htmlFor="search">
            <i className="fas fa-magnifying-glass me-2"></i>
          </label>
          <input
            id="search"
            type="text"
            className="p-2 d-inline-block outline-none border-0 smj-filter-input smj-input"
            placeholder="Vyhledat..."
            value={search}
            onChange={e => onSearchChanged(e.target.value)}
          />
        </div>
        {selects &&
          selects.map(select => (
            <div className="col-auto mb-3" key={select.id}>
              <div className="d-inline-block">
                <select
                  name={select.id}
                  id={select.id}
                  className={`form-select p-2 bg-white smj-filter-input smj-input ${
                    select.defaultOptionId &&
                    select.id === select.defaultOptionId
                      ? 'smj-default-option'
                      : ''
                  }`}
                  value={select.selected.id}
                  onChange={e => handleSelectChange(select.id, e)}
                >
                  {select.options.map(option => (
                    <option value={option.id} key={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        {selectsDays &&
          selectsDays.map(select => (
            <div className="col-auto mb-3" key={select.id}>
              <div className="d-inline-block">
                <select
                  name={select.id}
                  id={select.id}
                  className={`form-select p-2 bg-white smj-filter-input smj-input ${
                    select.defaultOptionId &&
                    select.id === select.defaultOptionId
                      ? 'smj-default-option'
                      : ''
                  }`}
                  value={select.selected.id}
                  onChange={e => handleSelectDaysChange(select.id, e)}
                >
                  {select.options.map(option => (
                    <option value={option.id} key={option.id}>
                      {select.defaultOptionId &&
                      option.id === select.defaultOptionId
                        ? 'Vyberte den'
                        : formatDateLong(option.day)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        {multiSelects &&
          multiSelects.map(select => (
            <div className="col-auto mb-3" key={select.id}>
              <div className="d-inline-block">
                <Select<ReactSelectOption, true>
                  inputId={select.id}
                  options={select.options.map(o => ({
                    value: o.id,
                    label: o.name,
                  }))}
                  value={select.selected.map(o => ({
                    value: o.id,
                    label: o.name,
                  }))}
                  onChange={val =>
                    select.onSelectChanged((val ?? []).map(v => v.value))
                  }
                  placeholder={select.placeholder ?? 'Vyberte...'}
                  isMulti
                  isClearable
                  closeMenuOnSelect={false}
                  styles={multiSelectStyles}
                />
              </div>
            </div>
          ))}
        {multiSelectsDays &&
          multiSelectsDays.map(select => (
            <div className="col-auto mb-3" key={select.id}>
              <div className="d-inline-block">
                <Select<ReactSelectOption, true>
                  inputId={select.id}
                  options={select.options.map(o => ({
                    value: o.id,
                    label: formatDateLong(o.day),
                  }))}
                  value={select.selected.map(o => ({
                    value: o.id,
                    label: formatDateLong(o.day),
                  }))}
                  onChange={val =>
                    select.onSelectChanged(
                      (val ?? [])
                        .map(
                          v => select.options.find(o => o.id === v.value)?.day
                        )
                        .filter((d): d is Date => d !== undefined)
                    )
                  }
                  placeholder={select.placeholder ?? 'Vyberte dny...'}
                  isMulti
                  isClearable
                  closeMenuOnSelect={false}
                  styles={multiSelectStyles}
                />
              </div>
            </div>
          ))}
        {checkboxes &&
          checkboxes.map(checkbox => (
            <div className="col-auto mb-3 d-flex" key={checkbox.id}>
              <div className="form-check align-self-center align-items-center d-flex gap-2">
                <input
                  className="form-check-input fs-5 smj-checkbox"
                  type="checkbox"
                  id={checkbox.id}
                  checked={checkbox.checked}
                  onChange={e =>
                    handleCheckboxChange(checkbox.id, e.target.checked)
                  }
                />
                <label
                  className="form-check-label fw-lighter fs-5"
                  htmlFor={checkbox.id}
                >
                  {checkbox.label}
                </label>
              </div>
            </div>
          ))}
      </div>
    </>
  )
}
