import { useState, useEffect, useRef } from 'react'
import { Upload, X, FileText, CheckCircle, Loader2, Copy, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { uploadFiles, getSupportedExtensions, getUploadTypes } from '@/services/uploadService'
import { cn } from '@/lib/utils'
import type { FileUploadResult } from '@/types/upload'

interface FileUploadProps {
    onUploadComplete?: () => void
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [uploading, setUploading] = useState(false)
    const [uploadType, setUploadType] = useState('general')
    const [folderPath, setFolderPath] = useState('')
    const [uploadProgress, setUploadProgress] = useState(0)
    const [uploadResults, setUploadResults] = useState<FileUploadResult[]>([])
    const [hasAttemptedUpload, setHasAttemptedUpload] = useState(false)
    const [startTime, setStartTime] = useState<number | null>(null)
    const [elapsedTime, setElapsedTime] = useState('0s')

    // Config state
    const [allowedExtensions, setAllowedExtensions] = useState<string[]>([])
    const [supportedTypes, setSupportedTypes] = useState<string[]>(['general'])
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        let interval: any
        if (uploading && startTime) {
            interval = setInterval(() => {
                const seconds = Math.floor((Date.now() - startTime) / 1000)
                setElapsedTime(seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [uploading, startTime])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [exts, types] = await Promise.all([
                    getSupportedExtensions(),
                    getUploadTypes()
                ])
                setAllowedExtensions(exts.map(e => e.toLowerCase()))
                if (types && types.length > 0) setSupportedTypes(types)
            } catch (error) {
                console.error('Failed to fetch upload config', error)
                // Fallback defaults
                setAllowedExtensions(['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'])
            }
        }
        fetchData()
    }, [])

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const validateFile = (file: File): boolean => {
        // Check size (2GB limit)
        const maxSize = 2 * 1024 * 1024 * 1024 // 2GB
        if (file.size > maxSize) {
            toast.error(`File ${file.name} exceeds 2GB limit`)
            return false
        }

        // Check extension
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!ext || (allowedExtensions.length > 0 && !allowedExtensions.includes(ext))) {
            // Some APIs return extensions with dots, some without. Let's try to match loosely if strict match fails.
            const hasDotMatch = allowedExtensions.some(e => e.replace('.', '') === ext);
            if (!hasDotMatch && allowedExtensions.length > 0) {
                toast.error(`File type .${ext} not supported`)
                return false
            }
        }
        return true
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFiles = Array.from(e.dataTransfer.files)
            const validFiles = droppedFiles.filter(validateFile)
            setFiles(prev => [...prev, ...validFiles])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files)
            const validFiles = selectedFiles.filter(validateFile)
            setFiles(prev => [...prev, ...validFiles])
        }
    }

    const removeFile = (idx: number) => {
        setFiles(prev => prev.filter((_, i) => i !== idx))
    }

    const handleUpload = async () => {
        if (files.length === 0) return

        setUploading(true)
        setUploadProgress(0)
        setStartTime(Date.now())
        setElapsedTime('0s')

        try {
            const response = await uploadFiles(files, uploadType, folderPath, (percent) => {
                setUploadProgress(percent)
            })

            setUploadProgress(100)
            setHasAttemptedUpload(true)

            if (response.results) {
                setUploadResults(response.results)
            }

            if (response.failureCount === 0) {
                toast.success(`Successfully uploaded ${response.successCount} files`)
                // Delay clearing files to show success state, or just show results UI
                setTimeout(() => {
                    if (onUploadComplete) onUploadComplete()
                }, 2000)
            } else if (response.successCount > 0) {
                toast.warning(`Uploaded ${response.successCount} files, but ${response.failureCount} failed.`, { duration: 5000 })
                // refresh list anyway for partial success
                if (onUploadComplete) onUploadComplete()
            } else {
                toast.error('Failed to upload files', { duration: 5000 })
            }

        } catch (error) {
            console.error('Upload failed', error)
            toast.error('Upload failed. Please try again.', { duration: 5000 })
        } finally {
            setUploading(false)
            setStartTime(null)
        }
    }

    const resetUpload = () => {
        setFiles([])
        setUploadResults([])
        setHasAttemptedUpload(false)
        setUploadProgress(0)
        setStartTime(null)
        setElapsedTime('0s')
        if (inputRef.current) {
            inputRef.current.value = ''
        }
    }

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url)
        toast.success('URL copied to clipboard')
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Settings */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="uploadType">Upload Type</Label>
                        <Select value={uploadType} onValueChange={setUploadType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                {supportedTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="folderPath">Folder Path (Optional)</Label>
                        <Input
                            id="folderPath"
                            placeholder="e.g., /materials/biology"
                            value={folderPath}
                            onChange={(e) => setFolderPath(e.target.value)}
                        />
                    </div>
                </div>

                {/* Dropzone */}
                <div
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center flex flex-col items-center justify-center transition-colors h-full min-h-[200px]",
                        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
                        uploading && "opacity-50 pointer-events-none"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleChange}
                        disabled={uploading}
                    />
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">
                        Drag & Drop files here or click to select
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Max file size: 2GB per file
                    </p>
                </div>
            </div>

            {/* Results UI */}
            {hasAttemptedUpload && uploadResults.length > 0 ? (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">Upload Results</h3>
                        <Button variant="outline" size="sm" onClick={resetUpload}>Upload More</Button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {uploadResults.map((result) => (
                            <div key={result.id || result.originalFileName} className={cn("p-3 border rounded-md flex items-center justify-between", result.success ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400" : "bg-destructive/10 border-destructive/20 text-destructive")}>
                                <div className="space-y-1 overflow-hidden">
                                    <div className="flex items-center space-x-2">
                                        {result.success ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                                        <span className="font-medium truncate text-sm">{result.originalFileName}</span>
                                    </div>
                                    {result.success ? (
                                        <div className="text-xs text-muted-foreground truncate font-mono max-w-[400px]">{result.cdnUrl}</div>
                                    ) : (
                                        <div className="text-xs text-red-600">{result.errorMessage || "Upload failed"}</div>
                                    )}
                                </div>
                                {result.success && (
                                    <Button variant="ghost" size="sm" onClick={() => handleCopyUrl(result.cdnUrl)}>
                                        <Copy className="h-3.5 w-3.5 mr-2" />
                                        Copy URL
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Selected Files List - Only show if not attempted yet or cleared */
                files.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm">Selected Files ({files.length})</h3>
                            {uploading && <span className="text-xs text-muted-foreground">Uploading... {uploadProgress}% ({elapsedTime})</span>}
                        </div>

                        {uploading && <Progress value={uploadProgress} className="h-2" />}

                        <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                            {files.map((file, idx) => (
                                <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 border rounded-md bg-background">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="bg-muted p-2 rounded">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="grid gap-0.5">
                                            <span className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">{file.name}</span>
                                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                                        </div>
                                    </div>
                                    {!uploading && (
                                        <Button variant="ghost" size="icon" onClick={() => removeFile(idx)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove</span>
                                        </Button>
                                    )}
                                    {uploading && uploadProgress === 100 && (
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {uploading ? 'Uploading...' : 'Start Upload'}
                            </Button>
                        </div>
                    </div>
                )
            )}
        </div>
    )
}
