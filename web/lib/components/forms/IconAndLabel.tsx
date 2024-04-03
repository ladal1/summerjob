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
          <span className="overflow-ellipsis">{label}</span>
        </>
      ) : (
        <>
          <span className="me-2 overflow-ellipsis">{label}</span>
          <i className={icon}></i>
        </>
      )}
    </>
  )
}
