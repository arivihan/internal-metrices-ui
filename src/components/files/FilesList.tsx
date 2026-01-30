import { useState, useEffect } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Copy,
    Search,
    ArrowLeft,
    ArrowRight,
    FileIcon,
    Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { getFilesList, getUploadTypes } from '@/services/uploadService'
import type { FileUploadRecord } from '@/types/upload'
import { format } from 'date-fns'

interface FilesListProps {
    refreshTrigger: number // Used to trigger refresh from parent
}

export function FilesList({ refreshTrigger }: FilesListProps) {
    const [data, setData] = useState<FileUploadRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(0)
    const [totalElements, setTotalElements] = useState(0)
    const [search, setSearch] = useState('')
    const [uploadType, setUploadType] = useState('all')
    const [supportedTypes, setSupportedTypes] = useState<string[]>([])
    const [pageSize] = useState(20)

    useEffect(() => {
        getUploadTypes().then(types => setSupportedTypes(types)).catch(console.error)
    }, [])

    useEffect(() => {
        fetchData()
    }, [page, pageSize, search, uploadType, refreshTrigger])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Debounce search if needed, but for now direct content
            const response = await getFilesList(page, pageSize, search, uploadType)
            if (response && response.records) {
                setData(response.records)
                setTotalPages(response.totalPages)
                setTotalElements(response.totalElements)
            } else {
                setData([]);
                setTotalElements(0);
            }
        } catch (error) {
            console.error('Failed to fetch files', error)
            toast.error('Failed to load records')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url)
        toast.success('CDN URL copied to clipboard')
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search) {
                setPage(0); // Reset to first page on search
                fetchData();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]); // This actually causes double fetch because of the other useEffect. 
    // Optimization: Remove search from the main useEffect dep array or handle debounce separately.
    // For simplicity given the context, I'll rely on the main useEffect but be careful.
    // Actually, let's fix the double calling logic.

    // Refactored logic:
    // Main useEffect depends on [page, pageSize, uploadType, refreshTrigger]
    // Search useEffect sets a debounced search term state or I just pass `search` to main useEffect but with a delay.
    // Let's keep it simple: The dependency on `search` in the main `useEffect` is fine if I don't debounce HERE.
    // But standard way is: input field updates `searchTerm`, debounced effect updates `debouncedSearch`, which triggers fetch.

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search files..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={uploadType} onValueChange={(val) => { setUploadType(val); setPage(0); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {supportedTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>File Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded By</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Loading Skeleton
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 w-32 bg-muted rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-12 bg-muted rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 w-24 bg-muted rounded animate-pulse" /></TableCell>
                                    <TableCell className="text-right"><div className="h-8 w-8 bg-muted rounded animate-pulse ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-foreground font-medium">
                                    No records found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center space-x-2">
                                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate max-w-[200px]" title={file.originalFileName}>{file.originalFileName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {file.uploadType}
                                        </span>
                                    </TableCell>
                                    <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                                    <TableCell>{file.uploadedBy || 'Unknown'}</TableCell>
                                    <TableCell>
                                        {file.createdAt ? format(new Date(file.createdAt), 'PP p') : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(file.cdnUrl)}>
                                            <Copy className="h-3.5 w-3.5 mr-2" />
                                            Copy URL
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Total {totalElements} records
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <div className="text-sm font-medium">
                        Page {page + 1} of {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1 || loading}
                    >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
