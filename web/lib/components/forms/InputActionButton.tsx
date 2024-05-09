interface InputActionButtonProps {
  onClick: () => void
  className: string
  title: string
}

export const InputActionButton = ({
  onClick,
  className,
  title,
}: InputActionButtonProps) => {
  return (
    <>
      <i
        className={`${className} cursor-pointer`}
        title={title}
        onClick={e => {
          e.stopPropagation()
          onClick()
        }}
      ></i>
    </>
  )
}
