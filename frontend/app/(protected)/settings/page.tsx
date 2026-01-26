'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { SettingsSidebar } from '@/components/settings/settings-sidebar'
import { AccountSettings } from '@/components/settings/account-settings'
import { AppearanceSettings } from '@/components/settings/appearance-settings'
import { NotificationsSettings } from '@/components/settings/notifications-settings'
import { PrivacySettings } from '@/components/settings/privacy-settings'
import { BillingSettings } from '@/components/settings/billing-settings'
import { IntegrationsSettings } from '@/components/settings/integrations-settings'
import { DataSettings } from '@/components/settings/data-settings'
import { SupportSettings } from '@/components/settings/support-settings'

export default function SettingsPage() {
  const pathname = usePathname()
  const currentSection = pathname.split('/').pop() || 'account'

  const sectionTitles: Record<string, { title: string; description: string }> = {
    account: {
      title: 'Account Settings',
      description: 'Manage your account information and security',
    },
    appearance: {
      title: 'Appearance',
      description: 'Customize how the interface looks',
    },
    notifications: {
      title: 'Notifications',
      description: 'Control how and when you receive notifications',
    },
    privacy: {
      title: 'Privacy & Security',
      description: 'Manage your privacy and security settings',
    },
    billing: {
      title: 'Billing & Subscription',
      description: 'Manage your subscription and payment methods',
    },
    integrations: {
      title: 'Integrations',
      description: 'Connect external services to enhance your workflow',
    },
    data: {
      title: 'Data & Storage',
      description: 'Manage your data and storage usage',
    },
    support: {
      title: 'Help & Support',
      description: 'Get help and contact our support team',
    },
  }

  const renderContent = () => {
    switch (currentSection) {
      case 'account':
        return <AccountSettings />
      case 'appearance':
        return <AppearanceSettings />
      case 'notifications':
        return <NotificationsSettings />
      case 'privacy':
        return <PrivacySettings />
      case 'billing':
        return <BillingSettings />
      case 'integrations':
        return <IntegrationsSettings />
      case 'data':
        return <DataSettings />
      case 'support':
        return <SupportSettings />
      default:
        return <AccountSettings />
    }
  }

  const sectionInfo = sectionTitles[currentSection] || sectionTitles.account

  return (
    <div className="flex h-full w-full gap-0">
      {/* Sidebar */}
      <SettingsSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header based on section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{sectionInfo.title}</h1>
            <p className="text-muted-foreground mt-2">{sectionInfo.description}</p>
          </div>

          {/* Content */}
          <div className="bg-card rounded-lg border border-border p-6">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  )
}