interface LinkToOtherFormProps {
  label: string
  labelBold?: boolean
  handleEditedForm?: () => void
  margin?: boolean
}

export const LinkToOtherForm = ({
  label,
  labelBold = true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  handleEditedForm = () => {},
  margin = true,
}: LinkToOtherFormProps) => {
  return (
    <div className={`list-group w-50 ${margin ? 'mt-4' : ''}`}>
      <button
        type="submit"
        className="list-group-item d-flex justify-content-between align-items-center smj-text"
        onClick={handleEditedForm}
      >
        <span className={`${labelBold ? 'fw-bold' : ''}`}>{label}</span>
        <span className="badge rounded-pill bg-warning smj-shadow">
          <i className="fas fa-chevron-right p-1"></i>
        </span>
      </button>
    </div>
  )
}
