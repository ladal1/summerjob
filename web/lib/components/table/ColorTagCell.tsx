'use client'
import { ColorTag } from 'lib/prisma/client'
import {
  colorTagMapping,
  colorTagOrder,
} from 'lib/data/enumMapping/colorTagMapping'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ColorTagCellProps {
  tags: ColorTag[]
  // When provided, the cell is editable and shows an inline palette picker.
  // When omitted, only the colored stripes are rendered (read-only).
  onChange?: (tags: ColorTag[]) => void
}

const MENU_WIDTH = 120

export function ColorTagCell({ tags, onChange }: ColorTagCellProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  const toggleRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const editable = onChange !== undefined

  // Position the (portalled) menu next to the palette icon using fixed
  // coordinates so it escapes the table's overflow/scroll clipping.
  useLayoutEffect(() => {
    if (!open || !toggleRef.current) return
    const rect = toggleRef.current.getBoundingClientRect()
    const left = Math.min(rect.left, window.innerWidth - MENU_WIDTH - 8)
    setCoords({ top: rect.bottom + 4, left: Math.max(8, left) })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!toggleRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    const close = () => setOpen(false)
    document.addEventListener('mousedown', handlePointerDown)
    // Fixed position becomes stale on scroll/resize, so close instead.
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const toggleTag = (tag: ColorTag) => {
    if (!onChange) return
    const next = tags.includes(tag)
      ? tags.filter(t => t !== tag)
      : [...tags, tag]
    onChange(next)
  }

  const orderedTags = colorTagOrder.filter(t => tags.includes(t))

  return (
    <span className="smj-color-tag-cell" onClick={e => e.stopPropagation()}>
      <span
        className="smj-color-stripes"
        aria-hidden={orderedTags.length === 0}
      >
        {orderedTags.map(tag => (
          <span
            key={tag}
            className="smj-color-stripe"
            style={{ backgroundColor: colorTagMapping[tag].color }}
            title={colorTagMapping[tag].label}
          />
        ))}
      </span>
      {editable && (
        <>
          <i
            ref={toggleRef as React.RefObject<HTMLElement>}
            className="fas fa-palette smj-color-picker-toggle"
            title="Barevné štítky"
            onClick={e => {
              e.stopPropagation()
              setOpen(o => !o)
            }}
          />
          {open &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                ref={menuRef}
                className="smj-color-picker-menu"
                style={{ top: coords.top, left: coords.left }}
                onClick={e => e.stopPropagation()}
              >
                {colorTagOrder.map(tag => {
                  const active = tags.includes(tag)
                  return (
                    <span
                      key={tag}
                      className={`smj-color-swatch${active ? ' active' : ''}`}
                      style={{ backgroundColor: colorTagMapping[tag].color }}
                      title={colorTagMapping[tag].label}
                      onClick={e => {
                        e.stopPropagation()
                        toggleTag(tag)
                      }}
                    >
                      {active && <i className="fas fa-check" />}
                    </span>
                  )
                })}
              </div>,
              document.body
            )}
        </>
      )}
    </span>
  )
}
