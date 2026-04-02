'use client'

import { useEffect, useState } from 'react'
import { getUser } from '@/app/actions/auth'

/**
 * Represents a user profile with personal and account information.
 */
interface Profile {
  id: string
  name: string
  email: string
  avatar_url?: string
  bio?: string
  preferences?: Record<string, any>
  created_at: string
  updated_at: string
}

interface SimpleUser {
  id: string
  email: string | null
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
}

/**
 * Custom hook to get the current authenticated user.
 * Uses server action to fetch user securely.
 * @returns {{ user: SimpleUser | null, profile: Profile | null, loading: boolean }}
 */

export function useUser() {
  const [user, setUser] = useState<SimpleUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initUser = async () => {
      try {
        setLoading(true)
        const userData = await getUser()
        console.log('[useUser] userData:', userData?.email)
        
        if (userData) {
          // setUser(userData) --- IGNORE ---
          console.log('[useUser] User set:', userData.email)
          // Profile est null car getUser() retourne seulement l'utilisateur
          setProfile(null)
        } else {
          console.log('[useUser] No user data returned')
          setUser(null)
          setProfile(null)
        }
      } catch (error) {
        console.error('Error initializing user:', error)
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    initUser()
  }, [])

  return { user, profile, loading }
}
