import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Save,
  Database,
  DatabaseZap,
  FileText,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { createQuery } from '@/services/sqlPlayground'
import type { ParamSchema, ParamType } from '@/types/sqlPlayground'

interface ParamEntry {
  id: string
  key: string
  type: ParamType
}

export default function CreateQuery() {
  const navigate = useNavigate()

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sqlQuery, setSqlQuery] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [params, setParams] = useState<ParamEntry[]>([
    { id: crypto.randomUUID(), key: '', type: 'text' },
  ])

  // Submission state
  const [submitting, setSubmitting] = useState(false)

  // Add new parameter entry
  const handleAddParam = () => {
    setParams((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: '', type: 'text' },
    ])
  }

  // Remove parameter entry
  const handleRemoveParam = (id: string) => {
    setParams((prev) => prev.filter((p) => p.id !== id))
  }

  // Update parameter key
  const handleParamKeyChange = (id: string, key: string) => {
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, key } : p))
    )
  }

  // Update parameter type
  const handleParamTypeChange = (id: string, type: ParamType) => {
    setParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, type } : p))
    )
  }

  // Convert params array to ParamSchema object
  const buildParamSchema = (): ParamSchema => {
    const schema: ParamSchema = {}
    params.forEach((p) => {
      if (p.key.trim()) {
        schema[p.key.trim()] = p.type
      }
    })
    return schema
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Query name is required')
      return
    }
    if (!sqlQuery.trim()) {
      toast.error('SQL query is required')
      return
    }

    // Check for duplicate param keys
    const keys = params.filter((p) => p.key.trim()).map((p) => p.key.trim())
    const uniqueKeys = new Set(keys)
    if (keys.length !== uniqueKeys.size) {
      toast.error('Parameter names must be unique')
      return
    }

    setSubmitting(true)
    try {
      const response = await createQuery({
        name: name.trim(),
        description: description.trim(),
        sqlQuery: sqlQuery.trim(),
        paramSchema: buildParamSchema(),
        isActive,
      })

      if (response.success) {
        toast.success('Query created successfully')
        navigate('/dashboard/sql-playground')
      } else {
        toast.error(response.message || 'Failed to create query')
      }
    } catch (error) {
      console.error('Failed to create query:', error)
      toast.error('Failed to create query')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/sql-playground')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Create Query</h1>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Query
            </>
          )}
        </Button>
      </div>

      {/* Main Layout - Two Column */}
      <div className="grid h-[calc(100vh-180px)] gap-6 lg:grid-cols-2">
        {/* Left - SQL Editor */}
        <div className="flex flex-col rounded-xl border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <DatabaseZap className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">SQL Query</span>
          </div>
          <div className="flex-1 p-4">
            <Textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="SELECT * FROM users WHERE created_at >= :startDate"
              className="h-full min-h-[400px] resize-none font-mono text-sm bg-background border-border/50"
            />
          </div>
        </div>

        {/* Right - Configuration */}
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Query Details */}
          <div className="rounded-xl border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <FileText className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Query Details</span>
            </div>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., User Activity Report"
                  className="h-10 bg-background border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this query does..."
                  className="min-h-[80px] resize-none bg-background border-border/50"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 bg-background/50">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive" className="text-sm font-medium">
                    Active Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive queries won't be visible to users
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="flex-1 rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Parameters</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddParam}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="size-3" />
                Add
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3">
                {params.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <Database className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No parameters defined</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleAddParam}
                      className="mt-1 h-auto p-0 text-xs"
                    >
                      Add a parameter
                    </Button>
                  </div>
                ) : (
                  params.map((param, index) => (
                    <div
                      key={param.id}
                      className="flex items-center gap-2 rounded-lg border p-3 bg-background/50"
                    >
                      <div className="flex size-6 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      <Input
                        value={param.key}
                        onChange={(e) => handleParamKeyChange(param.id, e.target.value)}
                        placeholder="Parameter name"
                        className="flex-1 h-8 text-sm bg-background border-border/50"
                      />
                      <Select
                        value={param.type}
                        onValueChange={(v) => handleParamTypeChange(param.id, v as ParamType)}
                      >
                        <SelectTrigger className="w-28 h-8 text-sm bg-background border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveParam(param.id)}
                        className="size-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              {params.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Use <code className="rounded bg-muted px-1 py-0.5">:paramName</code> syntax in your SQL query to reference parameters
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
