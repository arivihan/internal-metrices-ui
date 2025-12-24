import { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JsonViewerProps {
  data: unknown
  initialExpanded?: boolean
  rootName?: string
}

interface JsonNodeProps {
  name: string | number
  value: unknown
  depth: number
  initialExpanded: boolean
  isLast: boolean
}

function getValueType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function JsonNode({ name, value, depth, initialExpanded, isLast }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(initialExpanded || depth < 2)
  const type = getValueType(value)
  const isExpandable = type === 'object' || type === 'array'

  const toggleExpand = useCallback(() => {
    if (isExpandable) {
      setExpanded((prev) => !prev)
    }
  }, [isExpandable])

  const renderValue = () => {
    switch (type) {
      case 'string':
        return (
          <span className="text-emerald-600 dark:text-emerald-400">
            "{value as string}"
          </span>
        )
      case 'number':
        return (
          <span className="text-blue-600 dark:text-blue-400">
            {String(value)}
          </span>
        )
      case 'boolean':
        return (
          <span className="text-amber-600 dark:text-amber-400">
            {String(value)}
          </span>
        )
      case 'null':
        return (
          <span className="text-gray-500 dark:text-gray-400 italic">
            null
          </span>
        )
      case 'undefined':
        return (
          <span className="text-gray-500 dark:text-gray-400 italic">
            undefined
          </span>
        )
      default:
        return null
    }
  }

  const renderExpandableValue = () => {
    if (type === 'array') {
      const arr = value as unknown[]
      if (arr.length === 0) {
        return <span className="text-muted-foreground">[]</span>
      }
      return (
        <>
          <span className="text-muted-foreground">[</span>
          {!expanded && (
            <span className="text-muted-foreground text-xs ml-1">
              {arr.length} {arr.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </>
      )
    }
    if (type === 'object') {
      const obj = value as Record<string, unknown>
      const keys = Object.keys(obj)
      if (keys.length === 0) {
        return <span className="text-muted-foreground">{'{}'}</span>
      }
      return (
        <>
          <span className="text-muted-foreground">{'{'}</span>
          {!expanded && (
            <span className="text-muted-foreground text-xs ml-1">
              {keys.length} {keys.length === 1 ? 'key' : 'keys'}
            </span>
          )}
        </>
      )
    }
    return null
  }

  const renderClosingBracket = () => {
    if (!expanded) return null
    if (type === 'array') return <span className="text-muted-foreground">]</span>
    if (type === 'object') return <span className="text-muted-foreground">{'}'}</span>
    return null
  }

  const renderChildren = () => {
    if (!expanded || !isExpandable) return null

    if (type === 'array') {
      const arr = value as unknown[]
      return arr.map((item, index) => (
        <JsonNode
          key={index}
          name={index}
          value={item}
          depth={depth + 1}
          initialExpanded={initialExpanded}
          isLast={index === arr.length - 1}
        />
      ))
    }

    if (type === 'object') {
      const obj = value as Record<string, unknown>
      const keys = Object.keys(obj)
      return keys.map((key, index) => (
        <JsonNode
          key={key}
          name={key}
          value={obj[key]}
          depth={depth + 1}
          initialExpanded={initialExpanded}
          isLast={index === keys.length - 1}
        />
      ))
    }

    return null
  }

  const isEmpty =
    (type === 'array' && (value as unknown[]).length === 0) ||
    (type === 'object' && Object.keys(value as Record<string, unknown>).length === 0)

  return (
    <div className="font-mono text-sm">
      <div
        className={cn(
          'flex items-start gap-1 py-0.5 rounded hover:bg-muted/50 -mx-1 px-1',
          isExpandable && !isEmpty && 'cursor-pointer'
        )}
        onClick={toggleExpand}
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {/* Expand/collapse icon */}
        <span className="w-4 h-4 flex items-center justify-center shrink-0 mt-0.5">
          {isExpandable && !isEmpty ? (
            expanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )
          ) : null}
        </span>

        {/* Key name */}
        <span className="text-purple-600 dark:text-purple-400">
          {typeof name === 'string' ? `"${name}"` : name}
        </span>
        <span className="text-muted-foreground">:</span>

        {/* Value */}
        <span className="flex-1 break-all">
          {isExpandable ? renderExpandableValue() : renderValue()}
          {!isLast && !isExpandable && (
            <span className="text-muted-foreground">,</span>
          )}
        </span>
      </div>

      {/* Children */}
      {renderChildren()}

      {/* Closing bracket */}
      {isExpandable && !isEmpty && expanded && (
        <div
          className="flex items-center py-0.5"
          style={{ paddingLeft: `${depth * 16}px` }}
        >
          <span className="w-4" />
          {renderClosingBracket()}
          {!isLast && <span className="text-muted-foreground">,</span>}
        </div>
      )}
    </div>
  )
}

export default function JsonViewer({
  data,
  initialExpanded = true,
  rootName,
}: JsonViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }, [data])

  const type = getValueType(data)
  const isExpandable = type === 'object' || type === 'array'

  if (!isExpandable) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 font-mono text-sm">
        {type === 'string' && (
          <span className="text-emerald-600 dark:text-emerald-400">
            "{data as string}"
          </span>
        )}
        {type === 'number' && (
          <span className="text-blue-600 dark:text-blue-400">{String(data)}</span>
        )}
        {type === 'boolean' && (
          <span className="text-amber-600 dark:text-amber-400">{String(data)}</span>
        )}
        {type === 'null' && (
          <span className="text-gray-500 dark:text-gray-400 italic">null</span>
        )}
      </div>
    )
  }

  const entries =
    type === 'array'
      ? (data as unknown[]).map((item, index) => ({ key: index, value: item }))
      : Object.entries(data as Record<string, unknown>).map(([key, value]) => ({
          key,
          value,
        }))

  return (
    <div className="relative">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
        title="Copy JSON"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>

      <div className="bg-muted/30 rounded-lg p-4 overflow-auto max-h-[60vh]">
        {rootName && (
          <div className="font-mono text-sm text-muted-foreground mb-1">
            {rootName}
          </div>
        )}
        <div className="font-mono text-sm">
          <span className="text-muted-foreground">
            {type === 'array' ? '[' : '{'}
          </span>
        </div>
        {entries.map((entry, index) => (
          <JsonNode
            key={entry.key}
            name={entry.key}
            value={entry.value}
            depth={1}
            initialExpanded={initialExpanded}
            isLast={index === entries.length - 1}
          />
        ))}
        <div className="font-mono text-sm">
          <span className="text-muted-foreground">
            {type === 'array' ? ']' : '}'}
          </span>
        </div>
      </div>
    </div>
  )
}
