// app/dashboard/settings/data/page.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/app/actions/auth";

function DataSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-72" />
            </div>

            {/* Export Data Card Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-full max-w-lg" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-3 w-64" />
                </CardContent>
            </Card>

            {/* Delete Documents Card Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full max-w-xl" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-48" />
                </CardContent>
            </Card>

            {/* Danger Zone Card Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-full max-w-xl" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-36" />
                </CardContent>
            </Card>
        </div>
    );
}

export default function DataPage() {
    const router = useRouter();
    const { loading: userLoading } = useUser();
    const [exporting, setExporting] = useState(false);
    const [deletingDocuments, setDeletingDocuments] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const handleExportData = async () => {
        setExporting(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/data/export`,
                {
                    method: "POST",
                    credentials: "include",
                },
            );

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `data-export-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Your data has been exported successfully.", {
                position: "top-right",
            });
        } catch (error) {
            toast.error("Failed to export data. Please try again.", {
                position: "top-right",
            });
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAllDocuments = async () => {
        setDeletingDocuments(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/documents/all`,
                {
                    method: "DELETE",
                    credentials: "include",
                },
            );

            if (!response.ok) throw new Error("Delete failed");

            toast.success("All your documents have been deleted.", {
                position: "top-right",
            });

            router.push("/dashboard/");
        } catch (error) {
            toast.error("Failed to delete documents. Please try again.", {
                position: "top-right",
            });
        } finally {
            setDeletingDocuments(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirmText !== "DELETE") {
            toast.warning("Please type DELETE to confirm.", {
                position: "top-right",
            });
            return;
        }

        setDeletingAccount(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/account`,
                {
                    method: "DELETE",
                    credentials: "include",
                },
            );

            if (!response.ok) throw new Error("Delete failed");

            await signOut();
        } catch (error) {
            if (error instanceof Error && error.message !== "NEXT_REDIRECT") {
                toast.error("Failed to delete account. Please try again.", {
                    position: "top-right",
                });
            }
        } finally {
            setDeletingAccount(false);
        }
    };

    if (userLoading) {
        return <DataSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Data & Privacy</h2>
                <p className="text-sm text-muted-foreground">
                    Manage your data and privacy settings
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Export Your Data</CardTitle>
                    <CardDescription>
                        Download a copy of all your data including profile,
                        documents, and settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleExportData} disabled={exporting}>
                        {exporting ? (
                            "Exporting..."
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                        You'll receive a JSON file with all your data
                    </p>
                </CardContent>
            </Card>

            <Card className="border-orange-200 dark:border-orange-900">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <CardTitle className="text-orange-600">
                            Delete All Documents
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Permanently delete all your uploaded documents. This
                        action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete All Documents
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Delete all documents?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete all your
                                    uploaded documents. This action cannot be
                                    undone and your files will be lost forever.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAllDocuments}
                                    className="bg-orange-600 hover:bg-orange-700"
                                    disabled={deletingDocuments}
                                >
                                    {deletingDocuments
                                        ? "Deleting..."
                                        : "Delete All Documents"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <CardTitle className="text-destructive">
                            Danger Zone
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Account
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete your account,
                                    all your documents, and all associated data.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="py-4">
                                <Label htmlFor="confirm" className="text-sm">
                                    Type{" "}
                                    <span className="font-mono font-bold">
                                        DELETE
                                    </span>{" "}
                                    to confirm
                                </Label>
                                <Input
                                    id="confirm"
                                    value={confirmText}
                                    onChange={(e) =>
                                        setConfirmText(e.target.value)
                                    }
                                    placeholder="DELETE"
                                    className="mt-2"
                                />
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => setConfirmText("")}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAccount}
                                    className="bg-destructive hover:bg-destructive/90"
                                    disabled={
                                        confirmText !== "DELETE" ||
                                        deletingAccount
                                    }
                                >
                                    {deletingAccount
                                        ? "Deleting..."
                                        : "Delete Account Permanently"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}
