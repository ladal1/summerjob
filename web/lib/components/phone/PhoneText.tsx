import React from 'react'

// Matches Czech (+420) and Slovak (+421) phone numbers: optional country
// code prefix, then 9 digits optionally separated by single spaces
// (e.g. "776 553 057", "730846690", "+420 776 553 057", "+421 902 123 456").
// Lookbehind/lookahead prevent partial matches inside longer digit runs.
const PHONE_REGEX =
  /(?<!\d)(?:(?:\+|00)42[01][\s]?)?(?:\d{3}[\s]?){2}\d{3}(?!\d)/g

// Strips Czech/Slovak country code (+420/00420, +421/00421) and reformats
// 9 digits uniformly as "XXX YYY ZZZ". Other prefixes are preserved.
export function formatPhone(phone: string): string {
  const p = phone.replace(/[\s-]/g, '')
  const czechMatch = p.match(/^(?:\+|00)420(\d{9})$/)
  if (czechMatch) {
    const d = czechMatch[1]
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  }
  const slovakMatch = p.match(/^(?:\+|00)421(\d{9})$/)
  if (slovakMatch) {
    const d = slovakMatch[1]
    return `+421 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  }
  if (/^\d{9}$/.test(p)) {
    return `${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`
  }
  return phone
}

export function phoneToTelHref(phone: string): string {
  return `tel:${phone.replace(/[\s-]/g, '')}`
}

interface PhoneLinkProps {
  phone: string
  className?: string
  style?: React.CSSProperties
}

export function PhoneLink({ phone, className, style }: PhoneLinkProps) {
  return (
    <a href={phoneToTelHref(phone)} className={className} style={style}>
      {formatPhone(phone)}
    </a>
  )
}

interface TextWithPhonesProps {
  text: string
  linkClassName?: string
  linkStyle?: React.CSSProperties
}

export function TextWithPhones({
  text,
  linkClassName,
  linkStyle,
}: TextWithPhonesProps) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const regex = new RegExp(PHONE_REGEX.source, 'g')
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const phone = match[0]
    parts.push(
      <a
        key={`phone-${key++}`}
        href={phoneToTelHref(phone)}
        className={linkClassName}
        style={linkStyle}
      >
        {formatPhone(phone)}
      </a>
    )
    lastIndex = match.index + phone.length
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts.length > 0 ? parts : text}</>
}
