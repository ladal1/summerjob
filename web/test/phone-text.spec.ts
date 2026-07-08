// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { createElement } from 'react'
import {
  PhoneLink,
  TextWithPhones,
  phoneToTelHref,
  formatPhone,
} from '../lib/components/phone/PhoneText'

describe('formatPhone', () => {
  it('formats a 9-digit number as XXX YYY ZZZ', () => {
    expect(formatPhone('776553057')).toBe('776 553 057')
    expect(formatPhone('730846690')).toBe('730 846 690')
  })

  it('formats a spaced 9-digit number uniformly', () => {
    expect(formatPhone('776 553 057')).toBe('776 553 057')
  })

  it('strips +420 prefix and formats', () => {
    expect(formatPhone('+420 776 553 057')).toBe('776 553 057')
    expect(formatPhone('+420776553057')).toBe('776 553 057')
  })

  it('strips 00420 prefix and formats', () => {
    expect(formatPhone('00420 776 553 057')).toBe('776 553 057')
    expect(formatPhone('00420776553057')).toBe('776 553 057')
  })

  it('keeps Slovak +421 prefix but formats the digits', () => {
    expect(formatPhone('+421 902 123 456')).toBe('+421 902 123 456')
    expect(formatPhone('+421902123456')).toBe('+421 902 123 456')
  })

  it('returns input unchanged for unrecognized formats', () => {
    expect(formatPhone('12345')).toBe('12345')
  })
})

describe('phoneToTelHref', () => {
  it('strips spaces and dashes', () => {
    expect(phoneToTelHref('776 553 057')).toBe('tel:776553057')
    expect(phoneToTelHref('+420 776 553 057')).toBe('tel:+420776553057')
  })

  it('handles slovak prefix', () => {
    expect(phoneToTelHref('+421 902 123 456')).toBe('tel:+421902123456')
  })
})

describe('PhoneLink', () => {
  it('renders formatted phone as text and tel: href', () => {
    const { container } = render(
      createElement(PhoneLink, { phone: '776 553 057' })
    )
    const a = container.querySelector('a')!
    expect(a.getAttribute('href')).toBe('tel:776553057')
    expect(a.textContent).toBe('776 553 057')
  })

  it('strips +420 prefix in display but keeps it in href', () => {
    const { container } = render(
      createElement(PhoneLink, { phone: '+420 776 553 057' })
    )
    const a = container.querySelector('a')!
    expect(a.getAttribute('href')).toBe('tel:+420776553057')
    expect(a.textContent).toBe('776 553 057')
  })

  it('applies className and style', () => {
    const { container } = render(
      createElement(PhoneLink, {
        phone: '732 403 990',
        className: 'my-link',
        style: { color: 'red' },
      })
    )
    const a = container.querySelector('a')!
    expect(a.className).toContain('my-link')
    expect(a.style.color).toBe('red')
  })
})

describe('TextWithPhones', () => {
  it('detects a plain 9-digit phone and formats it', () => {
    const text = '730846690 Radmila Kiácová (radunkal@seznam.cz)'
    const { container } = render(createElement(TextWithPhones, { text }))
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('tel:730846690')
    expect(links[0].textContent).toBe('730 846 690')
    expect(container.textContent).toContain('Radmila Kiácová')
  })

  it('detects a space-separated phone with surrounding text', () => {
    const text = 'Pan Dombrovský - 776 553 057'
    const { container } = render(createElement(TextWithPhones, { text }))
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('tel:776553057')
    expect(links[0].textContent).toBe('776 553 057')
  })

  it('detects Czech +420 prefix and strips it in display', () => {
    const text = 'Kontakt: +420 605 250 286'
    const { container } = render(createElement(TextWithPhones, { text }))
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('tel:+420605250286')
    expect(links[0].textContent).toBe('605 250 286')
  })

  it('detects Slovak +421 prefix', () => {
    const text = 'Kontakt: +421 902 123 456'
    const { container } = render(createElement(TextWithPhones, { text }))
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('tel:+421902123456')
  })

  it('detects multiple phones in one string', () => {
    const text = 'Pan Dombrovský - 776 553 057, paní Gavrasová - 605 250 286'
    const { container } = render(createElement(TextWithPhones, { text }))
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('href')).toBe('tel:776553057')
    expect(links[0].textContent).toBe('776 553 057')
    expect(links[1].getAttribute('href')).toBe('tel:605250286')
    expect(links[1].textContent).toBe('605 250 286')
  })

  it('detects 00420 prefix and strips it in display', () => {
    const text = 'Volat 00420 776 553 057'
    const { container } = render(createElement(TextWithPhones, { text }))
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('tel:00420776553057')
    expect(links[0].textContent).toBe('776 553 057')
  })

  it('returns plain text when no phone is present', () => {
    const text = 'Pan Novák (bez telefonu)'
    const { container } = render(createElement(TextWithPhones, { text }))
    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(container.textContent).toBe(text)
  })

  it('does not match numbers that are too short or too long', () => {
    const text = 'ID 12345678 nebo 12345678901'
    const { container } = render(createElement(TextWithPhones, { text }))
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })

  it('passes className and style to links', () => {
    const text = 'Pan Dombrovský - 776 553 057'
    const { container } = render(
      createElement(TextWithPhones, {
        text,
        linkClassName: 'my-link',
        linkStyle: { color: 'blue' },
      })
    )
    const a = container.querySelector('a')!
    expect(a.className).toContain('my-link')
    expect(a.style.color).toBe('blue')
  })
})
