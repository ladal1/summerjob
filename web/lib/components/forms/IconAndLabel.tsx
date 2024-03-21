interface IconAndLabelProps {
  label: string
  icon: string
  reverseOrder?: boolean
}
export const IconAndLabel = ({
  label,
  icon,
  reverseOrder = false,
}: IconAndLabelProps) => {
  return (
    <>
      {!reverseOrder ? (
        <>
          <i className={`${icon} me-2`}></i>
          {label}
        </>
      ) : (
        <>
          <span className="me-2">{label}</span>
          <i className={icon}></i>
        </>
      )}
    </>
  )
}
