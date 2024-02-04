
interface LabelProps {
  id: string
  label: string
  margin?: boolean
  mdNone?: boolean
}

export const Label = ({
  id,
  label,
  margin = true,
  mdNone = false
}: LabelProps) => {
  return (
    <>
      <label
        className={'form-label d-block fw-bold' + (margin ? ' mt-4' : '') + (mdNone ? ' d-md-none' : '')}
        htmlFor={id}
      >
        {label}
      </label>
    </>
  )
}
