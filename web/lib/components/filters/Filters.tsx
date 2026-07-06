import { formatDateLong } from 'lib/helpers/helpers'
import { ChangeEvent, useEffect, useState } from 'react'
import Select, {
  components,
  CSSObjectWithLabel,
  StylesConfig,
} from 'react-select'

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
    maxWidth?: string
  }[]
  multiSelectsDays?: {
    id: string
    options: SelectOptionDays[]
    selected: SelectOptionDays[]
    onSelectChanged: (days: Date[]) => void
    placeholder?: string
    maxWidth?: string
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
      maxWidth: '300px',
      minHeight: '42px',
      boxShadow: '1px 1px 2px 2px rgba(0, 0, 0, 0.1)',
    }) as CSSObjectWithLabel,
  valueContainer: base =>
    ({
      ...base,
      flexWrap: 'wrap',
      maxHeight: '120px',
      overflowY: 'auto',
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MultiValueComp = components.MultiValue as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ValueContainerComp = components.ValueContainer as any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OptionComp = components.Option as any

const multiSelectComponents = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MultiValue: (props: any) => {
    const values = props.getValue()
    if (values.length > 1) return null
    return <MultiValueComp {...props} />
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ValueContainer: (props: any) => {
    const values = props.getValue()
    if (values.length > 1) {
      return (
        <ValueContainerComp {...props}>
          <span className="text-muted">{values.length} vybráno</span>
        </ValueContainerComp>
      )
    }
    return <ValueContainerComp {...props} />
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Option: (props: any) => {
    return (
      <OptionComp {...props}>
        <div className="d-flex align-items-center justify-content-between">
          <span className="smj-option-label">{props.data.label}</span>
          {props.isSelected && (
            <i className="fas fa-check smj-option-check"></i>
          )}
        </div>
      </OptionComp>
    )
  },
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

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
          <div className="smj-filter-search-wrapper">
            <i className="fas fa-magnifying-glass smj-filter-search-icon"></i>
            <input
              id="search"
              type="text"
              className="smj-filter-search"
              placeholder="Vyhledat..."
              value={search}
              onChange={e => onSearchChanged(e.target.value)}
            />
          </div>
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
                {mounted ? (
                  <Select<ReactSelectOption, true>
                    inputId={select.id}
                    instanceId={select.id}
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
                    hideSelectedOptions={false}
                    styles={{
                      ...multiSelectStyles,
                      control: base =>
                        ({
                          ...base,
                          backgroundColor: 'white',
                          border: 0,
                          borderRadius: '5px',
                          minWidth: '200px',
                          maxWidth: select.maxWidth ?? '300px',
                          minHeight: '42px',
                          boxShadow: '1px 1px 2px 2px rgba(0, 0, 0, 0.1)',
                        }) as CSSObjectWithLabel,
                    }}
                    components={multiSelectComponents}
                  />
                ) : (
                  <div className="smj-select-placeholder" />
                )}
              </div>
            </div>
          ))}
        {multiSelectsDays &&
          multiSelectsDays.map(select => (
            <div className="col-auto mb-3" key={select.id}>
              <div className="d-inline-block">
                {mounted ? (
                  <Select<ReactSelectOption, true>
                    inputId={select.id}
                    instanceId={select.id}
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
                    hideSelectedOptions={false}
                    styles={{
                      ...multiSelectStyles,
                      control: base =>
                        ({
                          ...base,
                          backgroundColor: 'white',
                          border: 0,
                          borderRadius: '5px',
                          minWidth: '200px',
                          maxWidth: select.maxWidth ?? '300px',
                          minHeight: '42px',
                          boxShadow: '1px 1px 2px 2px rgba(0, 0, 0, 0.1)',
                        }) as CSSObjectWithLabel,
                    }}
                    components={multiSelectComponents}
                  />
                ) : (
                  <div className="smj-select-placeholder" />
                )}
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
