import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchDashboardUIConfigs, saveDashboardUIConfig } from '@/services/dashboardUIConfig';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, Maximize2, Minimize2, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { DashboardUiConfig } from '@/types/dashboardUiConfig';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '@/components/ui/pagination';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function AppConfigs() {
  const [data, setData] = useState<DashboardUiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DashboardUiConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [editedJson, setEditedJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1); // 1-based
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [saving, setSaving] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

  const truncateValue = (value: string, maxLength: number = 100) => {
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength) + '...';
  };


  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetchDashboardUIConfigs({
        configName: '',
        pageNumber: currentPage - 1, // Convert 1-based to 0-based for API
        pageSize: pageSize,
      });
      if (response.data) {
        setData(response.data as DashboardUiConfig[]);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.totalElements || 0);
        setPageSize(response.size || PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  const handleView = (item: DashboardUiConfig) => {
    setSelectedItem(item);
    setEditedJson(JSON.stringify(item.uiJson, null, 2));
    setIsDialogOpen(true);
    setIsEditing(false);
    setJsonError(null);
  };

  const handleJsonChange = (value: string) => {
    setEditedJson(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON format. Please fix the errors.');
    }
  };

  const handleDuplicate = (item: DashboardUiConfig) => {
    setSelectedItem(item);
    setEditedJson(JSON.stringify(item.uiJson, null, 2));
    setIsFullWidth(true);
    setIsEditing(true);
    setIsDuplicating(true);
    setNewConfigName(item.configName + '_copy');
    setJsonError(null);
  };

  const handleSave = async () => {
    if (!selectedItem || jsonError) return;
    if (isDuplicating && !newConfigName.trim()) {
      setJsonError('Config name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const parsedJson = JSON.parse(editedJson);
      const payload = {
        configName: isDuplicating ? newConfigName.trim() : selectedItem.configName,
        isActive: true,
        order: 0,
        uiJson: parsedJson,
      };

      await saveDashboardUIConfig(payload);

      toast.success('Config updated successfully');
      setSelectedItem(null);
      setEditedJson('');
      setIsDialogOpen(false);
      setIsFullWidth(false);
      setIsEditing(false);
      setIsDuplicating(false);
      setNewConfigName('');
      setJsonError(null);
      await fetchData();
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Compute dialog content className based on isFullWidth
  const dialogContentClass = `${isFullWidth ? 'w-[98vw] max-w-[98vw]' : 'max-w-2xl'} max-h-[85vh] overflow-auto border rounded-lg shadow-lg`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard UI Configs</h1>

      {/* Table or Full Editor */}
      {!isFullWidth ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Name</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-16 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(PAGE_SIZE)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                data.map((item: DashboardUiConfig, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.configName}</TableCell>
                    <TableCell>
                      <pre className="whitespace-pre-wrap break-all bg-muted/50 p-2 rounded text-xs text-gray-400">
                        {truncateValue(JSON.stringify(item.uiJson), 300)}
                      </pre>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn btn-icon">
                            <MoreHorizontal className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleView(item)}>View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedItem(item);
                            setEditedJson(JSON.stringify(item.uiJson, null, 2));
                            setIsFullWidth(true);
                            setIsEditing(true);
                            setIsDuplicating(false);
                            setJsonError(null);
                          }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(item)}>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

      {totalPages > 0 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {totalItems > 0
              ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} items`
              : 'No items'}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {/* Page numbers with ellipsis */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  )
                  .reduce((acc: (number | string)[], page, idx, arr) => {
                    if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                      acc.push('ellipsis');
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((page, idx) =>
                    page === 'ellipsis' ? (
                      <span key={idx} className="px-1">…</span>
                    ) : (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'secondary' : 'ghost'}
                        size="icon"
                        className="size-8"
                        onClick={() => handlePageChange(page as number)}
                        disabled={page === currentPage}
                      >
                        {page}
                      </Button>
                    )
                  )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

    
        </div>
      ) : (
        <div className="w-full h-[80vh] flex flex-col items-center justify-center bg-background rounded-lg border shadow-lg p-4">
          <div className="w-full h-full max-w-5xl mx-auto flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{isDuplicating ? 'Duplicate Config' : selectedItem?.configName}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsFullWidth(false);
                  setIsDuplicating(false);
                  setNewConfigName('');
                }}
                aria-label="Minimize"
              >
                <Minimize2 className="size-4" />
              </Button>
            </div>
            {isDuplicating && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="configName">Config Name</label>
                <input
                  id="configName"
                  type="text"
                  className="w-full border rounded px-3 py-2 text-base focus:outline-none focus:ring focus:border-blue-400"
                  value={newConfigName}
                  onChange={e => setNewConfigName(e.target.value)}
                  placeholder="Enter config name"
                  autoFocus
                />
              </div>
            )}
            <CodeMirror
              value={editedJson}
              height="calc(100vh - 305px)"
              extensions={[json()]}
              theme="dark"
              onChange={(value) => handleJsonChange(value)}
              className="rounded-lg border flex-1 overflow-hidden"
              basicSetup={{ lineNumbers: true, foldGutter: true }}
            />
            {jsonError && <p className="text-red-500 text-sm mt-2">{jsonError}</p>}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFullWidth(false);
                  setIsDuplicating(false);
                  setNewConfigName('');
                  if (selectedItem) setEditedJson(JSON.stringify(selectedItem.uiJson, null, 2));
                  setJsonError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handleSave}
                disabled={!!jsonError || saving || (isDuplicating && !newConfigName.trim())}
              >
                {saving ? <span className="loader mr-2"></span> : null}Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* View/Edit Dialog */}
      {!isFullWidth && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className={dialogContentClass}>
            <DialogHeader className="flex">
              <DialogTitle className="truncate text-lg font-semibold text-white">
                {selectedItem?.configName || 'View Config'}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[500px] overflow-auto rounded-lg border bg-background">
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                className="rounded-lg !bg-background"
                customStyle={{ maxHeight: 500, overflow: 'auto', margin: 0 }}
              >
                {editedJson}
              </SyntaxHighlighter>
            </div>
            {jsonError && isEditing && <p className="text-red-500 text-sm mt-2">{jsonError}</p>}

          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
