'use client'

import React from 'react'

interface ButtonWithSvgProps {
  children: React.ReactNode
  disabled: boolean
  iconSrc: string
  type: 'submit' | 'reset' | 'button'
  onClick: () => void
}

export default function ButtonWithSvg({
  disabled,
  onClick,
  children,
  iconSrc,
  type,
}: ButtonWithSvgProps) {
  return (
    <button
      className="btn btn-light p-2 d-flex align-items-center justify-content-center gap-2 text-nowrap"
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      <img src={iconSrc} width={20} height={20} alt="" />
      {children}
    </button>
  )
}
