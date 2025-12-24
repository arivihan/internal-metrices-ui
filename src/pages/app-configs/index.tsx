import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Search, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import JsonViewer from '@/components/common/JsonViewer'

import { fetchAppConfigs, searchAppConfigs, addAppConfig } from '@/services/appConfig'
import type { AppConfigType, AppConfigPaginatedResponse, SqlConfigItem, DynamoDbConfigItem } from '@/types/appConfig'
import { isSqlConfigResponse, isDynamoDbConfigResponse } from '@/types/appConfig'

type SelectedConfig =
  | { type: 'sql'; data: SqlConfigItem }
  | { type: 'dynamodb'; data: DynamoDbConfigItem }

type TabValue = 'sql' | 'dynamodb' | 'firebase'

const TAB_TO_CONFIG_TYPE: Record<TabValue, AppConfigType> = {
  sql: 'SQL_CONFIG',
  dynamodb: 'DYNAMODB_CONFIG',
  firebase: 'FIREBASE_CONFIG',
}

const TAB_LABELS: Record<TabValue, string> = {
  sql: 'SQL Config',
  dynamodb: 'DynamoDB Config',
  firebase: 'Firebase Config',
}

const PAGE_SIZE = 10
const DEBOUNCE_MS = 700

export default function AppConfigs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabValue) || 'sql'

  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)

  // Search states
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Data states for each tab
  const [sqlData, setSqlData] = useState<AppConfigPaginatedResponse | null>(null)
  const [dynamodbData, setDynamodbData] = useState<AppConfigPaginatedResponse | null>(null)
  const [firebaseData, setFirebaseData] = useState<AppConfigPaginatedResponse | null>(null)

  // Page states for each tab
  const [sqlPage, setSqlPage] = useState(0)
  const [dynamodbPage, setDynamodbPage] = useState(0)
  const [firebasePage, setFirebasePage] = useState(0)

  // Loading states
  const [loading, setLoading] = useState<Record<TabValue, boolean>>({
    sql: false,
    dynamodb: false,
    firebase: false,
  })

  // Track which tabs have been loaded (for lazy loading) - reset when search changes
  const loadedTabs = useRef<Set<TabValue>>(new Set())

  // View Dialog state
  const [selectedConfig, setSelectedConfig] = useState<SelectedConfig | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Add Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addFormType, setAddFormType] = useState<AppConfigType>('SQL_CONFIG')
  const [addFormKey, setAddFormKey] = useState('')
  const [addFormValue, setAddFormValue] = useState('')
  const [addFormError, setAddFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Debounce search input
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchInput])

  // Reset pages and loaded tabs when search changes
  useEffect(() => {
    setSqlPage(0)
    setDynamodbPage(0)
    setFirebasePage(0)
    loadedTabs.current.clear()
  }, [debouncedSearch])

  // Get current data/page based on active tab
  const getCurrentData = () => {
    switch (activeTab) {
      case 'sql':
        return sqlData
      case 'dynamodb':
        return dynamodbData
      case 'firebase':
        return firebaseData
    }
  }

  const getCurrentPage = () => {
    switch (activeTab) {
      case 'sql':
        return sqlPage
      case 'dynamodb':
        return dynamodbPage
      case 'firebase':
        return firebasePage
    }
  }

  const setCurrentPage = (page: number) => {
    switch (activeTab) {
      case 'sql':
        setSqlPage(page)
        break
      case 'dynamodb':
        setDynamodbPage(page)
        break
      case 'firebase':
        setFirebasePage(page)
        break
    }
  }

  // Fetch data for a specific tab (with or without search)
  const fetchTabData = useCallback(async (tab: TabValue, page: number, search: string) => {
    setLoading((prev) => ({ ...prev, [tab]: true }))
    try {
      let response: AppConfigPaginatedResponse

      if (search.trim()) {
        // Use search API
        response = await searchAppConfigs({
          appConfig: TAB_TO_CONFIG_TYPE[tab],
          searchText: search.trim(),
          pageNumber: page,
          pageSize: PAGE_SIZE,
        })
      } else {
        // Use regular fetch API
        response = await fetchAppConfigs({
          appConfigType: TAB_TO_CONFIG_TYPE[tab],
          pageNumber: page,
          pageSize: PAGE_SIZE,
        })
      }

      switch (tab) {
        case 'sql':
          setSqlData(response)
          break
        case 'dynamodb':
          setDynamodbData(response)
          break
        case 'firebase':
          setFirebaseData(response)
          break
      }

      // Mark tab as loaded
      loadedTabs.current.add(tab)
    } catch (error) {
      console.error(`Failed to fetch ${tab} data:`, error)
      toast.error(`Failed to load ${TAB_LABELS[tab]}`)
    } finally {
      setLoading((prev) => ({ ...prev, [tab]: false }))
    }
  }, [])

  // Fetch data when tab changes or search changes
  useEffect(() => {
    const currentPage = getCurrentPage()

    if (!loadedTabs.current.has(activeTab)) {
      setLoading((prev) => ({ ...prev, [activeTab]: true }))
      fetchTabData(activeTab, currentPage, debouncedSearch)
    }
  }, [activeTab, debouncedSearch, fetchTabData])

  // Handle page change - always refetch
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchTabData(activeTab, newPage, debouncedSearch)
  }

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab })
  }, [activeTab, setSearchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setDebouncedSearch('')
  }

  const handleOpenAddDialog = () => {
    // Pre-select the config type based on active tab
    setAddFormType(TAB_TO_CONFIG_TYPE[activeTab])
    setAddFormKey('')
    setAddFormValue('')
    setAddFormError('')
    setAddDialogOpen(true)
  }

  const handleAddConfig = async () => {
    // Validate form
    if (!addFormKey.trim()) {
      setAddFormError('Config key is required')
      return
    }

    if (!addFormValue.trim()) {
      setAddFormError('Config value is required')
      return
    }

    // Validate JSON
    let parsedValue: Record<string, unknown>
    try {
      parsedValue = JSON.parse(addFormValue)
    } catch {
      setAddFormError('Config value must be valid JSON')
      return
    }

    setAddFormError('')
    setIsSubmitting(true)

    try {
      await addAppConfig({
        appConfigType: addFormType,
        configKey: addFormKey.trim(),
        configValue: parsedValue,
      })

      toast.success('Config added successfully')
      setAddDialogOpen(false)

      // Refresh the current tab's data
      const tabForType = Object.entries(TAB_TO_CONFIG_TYPE).find(
        ([, type]) => type === addFormType
      )?.[0] as TabValue | undefined

      if (tabForType) {
        loadedTabs.current.delete(tabForType)
        if (tabForType === activeTab) {
          fetchTabData(activeTab, getCurrentPage(), debouncedSearch)
        }
      }
    } catch (error) {
      console.error('Failed to add config:', error)
      toast.error('Failed to add config')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRowClick = (config: SelectedConfig) => {
    setSelectedConfig(config)
    setDialogOpen(true)
  }

  const getDialogTitle = () => {
    if (!selectedConfig) return ''
    if (selectedConfig.type === 'sql') {
      return selectedConfig.data.name
    }
    return selectedConfig.data.featureKey
  }

  const getDialogData = () => {
    if (!selectedConfig) return {}
    if (selectedConfig.type === 'sql') {
      // For SQL config, try to parse as JSON, otherwise show as string
      try {
        return JSON.parse(selectedConfig.data.value)
      } catch {
        return { value: selectedConfig.data.value }
      }
    }
    // For DynamoDB/Firebase, show the full config object
    return {
      featureKey: selectedConfig.data.featureKey,
      ...(selectedConfig.data.keyValues && { keyValues: selectedConfig.data.keyValues }),
      ...(selectedConfig.data.objectValues && { objectValues: selectedConfig.data.objectValues }),
    }
  }

  const truncateValue = (value: string, maxLength: number = 100) => {
    if (value.length <= maxLength) return value
    return value.slice(0, maxLength) + '...'
  }

  const formatKeyValues = (keyValues?: Record<string, string>, objectValues?: Record<string, unknown>) => {
    if (keyValues && Object.keys(keyValues).length > 0) {
      return JSON.stringify(keyValues, null, 2)
    }
    if (objectValues && Object.keys(objectValues).length > 0) {
      return JSON.stringify(objectValues, null, 2)
    }
    return '-'
  }

  const currentData = getCurrentData()
  const currentPage = getCurrentPage()
  const isLoading = loading[activeTab]

  // Helper to check response type and get items
  const getDataItems = (data: AppConfigPaginatedResponse | null) => {
    if (!data) return []
    if (isSqlConfigResponse(data)) {
      return data.data
    }
    if (isDynamoDbConfigResponse(data)) {
      return data.data.content
    }
    return []
  }

  const isSqlTab = activeTab === 'sql'
  const dataItems = getDataItems(currentData)

  // Show loading state if data hasn't been loaded yet
  const showLoading = isLoading || (!currentData && !loadedTabs.current.has(activeTab))

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight">App Configs</h1>

      {/* Tabs and Search */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger
              value="sql"
              className="gap-2 hover:text-brand-600/60 data-[state=active]:text-brand-600 dark:hover:text-brand-400/60 dark:data-[state=active]:text-brand-400"
            >
              SQL Config
              {sqlData && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {sqlData.totalElements}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="dynamodb"
              className="gap-2 hover:text-brand-600/60 data-[state=active]:text-brand-600 dark:hover:text-brand-400/60 dark:data-[state=active]:text-brand-400"
            >
              DynamoDB Config
              {dynamodbData && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {dynamodbData.totalElements}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="firebase"
              className="gap-2 hover:text-brand-600/60 data-[state=active]:text-brand-600 dark:hover:text-brand-400/60 dark:data-[state=active]:text-brand-400"
            >
              Firebase Config
              {firebaseData && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {firebaseData.totalElements}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search and Add */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-500" />
              <Input
                placeholder="Search configs..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-[240px] pl-9 pr-8"
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleOpenAddDialog}
              className="gap-2 border-[var(--color-brand)]/50 text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10"
            >
              <Plus className="size-4" />
              Add Config
            </Button>
          </div>
        </div>
      </Tabs>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {showLoading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">{isSqlTab ? 'Name' : 'Feature Key'}</TableHead>
                <TableHead className="w-2/3">{isSqlTab ? 'Value' : 'Key/Object Values'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(PAGE_SIZE)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/3">{isSqlTab ? 'Name' : 'Feature Key'}</TableHead>
                  <TableHead className="w-2/3">{isSqlTab ? 'Value' : 'Key/Object Values'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {debouncedSearch ? `No configs found for "${debouncedSearch}"` : 'No configs found'}
                    </TableCell>
                  </TableRow>
                ) : isSqlTab && currentData && isSqlConfigResponse(currentData) ? (
                  // SQL Config table
                  currentData.data.map((config, index) => (
                    <TableRow
                      key={`${config.name}-${index}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick({ type: 'sql', data: config })}
                    >
                      <TableCell className="font-medium font-mono text-sm align-top">
                        {config.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap break-all bg-muted/50 p-2 rounded text-xs">
                          {truncateValue(config.value, 300)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))
                ) : currentData && isDynamoDbConfigResponse(currentData) ? (
                  // DynamoDB/Firebase Config table
                  currentData.data.content.map((config, index) => (
                    <TableRow
                      key={`${config.featureKey}-${index}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick({ type: 'dynamodb', data: config })}
                    >
                      <TableCell className="font-medium font-mono text-sm align-top">
                        {config.featureKey}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap break-all bg-muted/50 p-2 rounded text-xs">
                          {truncateValue(formatKeyValues(config.keyValues, config.objectValues), 300)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))
                ) : null}
              </TableBody>
            </Table>

            {/* Pagination */}
            {currentData && currentData.totalPages > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {currentData.totalElements} items
                </p>
                {currentData.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage + 1} of {currentData.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= currentData.totalPages - 1}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Config Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-mono text-base break-all pr-8">
              {getDialogTitle()}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <JsonViewer data={getDialogData()} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Config Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="border-b pb-4">
            <DialogTitle>Add New Config</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="config-type">Config Type</Label>
              <Select
                value={addFormType}
                onValueChange={(value) => setAddFormType(value as AppConfigType)}
              >
                <SelectTrigger id="config-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SQL_CONFIG">SQL Config</SelectItem>
                  <SelectItem value="DYNAMODB_CONFIG">DynamoDB Config</SelectItem>
                  <SelectItem value="FIREBASE_CONFIG">Firebase Config</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-key">Config Key</Label>
              <Input
                id="config-key"
                placeholder="Enter config key..."
                value={addFormKey}
                onChange={(e) => setAddFormKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-value">Config Value</Label>
              <Textarea
                id="config-value"
                placeholder='{"key": "value"}'
                value={addFormValue}
                onChange={(e) => setAddFormValue(e.target.value)}
                className="font-mono text-sm min-h-[120px]"
              />
            </div>
            {addFormError && (
              <p className="text-sm text-destructive">{addFormError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddConfig} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Config'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
