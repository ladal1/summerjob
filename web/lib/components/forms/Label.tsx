interface LabelProps {
  id: string
  label?: string
  margin?: boolean // generally very used part of className
  className?: string // other aditional part to className
  mandatory?: boolean
}

export const Label = ({
  id,
  label = '',
  className = '',
  margin = true,
  mandatory = false,
}: LabelProps) => {
  return (
    <>
      <label
        className={`form-label d-block fw-bold ${
          margin ? ' mt-4' : ''
        } ${className}`}
        htmlFor={id}
      >
        {label}
        {mandatory && <span style={{ color: 'red' }}> *</span>}
      </label>
    </>
  )
}
