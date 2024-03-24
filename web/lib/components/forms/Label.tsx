interface LabelProps {
  id: string
  label?: string
  margin?: boolean
  mdNone?: boolean
  mandatory?: boolean
}

export const Label = ({
  id,
  label = '',
  margin = true,
  mdNone = false,
  mandatory = false,
}: LabelProps) => {
  return (
    <>
      <label
        className={
          'form-label d-block fw-bold' +
          (margin ? ' mt-4' : '') +
          (mdNone ? ' d-md-none' : '')
        }
        htmlFor={id}
      >
        {label}
        {mandatory && <span style={{ color: 'red' }}> *</span>}
      </label>
    </>
  )
}
