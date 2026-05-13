// app/dashboard/settings/account/page.tsx
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
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
import {toast} from "sonner"
import { useUser } from "@/hooks/use-user"

interface AccountPreferences {
  language: string
  timezone: string
  email_notifications: boolean
}

function AccountSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Appearance Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AccountPage() {
  const { theme, setTheme } = useTheme()
  const { user, profile, loading: userLoading } = useUser()
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [preferences, setPreferences] = useState<AccountPreferences>({
    language: "en",
    timezone: "UTC",
    email_notifications: true,
  })
  const [savedPreferences, setSavedPreferences] = useState<AccountPreferences>(preferences)

  const hasChanges = preferences.language !== savedPreferences.language ||
    preferences.timezone !== savedPreferences.timezone ||
    preferences.email_notifications !== savedPreferences.email_notifications

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (profile?.preferences) {
      const merged: AccountPreferences = {
        language: profile.preferences.language || "en",
        timezone: profile.preferences.timezone || "UTC",
        email_notifications: profile.preferences.email_notifications ?? true,
      }
      setPreferences(merged)
      setSavedPreferences(merged)
    }
  }, [profile])

  const handleChange = (field: keyof AccountPreferences, value: any) => {
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
      toast.success("Your account preferences have been updated.", { position: "top-right" })
    } catch (error) {
      toast.error("Failed to update preferences. Please try again.", { position: "top-right" })
    } finally {
      setSaving(false)
    }
  }

  if (userLoading || !mounted) {
    return <AccountSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Account</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the interface looks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                className="w-full"
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                className="w-full"
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                className="w-full"
                onClick={() => setTheme("system")}
              >
                <Monitor className="mr-2 h-4 w-4" />
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Localization</CardTitle>
          <CardDescription>
            Set your language and timezone preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={preferences.language}
              onValueChange={(value) => handleChange("language", value)}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={preferences.timezone}
              onValueChange={(value) => handleChange("timezone", value)}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
                <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
                <SelectItem value="Australia/Sydney">Sydney (GMT+11)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Manage your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your account
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => handleChange("email_notifications", checked)}
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