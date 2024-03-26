interface FormHeaderProps {
  label: string
  secondaryLabel?: string
}

export const FormHeader = ({ label, secondaryLabel }: FormHeaderProps) => {
  return (
    <div className="px-3 py-2 smj-dark text-white rounded-top">
      <h2 className="mb-0">{label}</h2>
      {secondaryLabel && <small className="text-white">{secondaryLabel}</small>}
    </div>
  )
}
