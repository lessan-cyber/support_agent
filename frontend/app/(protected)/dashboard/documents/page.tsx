// app/dashboard/documents/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Search, Filter, Grid3x3, List, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PdfUploader } from "@/components/pdf-uploader";
import { DocumentCard } from "@/components/dashboard/documents/document-card";
import { DocumentsTable } from "@/components/dashboard/documents/documents-table";
import { DocumentsEmptyState } from "@/components/dashboard/documents/documents-empty-state";
import { PdfPreviewModal } from "@/components/dashboard/documents/pdf-preview-modal";
import { toast } from "sonner";
import {
    getDocuments,
    deleteDocument,
    updateDocument,
} from "@/app/actions/upload_document";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface Document {
    id: string;
    filename: string;
    size: number;
    uploaded_at: string;
    url: string;
}

interface DocumentsResponse {
    documents: Document[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function DocumentsPage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date-desc");
    const [dateFilter, setDateFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [previewDocument, setPreviewDocument] = useState<Document | null>(
        null,
    );
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const limit = 12;

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await getDocuments({
                page: currentPage,
                limit,
                sort: sortBy,
                date_filter: dateFilter,
                search: searchQuery,
            });

            setDocuments(response.documents.map((doc) => ({
                id: doc.id,
                filename: doc.filename,
                size: doc.file_size,
                uploaded_at: doc.created_at,
                url: doc.download_url,
            })));
            setTotalDocuments(response.count);
            setTotalPages(Math.max(1, Math.ceil(response.count / limit)));
        } catch (error) {
            toast.error("Failed to load documents. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [currentPage, sortBy, dateFilter, searchQuery]);

    // Handle document actions
    const handleDownload = async (doc: Document) => {
        try {
            const a = document.createElement("a");
            a.href = doc.url;
            a.download = doc.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast.success("Document downloaded successfully.");
        } catch (error) {
            toast.error("Failed to download document.");
        }
    };

    const handleDelete = async (documentId: string) => {
        try {
            await deleteDocument(documentId);

            setDocuments(documents.filter((doc) => doc.id !== documentId));
            setTotalDocuments(totalDocuments - 1);

            toast.success("Document deleted successfully.");
        } catch (error) {
            toast.error("Failed to delete document.", {
                position: "bottom-right",
            });
        }
    };

    const handleRename = async (documentId: string, newName: string) => {
        try {
            await updateDocument(documentId, { filename: newName });

            setDocuments(
                documents.map((doc) =>
                    doc.id === documentId ? { ...doc, filename: newName } : doc,
                ),
            );

            toast.success("Document renamed successfully.");
        } catch (error) {
            toast.error("Failed to rename document.", {
                position: "bottom-right",
            });
        }
    };

    const handleShare = async (documentId: string) => {
        try {
            const document = documents.find((doc) => doc.id === documentId);
            if (!document) return;

            await navigator.clipboard.writeText(document.url);

            toast.info("Document link copied to clipboard.", {
                position: "bottom-right",
            });
        } catch (error) {
            toast.error("Failed to copy link.", { position: "bottom-right" });
        }
    };

    const handlePreview = (document: Document) => {
        setPreviewDocument(document);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">All Documents</h1>
                    <Badge variant="secondary">{totalDocuments}</Badge>
                </div>
                <Dialog
                    open={uploadDialogOpen}
                    onOpenChange={setUploadDialogOpen}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <PdfUploader onCancel={() => setUploadDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by date" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-desc">Newest first</SelectItem>
                        <SelectItem value="date-asc">Oldest first</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="size-asc">Smallest first</SelectItem>
                        <SelectItem value="size-desc">Largest first</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex gap-1 border rounded-md p-1">
                    <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                    >
                        <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        onClick={() => setViewMode("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : documents.length === 0 ? (
                    <DocumentsEmptyState
                        onUploadClick={() => setUploadDialogOpen(true)}
                    />
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {documents.map((document) => (
                            <DocumentCard
                                key={document.id}
                                document={document}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                onRename={handleRename}
                                onShare={handleShare}
                                onPreview={handlePreview}
                            />
                        ))}
                    </div>
                ) : (
                    <DocumentsTable
                        documents={documents}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onRename={handleRename}
                        onShare={handleShare}
                        onPreview={handlePreview}
                    />
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    className={
                                        currentPage === 1
                                            ? "pointer-events-none opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>

                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 &&
                                        page <= currentPage + 1)
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() =>
                                                    setCurrentPage(page)
                                                }
                                                isActive={currentPage === page}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return (
                                        <PaginationItem key={page}>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }
                                return null;
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            Math.min(totalPages, p + 1),
                                        )
                                    }
                                    className={
                                        currentPage === totalPages
                                            ? "pointer-events-none opacity-50"
                                            : "cursor-pointer"
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* PDF Preview Modal */}
            <PdfPreviewModal
                document={previewDocument}
                onClose={() => setPreviewDocument(null)}
            />
        </div>
    );
}
