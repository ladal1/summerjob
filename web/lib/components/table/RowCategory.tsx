'use client'
import { useState } from 'react'
import { Arrow, ExpandedArrow } from './ExpandableRow'

interface RowCategoryProps {
  title: string
  secondaryTitle?: string
  children: React.ReactNode
  numCols: number
  className?: string
}

export default function RowCategory({
  title,
  secondaryTitle,
  children,
  numCols,
  className,
}: RowCategoryProps) {
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => {
    setExpanded(!expanded)
  }
  const ArrowType = () => (expanded ? <ExpandedArrow /> : <Arrow />)

  return (
    <>
      <tr
        onClick={toggleExpanded}
        className={`cursor-pointer smj-category-row ${className}`}
      >
        <td className="text-truncate" title={title} colSpan={numCols}>
          <>
            <ArrowType />
            <span className="fw-bold">{title}</span>
            {secondaryTitle && (
              <span className="text-muted"> - {secondaryTitle}</span>
            )}
          </>
        </td>
      </tr>
      {expanded && <>{children}</>}
    </>
  )
}
