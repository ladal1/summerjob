interface PinIconProps {
  isPinned: boolean
  setPinned: (pinned: boolean) => void
}

export const PinIcon = ({ isPinned, setPinned }: PinIconProps) => {
  const color = isPinned ? 'smj-action-pinned' : 'smj-action-pin'
  const title = isPinned ? 'Odepnout' : 'Připnout'
  const icon = isPinned ? 'fa-thumbtack' : 'fa-thumbtack'
  return (
    <i
      className={`fas ${icon} ${color}`}
      title={title}
      onClick={e => {
        e.stopPropagation()
        setPinned(!isPinned)
      }}
    ></i>
  )
}
