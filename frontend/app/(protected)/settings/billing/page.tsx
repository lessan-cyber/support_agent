'use client'

import React from 'react'
import { SettingsLayout } from '@/components/dashboard/settings-layout'
import { AppearanceSettings } from '@/components/settings/appearance-settings'

export default function AppearancePage() {
  return (
    <SettingsLayout currentSection="appearance">
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Appearance</h1>
          <p className="text-muted-foreground mt-2">
            Customize how the interface looks
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <AppearanceSettings />
        </div>
      </div>
    </SettingsLayout>
  )
}
