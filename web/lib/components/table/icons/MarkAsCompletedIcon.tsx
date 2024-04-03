interface MarkAsCompletedIconProps {
  completed: boolean
  setCompleted: (completed: boolean) => void
}

export default function MarkAsCompletedIcon({
  completed,
  setCompleted,
}: MarkAsCompletedIconProps) {
  const color = completed ? 'smj-action-completed' : 'smj-action-complete'
  const title = completed
    ? 'Označit jako nedokončený'
    : 'Označit jako dokončený'
  const icon = completed ? 'fa-times' : 'fa-check'
  return (
    <i
      className={`fas ${icon} ${color}`}
      title={title}
      onClick={e => {
        e.stopPropagation()
        setCompleted(!completed)
      }}
    ></i>
  )
}
