import { Card, CardHeader } from "@/components/ui/card";

export default function AddedFiles() {
    const files = [
        { id: 1, name: "Document1.pdf", size: "2MB", dateAdded: "2024-06-01" },
        { id: 2, name: "Image1.png", size: "500KB", dateAdded: "2024-06-02" },
        { id: 3, name: "Presentation.pptx", size: "5MB", dateAdded: "2024-06-03" },
    ];

    return <main className="p-4">
    <h1 className="text-2xl font-bold mb-4">Added Files</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
            <Card key={file.id} className="border rounded-lg p-4 shadow-sm">
                <CardHeader className="text-lg font-medium">
                    {file.name}
                </CardHeader>
                <div className="text-sm text-gray-500">
                    <p>Size: {file.size}</p>
                    <p>Date Added: {file.dateAdded}</p>
                </div>
            </Card>
        ))}
    </div>
    </main>
}