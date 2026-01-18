import { Card, CardHeader } from "../ui/card";

const files = [
    {
        name: "resume.pdf",
        size: "2 MB",
        dateAdded: "2023-10-01",
    },
    {
        name: "project_proposal.docx",
        size: "1.5 MB",
        dateAdded: "2023-10-02",
    },
    {
        name: "budget.xlsx",
        size: "500 KB",
        dateAdded: "2023-10-03",
    },
];
export default function AddedFiles() {

    return <main>
    <h1>
        Added Files
    </h1>
    <div>
        {files.map((file) => (
            <Card key={file.name} className="mb-4 p-4">
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