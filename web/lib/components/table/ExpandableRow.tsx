'use client'
import { useEffect, useRef, useState } from 'react'
import { RowCells } from './RowCells'

interface RowProps {
  data: RowCells[]
  children: React.ReactNode
  colspan?: number
  className?: string
  onDrop?: (e: React.DragEvent<HTMLTableRowElement>) => void
}

export const Arrow = () => (
  <i className="fas fa-angle-right" style={{ width: '0.5rem' }}></i>
)
export const ExpandedArrow = () => (
  <i className="fas fa-angle-down" style={{ width: '0.5rem' }}></i>
)

function Cell({
  contents,
  tooltip,
  colspan,
  stickyRight = false,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contents: any
  tooltip?: string
  colspan?: number
  stickyRight?: boolean
}) {
  return (
    <td
      className={
        'text-truncate text-wrap ' +
        (stickyRight ? 'smj-sticky-col-right smj-expandable-row' : '')
      }
      title={tooltip}
      colSpan={colspan}
    >
      {contents}
    </td>
  )
}

export function ExpandableRow({
  data,
  children,
  colspan,
  className = '',
  onDrop,
}: RowProps) {
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => {
    setExpanded(!expanded)
  }
  const [expandedHeight, setExpandedHeight] = useState(0)
  const collapsibleContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setExpandedHeight(collapsibleContentRef.current?.scrollHeight || 0)
  }, [children, collapsibleContentRef])

  const onDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    if (onDrop) {
      e.preventDefault()
    }
  }

  return (
    <>
      <tr
        className={`smj-expandable-row ${className}`}
        onClick={toggleExpanded}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        {data.slice(0, 1).map((field, index) => (
          <Cell
            key={index}
            contents={
              <>
                {expanded && <ExpandedArrow />}
                {!expanded && <Arrow />}
                {field.content}
              </>
            }
            colspan={colspan}
          />
        ))}
        {data.slice(1).map((field, index) => (
          <Cell
            key={index + 1}
            contents={field.content}
            tooltip={
              typeof field.content === 'string' ? field.content : undefined
            }
            stickyRight={field.stickyRight}
          />
        ))}
      </tr>

      <tr
        className="smj-details-row no-hover"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <td colSpan={colspan ?? data.length}>
          <div
            className="smj-row-collapsible smj-white"
            ref={collapsibleContentRef}
            style={{ maxHeight: expanded ? `${expandedHeight}px` : '0px' }}
          >
            <div className="pt-2">{children}</div>
          </div>
        </td>
      </tr>
    </>
  )
}
