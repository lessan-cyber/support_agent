// app/dashboard/settings/preferences/page.tsx
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Grid3x3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { useUser } from "@/hooks/use-user"

interface UserPreferences {
  default_view: "grid" | "list"
  items_per_page: number
  auto_download: boolean
}

function PreferencesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Document Display Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Upload Behavior Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-88" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PreferencesPage() {
  const { user, profile, loading: userLoading } = useUser()
  const [saving, setSaving] = useState(false)

  const [preferences, setPreferences] = useState<UserPreferences>({
    default_view: "grid",
    items_per_page: 12,
    auto_download: false,
  })
  const [savedPreferences, setSavedPreferences] = useState<UserPreferences>(preferences)

  const hasChanges = preferences.default_view !== savedPreferences.default_view ||
    preferences.items_per_page !== savedPreferences.items_per_page ||
    preferences.auto_download !== savedPreferences.auto_download

  useEffect(() => {
    if (profile?.preferences) {
      const merged: UserPreferences = {
        default_view: profile.preferences.default_view || "grid",
        items_per_page: profile.preferences.items_per_page || 12,
        auto_download: profile.preferences.auto_download || false,
      }
      setPreferences(merged)
      setSavedPreferences(merged)
    }
  }, [profile])

  const handleChange = (field: keyof UserPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/profile/preferences`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(preferences),
        }
      )

      if (!response.ok) throw new Error("Failed to update preferences")

      setSavedPreferences({ ...preferences })
      toast.success("Your preferences have been updated.", { position: "top-right" })
    } catch (error) {
      toast.error("Failed to update preferences. Please try again.", { position: "top-right" })
    } finally {
      setSaving(false)
    }
  }

  if (userLoading) {
    return <PreferencesSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Customize your experience and default behaviors
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Document Display</CardTitle>
          <CardDescription>
            Choose how you want to view your documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default View</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={preferences.default_view === "grid" ? "default" : "outline"}
                className="w-full"
                onClick={() => handleChange("default_view", "grid")}
              >
                <Grid3x3 className="mr-2 h-4 w-4" />
                Grid
              </Button>
              <Button
                variant={preferences.default_view === "list" ? "default" : "outline"}
                className="w-full"
                onClick={() => handleChange("default_view", "list")}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="items-per-page">Items Per Page</Label>
            <Select
              value={preferences.items_per_page.toString()}
              onValueChange={(value) => handleChange("items_per_page", parseInt(value))}
            >
              <SelectTrigger id="items-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 items</SelectItem>
                <SelectItem value="24">24 items</SelectItem>
                <SelectItem value="48">48 items</SelectItem>
                <SelectItem value="96">96 items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Behavior</CardTitle>
          <CardDescription>
            Configure what happens after uploading documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-download">Auto Download</Label>
              <p className="text-sm text-muted-foreground">
                Automatically download after successful upload
              </p>
            </div>
            <Switch
              id="auto-download"
              checked={preferences.auto_download}
              onCheckedChange={(checked) => handleChange("auto_download", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setPreferences({ ...savedPreferences })
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  )
}