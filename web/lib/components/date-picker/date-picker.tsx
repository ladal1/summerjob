import { formatDateLong } from 'lib/helpers/helpers'

interface SimpleDatePickerProps {
  initialDate: Date
  onDateChanged: (date: Date) => void
}

export default function SimpleDatePicker({
  initialDate,
  onDateChanged,
}: SimpleDatePickerProps) {
  const changeDate = (days: number) => {
    const newDate = new Date(initialDate)
    newDate.setDate(newDate.getDate() + days)
    console.log(newDate)
    onDateChanged(newDate)
  }

  return (
    <div className="input-group">
      <button
        className="btn btn-secondary p-2 pe-3 ps-3"
        type="button"
        onClick={() => changeDate(-1)}
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      <span className="form-control p-2 text-center align-self-center border-bottom">
        {formatDateLong(initialDate)}
      </span>
      <button
        className="btn btn-secondary p-2 pe-3 ps-3"
        type="button"
        onClick={() => changeDate(1)}
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  )
}
