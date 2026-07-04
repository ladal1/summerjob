// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { ColorTagCell } from '../lib/components/table/ColorTagCell'
import { ColorTag } from '../lib/prisma/client'

describe('ColorTagCell', () => {
  it('uses optimistic tags for rapid toggles before props revalidate', () => {
    const onChange = vi.fn()
    const { container } = render(
      createElement(ColorTagCell, { tags: [], onChange })
    )

    fireEvent.click(container.querySelector('.smj-color-picker-toggle')!)

    const swatches = Array.from(
      document.body.querySelectorAll<HTMLElement>('.smj-color-swatch')
    )

    fireEvent.click(swatches[0])
    fireEvent.click(swatches[1])

    expect(onChange.mock.calls).toEqual([
      [[ColorTag.YELLOW]],
      [[ColorTag.YELLOW, ColorTag.GREEN]],
    ])
    expect(container.querySelectorAll('.smj-color-stripe')).toHaveLength(2)
  })
})
