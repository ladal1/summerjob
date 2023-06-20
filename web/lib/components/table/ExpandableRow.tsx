'use client'
import { useEffect, useRef, useState } from 'react'

interface RowProps {
  data: any[]
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
}: {
  contents: any
  tooltip?: string
  colspan?: number
}) {
  return (
    <td className="text-truncate" title={tooltip} colSpan={colspan}>
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
                {field}
              </>
            }
            colspan={colspan}
          />
        ))}
        {data.slice(1).map((field, index) => (
          <Cell
            key={index + 1}
            contents={field}
            tooltip={typeof field === 'string' ? field : undefined}
          />
        ))}
      </tr>

      <tr className="smj-details-row" onDrop={onDrop} onDragOver={onDragOver}>
        <td colSpan={colspan ?? data.length}>
          <div
            className="smj-row-collapsible"
            ref={collapsibleContentRef}
            style={{ maxHeight: expanded ? `${expandedHeight}px` : '0px' }}
          >
            <div className="p-2">{children}</div>
          </div>
        </td>
      </tr>
    </>
  )
}
