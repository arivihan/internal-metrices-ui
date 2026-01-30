import { useState } from 'react'
import { FileUpload } from '@/components/files/FileUpload'
import { FilesList } from '@/components/files/FilesList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function FileManagement() {
    const [refreshList, setRefreshList] = useState(0)
    const [activeTab, setActiveTab] = useState("upload")

    const handleUploadComplete = () => {
        // Increment specific trigger to reload list
        setRefreshList(prev => prev + 1)
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">File Management</h2>
            </div>
            <p className="text-muted-foreground">
                Upload files to CDN and manage existing records.
            </p>

            <Separator className="my-4" />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="upload">Upload Files</TabsTrigger>
                    <TabsTrigger value="files">Uploaded Files</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload New Files</CardTitle>
                            <CardDescription>
                                Drag and drop files or select from your computer. Max 2GB per file.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FileUpload onUploadComplete={handleUploadComplete} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>File Library</CardTitle>
                            <CardDescription>
                                Browse and search all uploaded files.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FilesList refreshTrigger={refreshList} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
