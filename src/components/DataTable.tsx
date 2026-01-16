import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Skeleton } from './ui/skeleton'
import type { TableHeader as TableHeaderType, Action } from '../types/sidebar'
import { MoreHorizontal } from 'lucide-react'

interface DataTableProps {
  columns: TableHeaderType[]
  data: Record<string, any>[]
  loading?: boolean
  onActionClick?: (action: Action, rowData: Record<string, any>) => void
  onRowClick?: (rowData: Record<string, any>) => void
}

/**
 * Reusable DataTable component using shadcn/ui
 * Supports multiple column types, actions, and row interactions
 */
export default function DataTable({
  columns,
  data,
  loading = false,
  onActionClick,
  onRowClick,
}: DataTableProps) {
  // Sort columns by order
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => (a.order || 999) - (b.order || 999))
  }, [columns])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {sortedColumns.map((column) => (
                <TableHead key={column.accessor} className="font-semibold">
                  {column.Header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={sortedColumns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No data available
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {sortedColumns.map((column) => (
              <TableHead key={column.accessor} className="font-semibold">
                {column.Header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onRowClick?.(row)}
            >
              {sortedColumns.map((column) => {
                const value = row[column.accessor]

                // Render actions column
                if (column.type === 'actions' && column.actions) {
                  return (
                    <TableCell key={column.accessor} className="w-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {column.actions.map((action, actionIndex) => (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation()
                                onActionClick?.(action, row)
                              }}
                            >
                              {action.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )
                }

                // Render link column
                if (column.type === 'link' && value) {
                  return (
                    <TableCell
                      key={column.accessor}
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      <a href={value} target="_blank" rel="noopener noreferrer">
                        {value}
                      </a>
                    </TableCell>
                  )
                }

                // Render image column
                if (column.type === 'image' && value) {
                  return (
                    <TableCell key={column.accessor} className="text-center">
                      <img
                        src={value}
                        alt={column.Header}
                        className="h-10 w-10 rounded-md object-cover mx-auto"
                      />
                    </TableCell>
                  )
                }

                // Render text column (default)
                return (
                  <TableCell key={column.accessor} className="max-w-xs">
                    <div className="line-clamp-2">
                      {value === null || value === undefined ? '-' : String(value)}
                    </div>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
