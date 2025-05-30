import React, { useState, useRef } from 'react'
import { FieldErrors, Path, UseFormRegisterReturn } from 'react-hook-form'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Label } from '../Label'
import FormWarning from '../FormWarning'

interface MarkdownEditorProps {
  id: string
  label: string
  placeholder?: string
  rows?: number
  register: () => UseFormRegisterReturn
  errors: FieldErrors<Record<string, unknown>>
  labelClassName?: string
  margin?: boolean
  mandatory?: boolean
  value?: string
}

export const MarkdownEditor = ({
  id,
  label,
  placeholder,
  rows = 4,
  register,
  errors,
  labelClassName = '',
  margin = true,
  mandatory = false,
  value = '',
}: MarkdownEditorProps) => {
  const [showPreview, setShowPreview] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const error = errors?.[id as Path<Record<string, unknown>>]?.message as
    | string
    | undefined

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = currentValue.substring(start, end)

    const newText =
      currentValue.substring(0, start) +
      before +
      selectedText +
      after +
      currentValue.substring(end)

    setCurrentValue(newText)

    // Trigger onChange event for react-hook-form
    const event = new Event('input', { bubbles: true })
    Object.defineProperty(event, 'target', {
      writable: false,
      value: { ...textarea, value: newText },
    })
    textarea.dispatchEvent(event)

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos =
        start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const formatButtons = [
    {
      icon: 'fas fa-bold',
      title: 'Tučné (Ctrl+B)',
      action: () => insertText('**', '**'),
    },
    {
      icon: 'fas fa-italic',
      title: 'Kurzíva (Ctrl+I)',
      action: () => insertText('*', '*'),
    },
    {
      icon: 'fas fa-underline',
      title: 'Podtržené',
      action: () => insertText('<u>', '</u>'),
    },
    {
      icon: 'fas fa-strikethrough',
      title: 'Přeškrtnuté',
      action: () => insertText('~~', '~~'),
    },
    {
      icon: 'fas fa-link',
      title: 'Odkaz',
      action: () => insertText('[', '](https://example.com)'),
    },
    {
      icon: 'fas fa-list-ul',
      title: 'Seznam s odrážkami',
      action: () => insertText('\n- ', ''),
    },
    {
      icon: 'fas fa-list-ol',
      title: 'Číslovaný seznam',
      action: () => insertText('\n1. ', ''),
    },
    {
      icon: 'fas fa-table',
      title: 'Tabulka',
      action: () =>
        insertText(
          '\n| Sloupec 1 | Sloupec 2 |\n|-----------|----------|\n| Buňka 1   | Buňka 2   |\n',
          ''
        ),
    },
  ]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          insertText('**', '**')
          break
        case 'i':
          e.preventDefault()
          insertText('*', '*')
          break
      }
    }
  }

  const registerReturn = register()

  return (
    <>
      <Label
        id={id}
        label={label}
        margin={margin}
        mandatory={mandatory}
        className={labelClassName}
      />

      {/* Toolbar */}
      <div className="d-flex gap-2 mb-2 flex-wrap">
        {formatButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            className="btn btn-outline-secondary btn-sm"
            title={button.title}
            onClick={button.action}
          >
            <i className={button.icon}></i>
          </button>
        ))}
        <button
          type="button"
          className={`btn btn-sm ${showPreview ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setShowPreview(!showPreview)}
          title="Přepnout náhled"
        >
          <i className="fas fa-eye"></i> Náhled
        </button>
      </div>

      {/* Editor/Preview */}
      {showPreview ? (
        <div
          className="border rounded p-3 bg-light"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentValue || '*Náhled se zobrazí zde...*'}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <textarea
          id={id}
          ref={textareaRef}
          className="form-control border smj-textarea p-2 fs-5"
          placeholder={placeholder}
          rows={rows}
          value={currentValue}
          onKeyDown={handleKeyDown}
          name={registerReturn.name}
          onBlur={registerReturn.onBlur}
          onChange={e => {
            setCurrentValue(e.target.value)
            // Let react-hook-form handle the change as well
            if (registerReturn.onChange) {
              registerReturn.onChange(e)
            }
          }}
        />
      )}

      {/* Help text */}
      <small className="text-muted mt-1 d-block">
        Podporuje GitHub Flavored Markdown: **tučné**, *kurzíva*,
        ~~přeškrtnuté~~, [odkazy](url), seznamy, tabulky
      </small>

      <FormWarning message={error} />
    </>
  )
}
