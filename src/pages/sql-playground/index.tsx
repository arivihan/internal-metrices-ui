import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSignals } from '@preact/signals-react/runtime'
import { format } from 'date-fns'
import {
  Database,
  Play,
  Download,
  CalendarIcon,
  Loader2,
  DatabaseZap,
  Terminal,
  FileText,
  CheckCircle2,
  XCircle,
  TableIcon,
  Plus,
  Pencil,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

import { fetchSavedQueries, executeQuery } from '@/services/sqlPlayground'
import type {
  SavedQuery,
  QueryParams,
  QueryResultRow,
} from '@/types/sqlPlayground'
import { cn } from '@/lib/utils'
import { isAdmin } from '@/signals/auth'

export default function SqlPlayground() {
  useSignals()
  const navigate = useNavigate()
  const location = useLocation()

  // Query list state
  const [queries, setQueries] = useState<SavedQuery[]>([])
  const [loadingQueries, setLoadingQueries] = useState(true)

  // Selected query state
  const [selectedQuery, setSelectedQuery] = useState<SavedQuery | null>(null)

  // Parameter form state
  const [paramValues, setParamValues] = useState<QueryParams>({})

  // Execution state
  const [executing, setExecuting] = useState(false)
  const [results, setResults] = useState<QueryResultRow[] | null>(null)
  const [resultColumns, setResultColumns] = useState<string[]>([])
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false)

  // Fetch queries on mount and when navigating back
  useEffect(() => {
    const loadQueries = async () => {
      setLoadingQueries(true)
      try {
        const response = await fetchSavedQueries({ pageNumber: 0, pageSize: 50 })
        if (response.success) {
          setQueries(response.data)
        } else {
          toast.error('Failed to load saved queries')
        }
      } catch (error) {
        console.error('Failed to load queries:', error)
        toast.error('Failed to load saved queries')
      } finally {
        setLoadingQueries(false)
      }
    }
    loadQueries()
  }, [location.key])

  // Handle query selection
  const handleSelectQuery = (query: SavedQuery) => {
    setSelectedQuery(query)
    const initialParams: QueryParams = {}
    if (query.paramSchema) {
      Object.keys(query.paramSchema).forEach((key) => {
        initialParams[key] = ''
      })
    }
    setParamValues(initialParams)
    setResults(null)
    setResultColumns([])
  }

  // Update param value
  const handleParamChange = (key: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [key]: value }))
  }

  // Execute query
  const handleExecute = async () => {
    if (!selectedQuery) return

    const paramKeys = Object.keys(selectedQuery.paramSchema || {})
    const emptyParams = paramKeys.filter((key) => !paramValues[key])
    if (emptyParams.length > 0) {
      toast.error(`Please fill all parameters: ${emptyParams.join(', ')}`)
      return
    }

    setExecuting(true)
    setResults(null)
    setResultColumns([])

    try {
      const data = await executeQuery(selectedQuery.id, paramValues)
      if (data && data.length > 0) {
        setResults(data)
        setResultColumns(Object.keys(data[0]))
        setResultsDialogOpen(true)
        toast.success(`Query returned ${data.length} rows`)
      } else {
        setResults([])
        setResultColumns([])
        setResultsDialogOpen(true)
        toast.info('Query returned no results')
      }
    } catch (error) {
      console.error('Query execution failed:', error)
      toast.error('Failed to execute query')
    } finally {
      setExecuting(false)
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (!results || results.length === 0) return

    const headers = resultColumns.join(',')
    const rows = results.map((row) =>
      resultColumns
        .map((col) => {
          const value = row[col]
          const str = String(value ?? '')
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedQuery?.name || 'query'}-results-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CSV downloaded')
  }

  // Convert camelCase to Title Case
  const toTitleCase = (str: string) => {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim()
  }

  // Render parameter input based on type
  const renderParamInput = (paramKey: string, paramType: string) => {
    const value = paramValues[paramKey] || ''
    const label = toTitleCase(paramKey)

    if (paramType === 'date') {
      const dateValue = value ? new Date(value) : undefined
      return (
        <div key={paramKey} className="space-y-2">
          <Label htmlFor={paramKey} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-10 bg-background border-border/50 hover:bg-accent/50',
                  !value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
                {value ? format(new Date(value), 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(d) =>
                  handleParamChange(paramKey, d ? format(d, 'yyyy-MM-dd') : '')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )
    }

    return (
      <div key={paramKey} className="space-y-2">
        <Label htmlFor={paramKey} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </Label>
        <Input
          id={paramKey}
          type={paramType === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => handleParamChange(paramKey, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="h-10 bg-background border-border/50"
        />
      </div>
    )
  }

  const hasParams = selectedQuery && Object.keys(selectedQuery.paramSchema || {}).length > 0

  // Filter queries based on role - admins see all, others see only active
  const visibleQueries = isAdmin.value ? queries : queries.filter((q) => q.isActive)

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">SQL Playground</h1>
        {isAdmin.value && (
          <Button
            onClick={() => navigate('/dashboard/sql-playground/create')}
            className="gap-2"
          >
            <Plus className="size-4" />
            Create Query
          </Button>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid h-[calc(100vh-180px)] gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left Sidebar - Query List */}
        <div className="flex flex-col rounded-xl border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <span className="text-sm font-medium">Saved Queries</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {visibleQueries.length}
            </Badge>
          </div>

          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {loadingQueries ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="rounded-lg border bg-background/50 p-3">
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))
              ) : visibleQueries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Database className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No saved queries</p>
                </div>
              ) : (
                visibleQueries.map((query) => (
                  <button
                    key={query.id}
                    onClick={() => handleSelectQuery(query)}
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-all hover:bg-accent/50',
                      selectedQuery?.id === query.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-transparent bg-background/50 hover:border-border/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <DatabaseZap className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm font-medium">{query.name}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground pl-5.5">
                          {query.description}
                        </p>
                      </div>
                      {query.isActive ? (
                        <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                      ) : (
                        <XCircle className="size-4 shrink-0 text-muted-foreground/50" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Query Execution */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {!selectedQuery ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Database className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No Query Selected</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a query from the sidebar to get started
              </p>
            </div>
          ) : (
            <>
              {/* Query Info & Parameters */}
              <div className="rounded-xl border bg-card/50 backdrop-blur-sm">
                {/* Query Header */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <DatabaseZap className="size-4 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold">{selectedQuery.name}</h2>
                      <p className="text-xs text-muted-foreground">{selectedQuery.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedQuery.isActive ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                        <CheckCircle2 className="mr-1 size-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="mr-1 size-3" />
                        Inactive
                      </Badge>
                    )}
                    {isAdmin.value && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard/sql-playground/create', { state: { query: selectedQuery } })}
                        className="gap-1.5"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Parameters & Execute */}
                <div className="p-5">
                  {hasParams ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Terminal className="size-4" />
                        Parameters
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(selectedQuery.paramSchema).map(
                          ([key, type]) => renderParamInput(key, type)
                        )}
                      </div>
                      <Separator className="my-4" />
                    </div>
                  ) : null}

                  <Button
                    onClick={handleExecute}
                    disabled={executing}
                    size="lg"
                    className="gap-2 shadow-sm"
                  >
                    {executing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Executing Query...
                      </>
                    ) : (
                      <>
                        <Play className="size-4" />
                        Execute Query
                      </>
                    )}
                  </Button>
                </div>
              </div>

            </>
          )}
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[90vw] w-[90vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b bg-muted/30 pr-14">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <TableIcon className="size-4 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Query Results</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {selectedQuery?.name}
                    {results && results.length > 0 && (
                      <span className="ml-2">
                        ({results.length} row{results.length !== 1 ? 's' : ''})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {results && results.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                  <Download className="size-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-4">
            {results && results.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <TableIcon className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No Results</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Query executed successfully but returned no data
                </p>
              </div>
            ) : results && results.length > 0 ? (
              <div className="h-full overflow-auto rounded-lg border bg-background">
                <table className="w-full caption-bottom text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b bg-muted">
                      <th className="h-10 w-12 px-2 text-center font-semibold text-xs uppercase tracking-wide sticky left-0 z-20 bg-muted">
                        #
                      </th>
                      {resultColumns.map((col) => (
                        <th key={col} className="h-10 px-2 text-left font-semibold text-xs uppercase tracking-wide whitespace-nowrap bg-muted">
                          {toTitleCase(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-2 w-12 text-center text-xs text-muted-foreground font-mono sticky left-0 bg-background">
                          {rowIndex + 1}
                        </td>
                        {resultColumns.map((col) => (
                          <td
                            key={col}
                            className="p-2 max-w-[400px] text-sm"
                          >
                            <span className="block truncate" title={row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}>
                              {row[col] !== null && row[col] !== undefined
                                ? String(row[col])
                                : <span className="text-muted-foreground">-</span>}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
