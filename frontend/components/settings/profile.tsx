// app/dashboard/settings/profile/page.tsx
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Upload, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {toast} from "sonner"
import { useUser } from "@/hooks/use-user"
import { get } from "http"

interface ProfileData {
  name: string
  email: string
  bio?: string | null
  avatar_url?: string | null
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Avatar Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info Card Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-3 w-56" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProfilePage(userData: 
    {
    id?: string | null
    email?: string | null
    user_metadata?: Record<string, any>
  } | null) {
  const { user, profile: userProfile, loading: userLoading } = useUser()
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    bio: "",
    avatar_url: null,
  })

  

  useEffect(() => {
    if (user && userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: user.email || "",
        bio: userProfile.bio || "",
        avatar_url: userProfile.avatar_url || null,
      })
    }
  }, [user, userProfile])

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/v1/profile`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: profile.name,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
          }),
        }
      )

      if (!response.ok) throw new Error("Failed to update profile")

      toast.success("Your profile has been updated.", { position: "top-right" })
      setHasChanges(false)
    } catch (error) {
      toast.error("Failed to update profile. Please try again.", { position: "top-right" })
    } finally {
      setSaving(false)
    }
  }

  if (userLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your public profile information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a profile picture (Cloudinary integration coming soon)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <div>
              <Button variant="outline" disabled>
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={userData?.user_metadata?.name as string || profile.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={userData?.email as string || profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Brief description for your profile
            </p>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (userProfile) {
                setProfile({
                  name: userProfile.name || "",
                  email: user?.email || "",
                  bio: userProfile.bio || "",
                  avatar_url: userProfile.avatar_url || null,
                })
              }
              setHasChanges(false)
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