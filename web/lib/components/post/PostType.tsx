'use client'
import React, { useState } from 'react'
import { Arrow, ExpandedArrow } from '../table/ExpandableRow'

interface PostTypeProps {
  title: string
  children: React.ReactNode
}
export default function PostType({ title, children }: PostTypeProps) {
  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = () => {
    setExpanded(!expanded)
  }
  const ArrowType = () => (expanded ? <ExpandedArrow /> : <Arrow />)
  return (
    <div className="smj-post-section mt-2 mb-2">
      <div
        onClick={toggleExpanded}
        className="smj-section-header p-3 pb-1 pt-2 cursor-pointer"
      >
        <h4>
          <b>{title}</b>
        </h4>
        <div className="me-2">
          <ArrowType />
        </div>
      </div>
      {expanded && <div className="p-3">{children}</div>}
    </div>
  )
}
