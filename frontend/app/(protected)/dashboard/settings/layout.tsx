// app/dashboard/settings/layout.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  User, 
  Settings as SettingsIcon, 
  Database, 
  Sliders,
  Key
} from "lucide-react"
import { cn } from "@/lib/utils"

const settingsNav = [
  {
    title: "Profile",
    href: "/dashboard/settings/profile",
    icon: User,
  },
  {
    title: "Account",
    href: "/dashboard/settings/account",
    icon: SettingsIcon,
  },
  {
    title: "Preferences",
    href: "/dashboard/settings/preferences",
    icon: Sliders,
  },
  {
    title: "Data & Privacy",
    href: "/dashboard/settings/data",
    icon: Database,
  },
  {
    title: "API Keys",
    href: "/dashboard/settings/api-keys",
    icon: Key,
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/10 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}