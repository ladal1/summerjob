import EditBox from '../forms/EditBox'

interface HeaderNoContentProps {
  label: string
}

export const HeaderNoContent = ({ label }: HeaderNoContentProps) => {
  return (
    <EditBox>
      <div className="px-3 py-2">
        <h3 className="mb-0">{label}</h3>
      </div>
    </EditBox>
  )
}
