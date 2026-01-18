'use client'

import { LogOut, User, Settings } from 'lucide-react'
import { useState } from 'react'
import { useUser } from '@/hooks/use-user'
import { signOut } from '@/app/actions/auth'
import { useTransition } from 'react'

export default function SignoutPage() {
  return <div>Signout Page
    <UserButton />
  </div>
}

export function UserButton() {
  const { user, profile, loading } = useUser()
  const [showMenu, setShowMenu] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut()
    })
  }

  if (loading || !user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-primary-foreground">
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium">{profile?.name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </button>

      {showMenu && (
        <>
          {/* Overlay pour fermer le menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-background border rounded-md shadow-lg z-50">
            <div className="p-2">
              <div className="px-3 py-2 border-b mb-2">
                <p className="font-medium text-sm">{profile?.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              
              <button
                onClick={() => {
                  setShowMenu(false)
                  // Navigation vers les paramètres
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors text-left"
              >
                <Settings className="h-4 w-4" />
                Paramètres
              </button>
              
              <button
                onClick={handleSignOut}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors text-left disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {isPending ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}