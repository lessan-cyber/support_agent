// app/dashboard/settings/api-keys/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Copy,
    Eye,
    EyeOff,
    Key as KeyIcon,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { formatDistanceToNow } from "date-fns";

interface ApiKey {
    id: string;
    name: string;
    key: string;
    allowed_urls: string[];
    created_at: string;
    last_used_at: string | null;
}

function ApiKeysSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-36" />
            </div>

            {/* API Keys List Skeleton */}
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-5 w-32 rounded-full" />
                                    </div>
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-9 w-9" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* API URL Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>

            {/* React Component Example Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-96 w-full rounded-lg" />
                </CardContent>
            </Card>
        </div>
    );
}

export default function ApiKeysPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [allowedUrls, setAllowedUrls] = useState("");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const apiUrl =
        process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8000";
    if (!apiUrl) {
        console.error("NEXT_PUBLIC_BACKEND_BASE_URL is not configured");
    }

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/v1/api-keys`, {
                credentials: "include",
            });

            if (!response.ok) {
                const body = await response.text().catch(() => "");
                throw new Error(
                    `Failed to fetch API keys (${response.status}): ${body}`,
                );
            }

            const data = await response.json();
            setApiKeys(data.api_keys || []);
        } catch (error) {
            console.error("fetchApiKeys error:", error);
            toast.error("Failed to load API keys. Please try again.", {
                position: "top-right",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName.trim()) {
            toast.error("Please enter a name for the API key.", {
                position: "top-right",
            });
            return;
        }

        setCreating(true);
        try {
            const urls = allowedUrls
                .split(",")
                .map((url) => url.trim())
                .filter(Boolean);

            // Validate URLs if provided
            if (urls.length > 0) {
                const invalidUrls = urls.filter((url) => {
                    try {
                        new URL(url);
                        return false;
                    } catch {
                        return true;
                    }
                });

                if (invalidUrls.length > 0) {
                    toast.error(`Invalid URLs: ${invalidUrls.join(", ")}`, {
                        position: "top-right",
                    });
                    setCreating(false);
                    return;
                }
            }

            const response = await fetch(`${apiUrl}/api/v1/api-keys`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: newKeyName,
                    allowed_urls: urls,
                }),
            });

            if (!response.ok) {
                const body = await response.text().catch(() => "");
                throw new Error(
                    `Failed to create API key (${response.status}): ${body}`,
                );
            }

            const data = await response.json();
            setApiKeys([...apiKeys, data.api_key]);

            toast.success(
                "API key created successfully. Make sure to copy it now!",
                { position: "top-right" },
            );

            setShowCreateDialog(false);
            setNewKeyName("");
            setAllowedUrls("");
        } catch (error) {
            console.error("handleCreateKey error:", error);
            toast.error("Failed to create API key.", { position: "top-right" });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteKey = async (keyId: string) => {
        try {
            const response = await fetch(`${apiUrl}/api/v1/api-keys/${keyId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                const body = await response.text().catch(() => "");
                throw new Error(
                    `Failed to delete API key (${response.status}): ${body}`,
                );
            }

            setApiKeys(apiKeys.filter((key) => key.id !== keyId));

            toast.success("API key deleted successfully.", {
                position: "top-right",
            });
        } catch (error) {
            console.error("handleDeleteKey error:", error);
            toast.error("Failed to delete API key.", { position: "top-right" });
        }
        setDeleteKeyId(null);
    };

    const toggleKeyVisibility = (keyId: string) => {
        setVisibleKeys((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(keyId)) {
                newSet.delete(keyId);
            } else {
                newSet.add(keyId);
            }
            return newSet;
        });
    };

    const copyToClipboard = async (text: string, keyId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(keyId);
            setTimeout(() => setCopiedKey(null), 2000);
            toast.success("Copied to clipboard.", { position: "bottom-right" });
        } catch (error) {
            toast.error("Failed to copy to clipboard.", {
                position: "bottom-right",
            });
        }
    };

    const reactComponentCode = `import React, { useState } from 'react';

function DocumentUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('${apiUrl}/api/v1/documents/upload', {
        method: 'POST',
        headers: {
          'X-API-Key': 'YOUR_API_KEY_HERE'
        },
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log('Upload successful:', data);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload PDF'}
      </button>
    </div>
  );
}

export default DocumentUploader;`;

    if (loading) {
        return <ApiKeysSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">API Keys</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your API keys for programmatic access
                    </p>
                </div>
                <Dialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create API Key
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New API Key</DialogTitle>
                            <DialogDescription>
                                Generate a new API key for your application
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="key-name">Key Name</Label>
                                <Input
                                    id="key-name"
                                    value={newKeyName}
                                    onChange={(e) =>
                                        setNewKeyName(e.target.value)
                                    }
                                    placeholder="My Application"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="allowed-urls">
                                    Allowed URLs (comma-separated)
                                </Label>
                                <Input
                                    id="allowed-urls"
                                    value={allowedUrls}
                                    onChange={(e) =>
                                        setAllowedUrls(e.target.value)
                                    }
                                    placeholder="https://example.com, https://app.example.com"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to allow all domains
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateKey}
                                disabled={creating}
                            >
                                {creating ? "Creating..." : "Create Key"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* API Keys List */}
            {apiKeys.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <KeyIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">
                            No API keys yet
                        </p>
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First API Key
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                        <Card key={apiKey.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold">
                                                {apiKey.name}
                                            </h3>
                                            {apiKey.last_used_at && (
                                                <Badge variant="secondary">
                                                    Last used{" "}
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            apiKey.last_used_at,
                                                        ),
                                                        { addSuffix: true },
                                                    )}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={
                                                    visibleKeys.has(apiKey.id)
                                                        ? apiKey.key
                                                        : "•".repeat(32)
                                                }
                                                readOnly
                                                className="font-mono text-sm"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    toggleKeyVisibility(
                                                        apiKey.id,
                                                    )
                                                }
                                            >
                                                {visibleKeys.has(apiKey.id) ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        apiKey.key,
                                                        apiKey.id,
                                                    )
                                                }
                                            >
                                                {copiedKey === apiKey.id ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        {apiKey.allowed_urls.length > 0 && (
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">
                                                    Allowed URLs:{" "}
                                                </span>
                                                <span>
                                                    {apiKey.allowed_urls.join(
                                                        ", ",
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        <div className="text-xs text-muted-foreground">
                                            Created{" "}
                                            {formatDistanceToNow(
                                                new Date(apiKey.created_at),
                                                { addSuffix: true },
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                            setDeleteKeyId(apiKey.id)
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* API URL */}
            <Card>
                <CardHeader>
                    <CardTitle>API Base URL</CardTitle>
                    <CardDescription>
                        Use this URL for all API requests
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Input value={apiUrl} readOnly className="font-mono" />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(apiUrl, "api-url")}
                        >
                            {copiedKey === "api-url" ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* React Component Example */}
            <Card>
                <CardHeader>
                    <CardTitle>React Component Example</CardTitle>
                    <CardDescription>
                        Sample code for uploading documents using the API
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <SyntaxHighlighter
                            language="javascript"
                            style={vscDarkPlus}
                            customStyle={{
                                borderRadius: "0.5rem",
                                fontSize: "0.875rem",
                            }}
                        >
                            {reactComponentCode}
                        </SyntaxHighlighter>
                        <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() =>
                                copyToClipboard(
                                    reactComponentCode,
                                    "react-code",
                                )
                            }
                        >
                            {copiedKey === "react-code" ? (
                                <>
                                    <Check className="mr-2 h-4 w-4 text-green-600" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deleteKeyId}
                onOpenChange={() => setDeleteKeyId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this API key.
                            Applications using this key will no longer be able
                            to access your API.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                deleteKeyId && handleDeleteKey(deleteKeyId)
                            }
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Delete Key
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
