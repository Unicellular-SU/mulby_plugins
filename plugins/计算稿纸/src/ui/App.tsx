import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useMulby } from './hooks/useMulby'

interface PluginInitData {
  pluginName: string
  featureCode: string
  input: string
  mode?: string
  route?: string
}

interface LineItem {
  id: string
  expr: string
  result: string
  error?: string
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const normalizeExpression = (raw: string) =>
  raw.replace(/,/g, '').replace(/[×]/g, '*').replace(/[÷]/g, '/').replace(/\s+/g, ' ')

const expandPercent = (expression: string) =>
  expression.replace(/(\d+(?:\.\d+)?)(\s*)%/g, '($1/100)')

const isSafeExpression = (expression: string) => /^[0-9+\-*/().\s]+$/.test(expression)

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toString()
  }
  const normalized = Number(value.toPrecision(14))
  const text = normalized.toString()
  if (text.includes('e') || text.includes('E')) {
    return normalized.toFixed(10).replace(/0+$/, '').replace(/\.$/, '')
  }
  return text
}

const evaluateExpression = (expr: string) => {
  const normalized = normalizeExpression(expr).trim()
  if (!normalized) {
    return { expr: '', result: '', error: undefined }
  }

  const expanded = expandPercent(normalized)
  if (!isSafeExpression(expanded)) {
    return { expr: normalized, result: '', error: '非法字符' }
  }

  try {
    const value = Function(`"use strict"; return (${expanded});`)()
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      return { expr: normalized, result: '', error: '计算错误' }
    }
    return { expr: normalized, result: formatNumber(value), error: undefined }
  } catch (error) {
    return { expr: normalized, result: '', error: '计算错误' }
  }
}

export default function App() {
  const { clipboard, notification } = useMulby('计算稿纸')
  const [lines, setLines] = useState<LineItem[]>([{ id: createId(), expr: '', result: '' }])
  const inputRefs = useRef<Array<HTMLTextAreaElement | null>>([])

  const focusLine = (index: number) => {
    const target = inputRefs.current[index]
    if (target) {
      target.focus()
      target.select()
    }
  }

  const autoResize = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto'
    target.style.height = `${target.scrollHeight}px`
  }

  useEffect(() => {
    window.mulby?.onPluginInit?.((data: PluginInitData) => {
      if (data.input) {
        setLines([{ id: createId(), ...evaluateExpression(data.input) }])
      }
    })
  }, [])

  useEffect(() => {
    if (lines.length === 1) {
      focusLine(0)
    }
  }, [lines.length])

  const handleChange = (index: number, value: string) => {
    const next = evaluateExpression(value)
    setLines((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, expr: next.expr, result: next.result, error: next.error } : line
      )
    )
  }

  const handleEnter = (index: number) => {
    setLines((prev) => {
      const current = prev[index]
      const nextExpr = current?.result ?? ''
      const nextLine: LineItem = { id: createId(), ...evaluateExpression(nextExpr) }
      const updated = [...prev.slice(0, index + 1), nextLine, ...prev.slice(index + 1)]
      return updated
    })

    requestAnimationFrame(() => {
      focusLine(index + 1)
    })
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleEnter(index)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusLine(Math.max(0, index - 1))
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusLine(Math.min(lines.length - 1, index + 1))
      return
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      const selectionLength = event.currentTarget.selectionEnd - event.currentTarget.selectionStart
      if (selectionLength > 0) {
        return
      }
      const result = lines[index]?.result
      if (result) {
        event.preventDefault()
        void copyResult(result)
      }
    }
  }

  const copyResult = async (result: string) => {
    try {
      if (clipboard.writeText) {
        await clipboard.writeText(result)
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result)
      }
      notification.show('结果已复制', 'success')
    } catch (error) {
      notification.show('复制失败', 'error')
    }
  }

  const rows = useMemo(
    () =>
      lines.map((line, index) => (
        <div key={line.id} className="calc-row">
          <div className="row-index">{index + 1}</div>
          <textarea
            ref={(el) => {
              inputRefs.current[index] = el
              if (el) {
                autoResize(el)
              }
            }}
            className="row-input"
            value={line.expr}
            rows={1}
            onChange={(event) => {
              autoResize(event.currentTarget)
              handleChange(index, event.currentTarget.value)
            }}
            onKeyDown={(event) => handleKeyDown(event, index)}
            placeholder={index === 0 ? '输入算式，例如 1200 + 15% * 2' : ''}
          />
          <div className={`row-result ${line.error ? 'row-result-error' : ''}`}>
            <button
              className="row-result-copy"
              type="button"
              onClick={() => {
                if (line.error || !line.result) {
                  return
                }
                void copyResult(line.result)
              }}
            >
              {line.error ? line.error : line.result || '—'}
            </button>
          </div>
        </div>
      )),
    [lines]
  )

  return (
    <div className="app">
      <div className="titlebar">计算稿纸</div>
      <div className="container">
        <div className="calc-header">
          <div className="row-index">#</div>
          <div className="header-label">算式</div>
          <div className="header-label header-result">结果</div>
        </div>
        <div className="calc-sheet">{rows}</div>
        <div className="calc-hint">
          Enter 新行带入结果 · ↑↓ 切换行 · Ctrl/Command + C 复制结果 · 支持 % 与千分位粘贴
        </div>
      </div>
    </div>
  )
}
